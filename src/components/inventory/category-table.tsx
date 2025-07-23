"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { InventoryCategoryEntity } from "@/common/api/inventory";
import { useDeleteCategory } from "@/common/api/inventory";
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
import { SearchInput } from "@/components/inventory/search-input";

interface CategoryTableProps {
	categories: InventoryCategoryEntity[];
}

export function CategoryTable({ categories }: CategoryTableProps) {
	const [filter, setFilter] = useState("");
	const [itemToDelete, setItemToDelete] =
		useState<InventoryCategoryEntity | null>(null);
	const deleteMutation = useDeleteCategory();

	const filteredCategories = categories.filter((cat) =>
		cat.name.toLowerCase().includes(filter.toLowerCase())
	);

	const handleDelete = () => {
		if (!itemToDelete) return;
		deleteMutation.mutate(itemToDelete.id, {
			onSuccess: () => {
				toast.success(`Category "${itemToDelete.name}" deleted successfully.`);
				setItemToDelete(null);
			},
			onError: (error) => {
				toast.error(`Failed to delete category: ${error.message}`);
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
					placeholder="Filter categories..."
				/>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Description</TableHead>
						<TableHead className="w-[50px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredCategories.map((category) => (
						<TableRow key={category.id}>
							<TableCell className="font-medium">{category.name}</TableCell>
							<TableCell>{category.description}</TableCell>
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
											<DropdownMenuItem
												className="text-red-500"
												onClick={() => setItemToDelete(category)}
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
		</div>
	);
}
