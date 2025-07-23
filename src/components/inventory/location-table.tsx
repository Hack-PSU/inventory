"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { LocationEntity } from "@/common/api/location";
import { useDeleteLocation } from "@/common/api/location";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/inventory/confirm-delete-dialog";
import { LocationEditDialog } from "@/components/inventory/location-edit-dialog";
import { SearchInput } from "@/components/inventory/search-input";

interface LocationTableProps {
	locations: LocationEntity[];
}

export function LocationTable({ locations }: LocationTableProps) {
	const [filter, setFilter] = useState("");
	const [itemToDelete, setItemToDelete] = useState<LocationEntity | null>(null);
	const [itemToEdit, setItemToEdit] = useState<LocationEntity | null>(null);
	const deleteMutation = useDeleteLocation();

	const filteredLocations = locations.filter((loc) =>
		loc.name.toLowerCase().includes(filter.toLowerCase())
	);

	const handleDelete = () => {
		if (!itemToDelete) return;
		deleteMutation.mutate(itemToDelete.id, {
			onSuccess: () => {
				toast.success(`Location "${itemToDelete.name}" deleted successfully.`);
				setItemToDelete(null);
			},
			onError: (error) => {
				toast.error(`Failed to delete location: ${error.message}`);
				setItemToDelete(null);
			},
		});
	};

	return (
		<div className="rounded-lg border">
			<div className="p-4">
				<SearchInput
					value={filter}
					onChange={(e: any) => setFilter(e.target.value)}
					placeholder="Filter locations..."
				/>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead className="w-[50px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredLocations.map((location) => (
						<TableRow key={location.id}>
							<TableCell className="font-medium">{location.name}</TableCell>
							<TableCell>
								<div className="flex justify-end">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => setItemToEdit(location)}>
												<Pencil className="mr-2 h-4 w-4" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-red-500"
												onClick={() => setItemToDelete(location)}
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<ConfirmDeleteDialog
				open={!!itemToDelete}
				onOpenChange={(open) => !open && setItemToDelete(null)}
				onConfirm={handleDelete}
				itemName={itemToDelete?.name || ""}
				isPending={deleteMutation.isPending}
			/>
			{itemToEdit && (
				<LocationEditDialog
					open={!!itemToEdit}
					onOpenChange={(open) => !open && setItemToEdit(null)}
					location={itemToEdit}
				/>
			)}
		</div>
	);
}
