"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
	InventoryItemStatus,
	type InventoryCategoryEntity,
} from "@/common/api/inventory";

import { useCreateItem } from "@/common/api/inventory";
import { type LocationEntity } from "@/common/api/location";
import { type OrganizerEntity } from "@/common/api/organizer";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFirebase } from "@/common/context/FirebaseProvider";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, Shuffle, X, Printer } from "lucide-react";

import JsBarcode from "jsbarcode";

const formSchema = z
	.object({
		name: z.string().optional(),
		assetTag: z.string().optional(),
		serialNumber: z.string().optional(),
		notes: z.string().optional(),
		categoryId: z.string().min(1, "Category is required"),
		status: z.nativeEnum(InventoryItemStatus).optional(),
		holderLocationId: z.string().min(1, "Initial location is required"),
		holderOrganizerId: z.string().optional(),
	})
	.refine((data) => data.name || data.assetTag, {
		message: "Either Name or Asset Tag must be provided.",
		path: ["name"],
	});

type ItemFormValues = z.infer<typeof formSchema>;

interface ItemFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: InventoryCategoryEntity[];
	locations: LocationEntity[];
	organizers: OrganizerEntity[];
}

// Generate random asset tag (13 digits just like before, but format irrelevant for CODE128)
const generateAssetTag = () => {
	const number = Math.floor(Math.random() * 9999999999999)
		.toString()
		.padStart(13, "0");
	return `${number}`;
};

export function ItemFormDialog({
	open,
	onOpenChange,
	categories,
	locations,
	organizers,
}: ItemFormDialogProps) {
	const { user } = useFirebase();
	const createMutation = useCreateItem();
	const [showScanner, setShowScanner] = useState(false);

	const form = useForm<ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			status: InventoryItemStatus.ACTIVE,
			holderOrganizerId: user?.uid || undefined,
		},
	});

	// Default assigned person
	useEffect(() => {
		if (open && user?.uid) {
			form.setValue("holderOrganizerId", user.uid);
		}
	}, [open, user?.uid, form]);

	const onSubmit = (values: ItemFormValues) => {
		const payload = {
			...values,
			categoryId: Number.parseInt(values.categoryId, 10),
			holderLocationId: Number.parseInt(values.holderLocationId, 10),
			holderOrganizerId:
				values.holderOrganizerId === "unassigned"
					? undefined
					: values.holderOrganizerId,
		};
		createMutation.mutate(payload, {
			onSuccess: () => {
				toast.success("Item created successfully.");
				form.reset({
					status: InventoryItemStatus.ACTIVE,
					holderOrganizerId: user?.uid || undefined,
				});
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(`Failed to create item: ${error.message}`);
			},
		});
	};

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

	// ---------------------- PRINT (popup window) ----------------------
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
            svg { width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <svg id="barcode"></svg>
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
					margin: 2,
					textMargin: 2,
					valid: (valid: boolean) => {
						if (!valid) throw new Error("Invalid data for CODE128");
					},
				});
				// Wait a tick for layout
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
	// -----------------------------------------------------------------

	const getCurrentUserName = () => {
		if (!user?.uid) return "Current User";
		const currentUser = organizers.find((o) => o.id === user.uid);
		return currentUser
			? `${currentUser.firstName} ${currentUser.lastName}`
			: "Current User";
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Create Item</DialogTitle>
						<DialogDescription>
							Add a new item to your inventory. An initial location is required
							for tracking purposes. The item will be assigned to you by
							default.
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
						>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="MacBook Pro 16" {...field} />
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
											<div className="flex gap-2">
												<Input placeholder="IT-00123" {...field} />
												<Button
													type="button"
													variant="outline"
													size="icon"
													onClick={handleGenerateAssetTag}
													title="Generate random asset tag"
												>
													<Shuffle className="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="outline"
													size="icon"
													onClick={() => setShowScanner(true)}
													title="Scan asset tag"
												>
													<QrCode className="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="outline"
													size="icon"
													onClick={handlePrintBarcode}
													title="Print barcode"
												>
													<Printer className="h-4 w-4" />
												</Button>
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
											<Input placeholder="C02X..." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="categoryId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Category</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a category" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{categories.map((c) => (
													<SelectItem key={c.id} value={String(c.id)}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="holderLocationId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Initial Location *</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select initial location" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{locations.map((l) => (
													<SelectItem key={l.id} value={String(l.id)}>
														{l.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="holderOrganizerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Assigned Person (Defaults to you)</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue
														placeholder={`Defaulted to ${getCurrentUserName()}`}
													/>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="unassigned">Unassigned</SelectItem>
												{organizers.map((o) => (
													<SelectItem key={o.id} value={o.id}>
														{`${o.firstName} ${o.lastName}`}
														{o.id === user?.uid && (
															<Badge
																variant="secondary"
																className="ml-2 text-xs"
															>
																You
															</Badge>
														)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Any relevant notes about the item."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter className="md:col-span-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={createMutation.isPending}>
									{createMutation.isPending ? "Creating..." : "Create"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>

				{/* Scanner Dialog */}
				<Dialog open={showScanner} onOpenChange={setShowScanner}>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Scan Asset Tag</DialogTitle>
							<DialogDescription>
								Point your camera at the barcode or QR code to scan the asset
								tag.
							</DialogDescription>
						</DialogHeader>
						<div className="relative">
							<Scanner
								onScan={handleScanResult}
								onError={handleScanError}
								formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8"]}
								components={{
									finder: true,
									torch: true,
								}}
								styles={{
									container: { width: "100%", height: "300px" },
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
