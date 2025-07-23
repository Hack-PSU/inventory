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
import { useEffect } from "react";

const formSchema = z.object({
	itemId: z.string().min(1, "Item is required"),
	reason: z.nativeEnum(MovementReason),
	fromLocationId: z.string().optional(),
	fromOrganizerId: z.string().optional(),
	toLocationId: z.string().optional(),
	toOrganizerId: z.string().optional(),
	notes: z.string().optional(),
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
	const createMutation = useCreateMovement();
	const form = useForm<MovementFormValues>({
		resolver: zodResolver(formSchema),
	});

	const selectedItemId = form.watch("itemId");
	const selectedItem = items.find((item) => item.id === selectedItemId);

	// Auto-populate "from" fields when item is selected
	useEffect(() => {
		if (selectedItem) {
			if (selectedItem.holderLocationId) {
				form.setValue("fromLocationId", String(selectedItem.holderLocationId));
				form.setValue("fromOrganizerId", "");
			} else if (selectedItem.holderOrganizerId) {
				form.setValue("fromOrganizerId", selectedItem.holderOrganizerId);
				form.setValue("fromLocationId", "");
			} else {
				// Clear both if item has no current holder
				form.setValue("fromLocationId", "");
				form.setValue("fromOrganizerId", "");
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
		};
		createMutation.mutate(payload, {
			onSuccess: () => {
				toast.success("Movement created successfully.");
				form.reset();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(`Failed to create movement: ${error.message}`);
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Create Movement</DialogTitle>
					<DialogDescription>
						Record a new inventory movement. The &quot;from&quot; fields are automatically
						populated based on the item&apos;s current holder.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
					>
						<FormField
							control={form.control}
							name="itemId"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<FormLabel>Item</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
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
						<FormField
							control={form.control}
							name="fromLocationId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>From Location (Auto-populated)</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="bg-muted">
												<SelectValue placeholder="Auto-populated from item" />
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
							name="fromOrganizerId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>From Person (Auto-populated)</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger className="bg-muted">
												<SelectValue placeholder="Auto-populated from item" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{organizers.map((o) => (
												<SelectItem
													key={o.id}
													value={o.id}
												>{`${o.firstName} ${o.lastName}`}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="toLocationId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>To Location</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a location" />
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
							name="toOrganizerId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>To Person</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a person" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{organizers.map((o) => (
												<SelectItem
													key={o.id}
													value={o.id}
												>{`${o.firstName} ${o.lastName}`}</SelectItem>
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
										<Textarea placeholder="Movement notes..." {...field} />
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
		</Dialog>
	);
}
