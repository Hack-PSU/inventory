"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
	MovementReason,
	type InventoryItemEntity,
} from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";
import type { OrganizerEntity } from "@/common/api/organizer";
import { useCreateMovement } from "@/common/api/inventory";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useFirebase } from "@/common/context/FirebaseProvider";

import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, X } from "lucide-react";
import { CameraSelector } from "./camera-selector";

import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandItem,
} from "@/components/ui/command";

const formSchema = z
	.object({
		itemId: z.string().min(1, "Item is required"),
		reason: z.nativeEnum(MovementReason),
		fromLocationId: z.string().optional(),
		fromOrganizerId: z.string().optional(),
		toLocationId: z.string().optional(),
		toOrganizerId: z.string().optional(),
		notes: z.string().optional(),
	})
	.refine((data) => data.toLocationId || data.toOrganizerId, {
		message: "Either 'To Location' or 'To Person' must be specified.",
		path: ["toLocationId"],
	});

type MovementFormValues = z.infer<typeof formSchema>;

interface MovementFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: InventoryItemEntity[];
	locations: LocationEntity[];
	organizers: OrganizerEntity[];
}

export function MovementFormDialog({
	open,
	onOpenChange,
	items,
	locations,
	organizers,
}: MovementFormDialogProps) {
	const { user } = useFirebase();
	const createMutation = useCreateMovement();
	const [showScanner, setShowScanner] = useState(false);
	const [selectedCameraId, setSelectedCameraId] = useState<string>("");

	const form = useForm<MovementFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			toOrganizerId: user?.uid || undefined,
		},
	});

	const selectedItemId = form.watch("itemId");
	const selectedItem = items.find((item) => item.id === selectedItemId);

	// Set default "to person" when dialog opens and user is available
	useEffect(() => {
		if (open && user?.uid) {
			form.setValue("toOrganizerId", user.uid);
		}
	}, [open, user?.uid, form]);

	// Auto-populate "from" fields when item is selected
	useEffect(() => {
		if (selectedItem) {
			if (selectedItem.holderLocationId) {
				form.setValue("fromLocationId", String(selectedItem.holderLocationId));
			} else {
				form.setValue("fromLocationId", undefined);
			}

			if (selectedItem.holderOrganizerId) {
				form.setValue("fromOrganizerId", selectedItem.holderOrganizerId);
			} else {
				form.setValue("fromOrganizerId", undefined);
			}
		}
	}, [selectedItem, form]);

	const onSubmit = (values: MovementFormValues) => {
		const payload = {
			...values,
			fromLocationId: values.fromLocationId
				? Number.parseInt(values.fromLocationId, 10)
				: undefined,
			toLocationId: values.toLocationId
				? Number.parseInt(values.toLocationId, 10)
				: undefined,
			// Handle unassigned values
			toOrganizerId:
				values.toOrganizerId === "unassigned"
					? undefined
					: values.toOrganizerId,
		};
		createMutation.mutate(payload, {
			onSuccess: () => {
				toast.success("Movement created successfully.");
				form.reset({
					toOrganizerId: user?.uid || undefined,
				});
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(`Failed to create movement: ${error.message}`);
			},
		});
	};

	const handleScanResult = (result: any[]) => {
		if (result && result.length > 0) {
			const scannedValue = result[0].rawValue;

			// Find item by asset tag or name
			const foundItem = items.find(
				(item) =>
					item.assetTag === scannedValue ||
					item.name === scannedValue ||
					item.id === scannedValue
			);

			if (foundItem) {
				form.setValue("itemId", foundItem.id);
				setShowScanner(false);
				toast.success(`Selected item: ${foundItem.name || foundItem.assetTag}`);
			} else {
				toast.error(`No item found with code: ${scannedValue}`);
			}
		}
	};

	const handleScanError = (error: unknown) => {
		console.error("Scan error:", error);
		toast.error("Failed to access camera. Please check permissions.");
	};

	const getCurrentHolder = () => {
		if (!selectedItem) return null;

		const parts = [];
		if (selectedItem.holderLocationId) {
			const location = locations.find(
				(l) => l.id === selectedItem.holderLocationId
			);
			if (location) {
				parts.push(
					<div key="location" className="flex items-center gap-1">
						<Badge variant="secondary" className="text-xs">
							Location
						</Badge>
						<span className="text-sm">{location.name}</span>
					</div>
				);
			}
		}

		if (selectedItem.holderOrganizerId) {
			const organizer = organizers.find(
				(o) => o.id === selectedItem.holderOrganizerId
			);
			if (organizer) {
				parts.push(
					<div key="organizer" className="flex items-center gap-1">
						<Badge variant="secondary" className="text-xs">
							Person
						</Badge>
						<span className="text-sm">{`${organizer.firstName} ${organizer.lastName}`}</span>
					</div>
				);
			}
		}

		if (parts.length === 0) {
			return <span className="text-muted-foreground text-sm">Unassigned</span>;
		}

		return <div className="space-y-1">{parts}</div>;
	};

	const getCurrentUserName = () => {
		if (!user?.uid) return "Current User";
		const currentUser = organizers.find((o) => o.id === user.uid);
		return currentUser
			? `${currentUser.firstName} ${currentUser.lastName}`
			: "Current User";
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[calc(100vw-2rem)] max-w-[700px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create Movement</DialogTitle>
					<DialogDescription>
						Record a new inventory movement. The &quot;from&quot; fields are
						automatically populated based on the item&apos;s current holder. The
						&quot;to person&quot; defaults to you but can be changed.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="itemId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Item</FormLabel>
										<div className="flex gap-2">
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select an item or scan barcode" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{items.map((i) => (
														<SelectItem key={i.id} value={i.id}>
															{i.name || i.assetTag}{" "}
															{i.assetTag && i.name && `(${i.assetTag})`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => setShowScanner(true)}
												title="Scan item barcode"
											>
												<QrCode className="h-4 w-4" />
											</Button>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							{selectedItem && (
								<div className="p-3 bg-muted rounded-lg">
									<div className="text-sm font-medium mb-2">
										Current Holder:
									</div>
									{getCurrentHolder()}
								</div>
							)}

							<FormField
								control={form.control}
								name="reason"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Reason</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a reason" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{Object.values(MovementReason).map((r) => (
													<SelectItem key={r} value={r}>
														{r}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-6">
							{/* FROM Section */}
							<div className="space-y-4">
								<div className="text-sm font-medium text-muted-foreground border-b pb-2 mb-4">
									FROM (Auto-populated)
								</div>
								<FormField
									control={form.control}
									name="fromLocationId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>From Location</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value || ""}
											>
												<FormControl>
													<SelectTrigger className="bg-muted">
														<SelectValue placeholder="Auto-populated" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">None</SelectItem>
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
									name="fromOrganizerId"
									render={({ field }) => {
										const [isPopoverOpen, setIsPopoverOpen] = useState(false);
										const [query, setQuery] = useState("");

										const filteredOrganizers = organizers.filter((o) => {
											const fullName = `${o.firstName} ${o.lastName}`.toLowerCase();
											return (
												fullName.includes(query.toLowerCase()) ||
												o.email?.toLowerCase().includes(query.toLowerCase())
											);
										});

										const selectedOrganizer =
											organizers.find((o) => o.id === field.value) || null;

										return (
											<FormItem>
												<FormLabel className="text-sm">From Person</FormLabel>
												<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															role="combobox"
															className="w-full justify-between bg-muted"
															onClick={() => setIsPopoverOpen(!isPopoverOpen)}
														>
															{selectedOrganizer ? (
																<span>
																	{selectedOrganizer.firstName} {selectedOrganizer.lastName}
																	{selectedOrganizer.id === user?.uid && (
																		<Badge variant="secondary" className="ml-2 text-xs">
																			You
																		</Badge>
																	)}
																</span>
															) : (
																<span className="text-muted-foreground">
																	Auto-populated or select manually
																</span>
															)}
														</Button>
													</PopoverTrigger>

													<PopoverContent
														className="w-[var(--radix-popover-trigger-width)] p-0"
														side="bottom"
														align="start"
													>
														<Command shouldFilter={false}>
															<CommandInput
																placeholder="Search for a person..."
																value={query}
																onValueChange={setQuery}
																className="border-none focus:ring-0"
															/>
															<CommandList className="max-h-[200px]">
																{filteredOrganizers.length === 0 ? (
																	<CommandEmpty>
																		{query ? "No matches found." : "Start typing to search."}
																	</CommandEmpty>
																) : (
																	<>
																		<CommandItem
																			onSelect={() => {
																				field.onChange(undefined);
																				setIsPopoverOpen(false);
																			}}
																		>
																			None
																		</CommandItem>
																		{filteredOrganizers.map((o) => (
																			<CommandItem
																				key={o.id}
																				onSelect={() => {
																					field.onChange(o.id);
																					setIsPopoverOpen(false);
																				}}
																			>
																				<div className="flex flex-col">
																					<span className="font-medium">
																						{o.firstName} {o.lastName}
																						{o.id === user?.uid && (
																							<Badge
																								variant="secondary"
																								className="ml-2 text-xs"
																							>
																								You
																							</Badge>
																						)}
																					</span>
																					{o.email && (
																						<span className="text-xs text-muted-foreground">
																							{o.email}
																						</span>
																					)}
																				</div>
																			</CommandItem>
																		))}
																	</>
																)}
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>

							{/* TO Section */}
							<div className="space-y-4">
								<div className="text-sm font-medium text-muted-foreground border-b pb-2 mb-4">
									TO (At least one required)
								</div>
								<FormField
									control={form.control}
									name="toLocationId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>To Location</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value || ""}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select destination location" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="none">None</SelectItem>
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
									name="toOrganizerId"
									render={({ field }) => {
										const [isPopoverOpen, setIsPopoverOpen] = useState(false);
										const [query, setQuery] = useState("");

										const filteredOrganizers = organizers.filter((o) => {
											const fullName = `${o.firstName} ${o.lastName}`.toLowerCase();
											return (
												fullName.includes(query.toLowerCase()) ||
												o.email?.toLowerCase().includes(query.toLowerCase())
											);
										});

										const selectedOrganizer =
											organizers.find((o) => o.id === field.value) || null;

										return (
											<FormItem>
												<FormLabel className="text-sm">To Person</FormLabel>
												<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															role="combobox"
															className="w-full justify-between"
															onClick={() => setIsPopoverOpen(!isPopoverOpen)}
														>
															{selectedOrganizer ? (
																<span>
																	{selectedOrganizer.firstName} {selectedOrganizer.lastName}
																	{selectedOrganizer.id === user?.uid && (
																		<Badge variant="secondary" className="ml-2 text-xs">
																			You
																		</Badge>
																	)}
																</span>
															) : (
																<span className="text-muted-foreground">
																	{`Defaulted to ${getCurrentUserName()}`}
																</span>
															)}
														</Button>
													</PopoverTrigger>

													<PopoverContent
														className="w-[var(--radix-popover-trigger-width)] p-0"
														side="bottom"
														align="start"
													>
														<Command shouldFilter={false}>
															<CommandInput
																placeholder="Search for a person..."
																value={query}
																onValueChange={setQuery}
																className="border-none focus:ring-0"
															/>
															<CommandList className="max-h-[200px]">
																{filteredOrganizers.length === 0 ? (
																	<CommandEmpty>
																		{query ? "No matches found." : "Start typing to search."}
																	</CommandEmpty>
																) : (
																	<>
																		<CommandItem
																			onSelect={() => {
																				field.onChange("unassigned");
																				setIsPopoverOpen(false);
																			}}
																		>
																			Unassigned
																		</CommandItem>
																		{filteredOrganizers.map((o) => (
																			<CommandItem
																				key={o.id}
																				onSelect={() => {
																					field.onChange(o.id);
																					setIsPopoverOpen(false);
																				}}
																			>
																				<div className="flex flex-col">
																					<span className="font-medium">
																						{o.firstName} {o.lastName}
																						{o.id === user?.uid && (
																							<Badge
																								variant="secondary"
																								className="ml-2 text-xs"
																							>
																								You
																							</Badge>
																						)}
																					</span>
																					{o.email && (
																						<span className="text-xs text-muted-foreground">
																							{o.email}
																						</span>
																					)}
																				</div>
																			</CommandItem>
																		))}
																	</>
																)}
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>
						</div>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea placeholder="Movement notes..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
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
								disabled={createMutation.isPending}
								className="w-full sm:w-auto"
							>
								{createMutation.isPending ? "Creating..." : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>

			{/* Scanner Dialog */}
			<Dialog open={showScanner} onOpenChange={setShowScanner}>
				<DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[90vh]">
					<DialogHeader>
						<DialogTitle>Scan Item Barcode</DialogTitle>
						<DialogDescription>
							Point your camera at the barcode or QR code to quickly select an
							item.
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
								formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8"]}
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
						Scanning will match against asset tags, item names, or IDs
					</div>
				</DialogContent>
			</Dialog>
		</Dialog>
	);
}