"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import {
	MovementReason,
	type InventoryItemEntity,
	useCreateMovement,
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
import { QuickScanButton } from "@/components/inventory/quick-scan-button";

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

	const handleItemScan = (scannedCode: string) => {
		// Find item by asset tag
		const foundItem = items.find(
			(item) =>
				item.assetTag === scannedCode ||
				item.name === scannedCode ||
				item.serialNumber === scannedCode
		);

		if (foundItem) {
			form.setValue("itemId", foundItem.id);
			toast.success(`Selected: ${foundItem.name || foundItem.assetTag}`);
		} else {
			toast.error(`No item found with code: ${scannedCode}`);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] p-0">
				<DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
					<DialogTitle className="text-lg sm:text-xl">
						Create Movement
					</DialogTitle>
					<DialogDescription className="text-sm">
						Record a new inventory movement. Scan or select an item to get
						started.
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[calc(90vh-120px)] px-4 sm:px-6">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 pb-4"
						>
							{/* Item Selection */}
							<FormField
								control={form.control}
								name="itemId"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm font-medium">Item</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className="h-10">
													<SelectValue placeholder="Select an item" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{items.map((i) => (
													<SelectItem key={i.id} value={i.id}>
														{i.name || i.assetTag}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Quick Scan Button */}
							<div className="flex justify-center py-2">
								<QuickScanButton
									onScan={handleItemScan}
									title="Scan Item"
									description="Scan an item's barcode to instantly select it"
									variant="secondary"
									className="w-full sm:w-auto"
								/>
							</div>

							{/* Current Holder Display */}
							{selectedItem && (
								<div className="p-3 bg-muted rounded-lg">
									<div className="text-sm font-medium mb-2">
										Current Holder:
									</div>
									{getCurrentHolder()}
								</div>
							)}

							{/* Reason Selection */}
							<FormField
								control={form.control}
								name="reason"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm font-medium">
											Reason
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger className="h-10">
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

							{/* From/To Section - Mobile Stacked */}
							<div className="space-y-6">
								{/* FROM Section */}
								<div className="space-y-3">
									<div className="text-sm font-medium text-muted-foreground border-b pb-1">
										FROM (Auto-populated)
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="fromLocationId"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm">
														From Location
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value || ""}
													>
														<FormControl>
															<SelectTrigger className="h-10 bg-muted">
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
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm">From Person</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value || ""}
													>
														<FormControl>
															<SelectTrigger className="h-10 bg-muted">
																<SelectValue placeholder="Auto-populated" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="none">None</SelectItem>
															{organizers.map((o) => (
																<SelectItem key={o.id} value={o.id}>
																	{`${o.firstName} ${o.lastName}`}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>

								{/* TO Section */}
								<div className="space-y-3">
									<div className="text-sm font-medium text-muted-foreground border-b pb-1">
										TO (At least one required)
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="toLocationId"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm">To Location</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value || ""}
													>
														<FormControl>
															<SelectTrigger className="h-10">
																<SelectValue placeholder="Select destination" />
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
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm">To Person</FormLabel>
													<Select
														onValueChange={field.onChange}
														value={field.value || ""}
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
								</div>
							</div>

							{/* Notes */}
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-sm font-medium">Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Movement notes..."
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
						{createMutation.isPending ? "Creating..." : "Create Movement"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
