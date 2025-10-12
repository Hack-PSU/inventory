"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
    InventoryItemEntity
} from "@/common/api/inventory";

import { useUpdateItem } from "@/common/api/inventory";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase } from "@/common/context/FirebaseProvider";
import { useEffect, useState } from "react";

import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, Shuffle, X, Printer } from "lucide-react";
import { CameraSelector } from "./camera-selector";

import JsBarcode from "jsbarcode";

const formSchema = z
    .object({
		name: z.string().optional(),
		assetTag: z.string().optional(),
		serialNumber: z.string().optional(),
		notes: z.string().optional()
	})

type ItemFormValues = z.infer<typeof formSchema>;

interface ItemEditDialogProps {
    open: boolean;
    item: InventoryItemEntity;
    onOpenChange: (open: boolean) => void;
}

// Generate random asset tag (13 digits just like before, but format irrelevant for CODE128)
const generateAssetTag = () => {
    const number = Math.floor(Math.random() * 9999999999999)
        .toString()
        .padStart(13, "0");
    return `${number}`;
};

// Get the form defaults; used to update the dialog later on reset
function getDefaultsFromItem(item: InventoryItemEntity) {
    return {
        name: item.name ?? "",
        assetTag: item.assetTag ?? "",
        serialNumber: item.serialNumber ?? "",
        notes: item.notes ?? ""
    };
}

export function ItemEditDialog({
    open,
    item,
    onOpenChange
}: ItemEditDialogProps) {
    const updateMutation = useUpdateItem();
    const defaultValues = getDefaultsFromItem(item);
    const [showScanner, setShowScanner] = useState(false);
    const [selectedCameraId, setSelectedCameraId] = useState<string>("");

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues,
    });

    // Reset the form
    useEffect(() => {
        if (open) form.reset(defaultValues);
    }, [open, form]);

    const onSubmit = (values: ItemFormValues) => {
        const payload = {...values};
        updateMutation.mutate({ id: item.id, data: payload }, {
            onSuccess: () => {
                toast.success("Item updated successfully.");
                onOpenChange(false);
            },
            onError: (error) => {
                toast.error(`Failed to create item: ${error.message}`);
            },
        });
    };

    /* Asset tag Generation Stuff */
    const handleGenerateAssetTag = () => {
        const newTag = generateAssetTag();
        form.setValue("assetTag", newTag);
        toast.success(`Generated asset tag: ${newTag}`);
    };

    const handleScanResult = (result: any[]) => {
        if (result && result.length > 0) {
            const scannedValue = result[0].rawValue;
            form.setValue("assetTag", scannedValue);
            setShowScanner(false);
            toast.success(`Scanned asset tag: ${scannedValue}`);
        }
    };

    const handleScanError = (error: unknown) => {
        console.error("Scan error:", error);
        toast.error("Failed to access camera. Please check permissions.");
    };

    const handlePrintBarcode = () => {
        const raw = form.getValues("assetTag")?.trim();
        if (!raw) {
            toast.error("Enter or generate an asset tag first.");
            return;
        }
        if (typeof window === "undefined") return;

        const w = window.open("", "PRINT", "width=600,height=400");
        if (!w) {
            toast.error("Popup blocked by browser.");
            return;
        }

        w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print Barcode</title>
        <style>
          @page { size: 2in 1in; margin: 0; }
          html, body {
            margin: 0;
            width: 2in;
            height: 1in;
          }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          /* Padding INSIDE the label for visual margin */
          #wrap {
            width: 100%;
            height: 100%;
            padding: 0.08in;            /* adjust as needed */
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          svg { width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div id="wrap">
          <svg id="barcode"></svg>
        </div>
      </body>
    </html>
  `);
        w.document.close();

        const doPrint = () => {
            try {
                const svg = w.document.querySelector("#barcode");
                if (!svg) throw new Error("SVG not found in print window");
                JsBarcode(svg, raw, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 12,
                    height: 40,
                    margin: 0,
                    textMargin: 2,
                });

                setTimeout(() => {
                    w.focus();
                    w.print();
                    w.close();
                }, 100);
            } catch (err) {
                console.error(err);
                toast.error("Failed to generate barcode.");
                w.close();
            }
        };

        if (w.document.readyState === "complete") {
            doPrint();
        } else {
            w.onload = doPrint;
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                        <DialogDescription>
                            Edit an item's details below. Fields highlighted in blue represents <strong><em>edited values.</em></strong>
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    className={field.value == defaultValues.name ? "" : "border-blue-500 bg-blue-50"}
                                                    placeholder={item.name ?? "No current name"} {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="assetTag"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Asset Tag</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    <Input
                                                        className={field.value == defaultValues.assetTag ? "" : "border-blue-500 bg-blue-50"}
                                                        placeholder={item.assetTag ?? "IT-00123"} {...field}
                                                    />
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleGenerateAssetTag}
                                                            className="flex-1 min-w-0"
                                                        >
                                                            <Shuffle className="h-4 w-4 mr-2" />
                                                            Generate
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowScanner(true)}
                                                            className="flex-1 min-w-0"
                                                        >
                                                            <QrCode className="h-4 w-4 mr-2" />
                                                            Scan
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handlePrintBarcode}
                                                            className="flex-1 min-w-0"
                                                        >
                                                            <Printer className="h-4 w-4 mr-2" />
                                                            Print
                                                        </Button>
                                                    </div>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="serialNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Serial Number</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    className={field.value == defaultValues.serialNumber ? "" : "border-blue-500 bg-blue-50"}
                                                    placeholder={item.serialNumber ?? "C02X..."} {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    className={field.value == defaultValues.notes ? "" : "border-blue-500 bg-blue-50"}
                                                    placeholder="Any relevant notes about the item."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto text-red-500"
                                    onClick={() => form.reset(defaultValues)}
                                >
                                    Revert to Original
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="w-full sm:w-auto"
                                >
                                    {updateMutation.isPending ? "Updating..." : "Update"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>

                {/* Scanner Dialog */}
                <Dialog open={showScanner} onOpenChange={setShowScanner}>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Scan Asset Tag</DialogTitle>
                            <DialogDescription>
                                Point your camera at the barcode or QR code to scan the asset
                                tag.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                            <CameraSelector
                                selectedDeviceId={selectedCameraId}
                                onDeviceChange={setSelectedCameraId}
                                className="justify-center"
                            />
                            <div className="relative">
                                <Scanner
                                    onScan={handleScanResult}
                                    onError={handleScanError}
                                    formats={[
                                        "qr_code",
                                        "code_128",
                                        "code_39",
                                        "ean_13",
                                        "ean_8",
                                    ]}
                                    constraints={{
                                        deviceId: selectedCameraId
                                            ? { exact: selectedCameraId }
                                            : undefined,
                                    }}
                                    components={{
                                        finder: true,
                                        torch: true,
                                    }}
                                    styles={{
                                        container: { width: "100%", height: "250px" },
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                                    onClick={() => setShowScanner(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                            Printing uses CODE128. Scanner supports QR, Code128, Code39,
                            EAN-13/8.
                        </div>
                    </DialogContent>
                </Dialog>
            </Dialog>
        </>
    );
}
