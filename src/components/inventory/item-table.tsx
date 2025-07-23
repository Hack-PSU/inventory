"use client";

import { useState, useMemo } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type {
	InventoryItemEntity,
	InventoryCategoryEntity,
} from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";
import type { OrganizerEntity } from "@/common/api/organizer";
import { useDeleteItem } from "@/common/api/inventory";
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/inventory/confirm-delete-dialog";
import { SearchInput } from "@/components/inventory/search-input";

interface ItemTableProps {
	items: InventoryItemEntity[];
	categories: InventoryCategoryEntity[];
	locations: LocationEntity[];
	organizers: OrganizerEntity[];
}

export function ItemTable({
	items,
	categories,
	locations,
	organizers,
}: ItemTableProps) {
	const [filter, setFilter] = useState("");
	const [itemToDelete, setItemToDelete] = useState<InventoryItemEntity | null>(
		null
	);
	const deleteMutation = useDeleteItem();

	const categoryMap = useMemo(
		() => new Map(categories.map((c) => [c.id, c.name])),
		[categories]
	);
	const locationMap = useMemo(
		() => new Map(locations.map((l) => [l.id, l.name])),
		[locations]
	);
	const organizerMap = useMemo(
		() =>
			new Map(organizers.map((o) => [o.id, `${o.firstName} ${o.lastName}`])),
		[organizers]
	);

	const filteredItems = items.filter((item) =>
		(item.name || item.assetTag || "")
			.toLowerCase()
			.includes(filter.toLowerCase())
	);

	const handleDelete = () => {
		if (!itemToDelete) return;
		deleteMutation.mutate(itemToDelete.id, {
			onSuccess: () => {
				toast.success(
					`Item "${itemToDelete.name || itemToDelete.assetTag}" deleted successfully.`
				);
				setItemToDelete(null);
			},
			onError: (error) => {
				toast.error(`Failed to delete item: ${error.message}`);
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
					placeholder="Filter by name or asset tag..."
				/>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Asset Tag</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Holder</TableHead>
						<TableHead className="w-[50px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredItems.map((item) => (
						<TableRow key={item.id}>
							<TableCell className="font-medium">
								{item.name || "N/A"}
							</TableCell>
							<TableCell>{item.assetTag}</TableCell>
							<TableCell>
								{categoryMap.get(item.categoryId) || "Unknown"}
							</TableCell>
							<TableCell>
								<Badge variant="outline">{item.status}</Badge>
							</TableCell>
							<TableCell>
								{item.holderLocationId
									? locationMap.get(item.holderLocationId)
									: item.holderOrganizerId
										? organizerMap.get(item.holderOrganizerId)
										: "Unassigned"}
							</TableCell>
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
												onClick={() => setItemToDelete(item)}
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
				itemName={itemToDelete?.name || itemToDelete?.assetTag || ""}
				isPending={deleteMutation.isPending}
			/>
		</div>
	);
}
