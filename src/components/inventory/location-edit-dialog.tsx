"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import type { LocationEntity } from "@/common/api/location";
import { useUpdateLocation } from "@/common/api/location";
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

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
});

type LocationFormValues = z.infer<typeof formSchema>;

interface LocationEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	location: LocationEntity;
}

export function LocationEditDialog({
	open,
	onOpenChange,
	location,
}: LocationEditDialogProps) {
	const updateMutation = useUpdateLocation();
	const form = useForm<LocationFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: location.name },
	});

	useEffect(() => {
		form.reset({ name: location.name });
	}, [location, form]);

	const onSubmit = (values: LocationFormValues) => {
		updateMutation.mutate(
			{ id: location.id, data: values },
			{
				onSuccess: () => {
					toast.success("Location updated successfully.");
					onOpenChange(false);
				},
				onError: (error) => {
					toast.error(`Failed to update location: ${error.message}`);
				},
			}
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Location</DialogTitle>
					<DialogDescription>
						Update the details for this location.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g., Main Office" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
