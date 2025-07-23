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

const formSchema = z
	.object({
		name: z.string().optional(),
		assetTag: z.string().optional(),
		serialNumber: z.string().optional(),
		notes: z.string().optional(),
		categoryId: z.string().min(1, "Category is required"),
		status: z.nativeEnum(InventoryItemStatus).optional(),
		holderLocationId: z.string().optional(),
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

export function ItemFormDialog({
	open,
	onOpenChange,
	categories,
	locations,
	organizers,
}: ItemFormDialogProps) {
	const createMutation = useCreateItem();
	const form = useForm<ItemFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { status: InventoryItemStatus.ACTIVE },
	});

	const onSubmit = (values: ItemFormValues) => {
		const payload = {
			...values,
			categoryId: Number.parseInt(values.categoryId, 10),
			holderLocationId: values.holderLocationId
				? Number.parseInt(values.holderLocationId, 10)
				: undefined,
		};
		createMutation.mutate(payload, {
			onSuccess: () => {
				toast.success("Item created successfully.");
				form.reset({ status: InventoryItemStatus.ACTIVE });
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(`Failed to create item: ${error.message}`);
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Create Item</DialogTitle>
					<DialogDescription>
						Add a new item to your inventory.
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
										<Input placeholder="IT-00123" {...field} />
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
									<FormLabel>Holder Location</FormLabel>
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
							name="holderOrganizerId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Holder Person</FormLabel>
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
		</Dialog>
	);
}
