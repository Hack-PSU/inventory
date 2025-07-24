"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
	InventoryItemStatus,
	type InventoryCategoryEntity,
	useCreateItem,
} from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";
import type { OrganizerEntity } from "@/common/api/organizer";
import { useFirebase } from "@/common/context/FirebaseProvider";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
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
            #wrap {
              width: 100%;
              height: 100%;
              padding: 0.08in;
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
				<DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] p-0">
					<DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
						<DialogTitle className="text-lg sm:text-xl">
							Create Item
						</DialogTitle>
						<DialogDescription className="text-sm">
							Add a new item to your inventory. An initial location is required
							for tracking purposes.
						</DialogDescription>
					</DialogHeader>

					<ScrollArea className="max-h-[calc(90vh-120px)] px-4 sm:px-6">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4 pb-4"
							>
								{/* Name Field */}
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-medium">
												Name
											</FormLabel>
											<FormControl>
												<Input
													placeholder="MacBook Pro 16"
													className="h-10"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Asset Tag Field with Action Buttons */}
								<FormField
									control={form.control}
									name="assetTag"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-medium">
												Asset Tag
											</FormLabel>
											<FormControl>
												<div className="space-y-2">
													<Input
														placeholder="IT-00123"
														className="h-10"
														{...field}
													/>
													{/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
													<div className="flex flex-col sm:flex-row gap-2">
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={handleGenerateAssetTag}
															className="flex-1 h-9 text-xs bg-transparent"
														>
															<Shuffle className="h-3 w-3 mr-2" />
															Generate
														</Button>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() => setShowScanner(true)}
															className="flex-1 h-9 text-xs"
														>
															<QrCode className="h-3 w-3 mr-2" />
															Scan
														</Button>
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={handlePrintBarcode}
															className="flex-1 h-9 text-xs bg-transparent"
														>
															<Printer className="h-3 w-3 mr-2" />
															Print
														</Button>
													</div>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Two Column Layout for larger screens, single column for mobile */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="serialNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-medium">
													Serial Number
												</FormLabel>
												<FormControl>
													<Input
														placeholder="C02X..."
														className="h-10"
														{...field}
													/>
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
												<FormLabel className="text-sm font-medium">
													Category
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="h-10">
															<SelectValue placeholder="Select category" />
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
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="holderLocationId"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-medium">
													Initial Location *
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="h-10">
															<SelectValue placeholder="Select location" />
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
												<FormLabel className="text-sm font-medium">
													Assigned Person
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="h-10">
															<SelectValue
																placeholder={`Default: ${getCurrentUserName()}`}
															/>
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="unassigned">
															Unassigned
														</SelectItem>
														{organizers.map((o) => (
															<SelectItem key={o.id} value={o.id}>
																<div className="flex items-center gap-2">
																	<span>{`${o.firstName} ${o.lastName}`}</span>
																	{o.id === user?.uid && (
																		<Badge
																			variant="secondary"
																			className="text-xs"
																		>
																			You
																		</Badge>
																	)}
																</div>
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-sm font-medium">
												Notes
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Any relevant notes about the item."
													className="min-h-[80px] resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</form>
						</Form>
					</ScrollArea>

					<DialogFooter className="px-4 pb-4 sm:px-6 sm:pb-6 flex-col sm:flex-row gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="w-full sm:w-auto order-2 sm:order-1"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
							onClick={form.handleSubmit(onSubmit)}
							className="w-full sm:w-auto order-1 sm:order-2"
						>
							{createMutation.isPending ? "Creating..." : "Create Item"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Scanner Dialog - Mobile Optimized */}
			<Dialog open={showScanner} onOpenChange={setShowScanner}>
				<DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] p-0">
					<DialogHeader className="px-4 pt-4 pb-2">
						<DialogTitle className="text-lg">Scan Asset Tag</DialogTitle>
						<DialogDescription className="text-sm">
							Point your camera at the barcode or QR code.
						</DialogDescription>
					</DialogHeader>

					<div className="relative mx-4 mb-4">
						<Scanner
							onScan={handleScanResult}
							onError={handleScanError}
							formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8"]}
							components={{
								finder: true,
								torch: true,
							}}
							styles={{
								container: {
									width: "100%",
									height: "280px",
									borderRadius: "8px",
									overflow: "hidden",
								},
							}}
						/>
						<Button
							variant="outline"
							size="icon"
							className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm h-8 w-8"
							onClick={() => setShowScanner(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="px-4 pb-4 text-xs text-muted-foreground text-center">
						Supports QR, Code128, Code39, EAN-13/8 formats
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
