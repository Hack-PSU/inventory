"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { useCreateLocation } from "@/common/api/location";
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

interface LocationFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LocationFormDialog({
	open,
	onOpenChange,
}: LocationFormDialogProps) {
	const createMutation = useCreateLocation();
	const form = useForm<LocationFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: "" },
	});

	const onSubmit = (values: LocationFormValues) => {
		createMutation.mutate(values, {
			onSuccess: () => {
				toast.success("Location created successfully.");
				form.reset();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(`Failed to create location: ${error.message}`);
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Location</DialogTitle>
					<DialogDescription>
						Add a new location where inventory can be stored.
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
