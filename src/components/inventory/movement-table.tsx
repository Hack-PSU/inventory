"use client";

import { useState, useMemo } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type {
	InventoryMovementEntity,
	InventoryItemEntity,
} from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";
import type { OrganizerEntity } from "@/common/api/organizer";
import { useDeleteMovement } from "@/common/api/inventory";
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

interface MovementTableProps {
	movements: InventoryMovementEntity[];
	items: InventoryItemEntity[];
	locations: LocationEntity[];
	organizers: OrganizerEntity[];
}

export function MovementTable({
	movements,
	items,
	locations,
	organizers,
}: MovementTableProps) {
	const [filter, setFilter] = useState("");
	const [itemToDelete, setItemToDelete] =
		useState<InventoryMovementEntity | null>(null);
	const deleteMutation = useDeleteMovement();

	const itemMap = useMemo(
		() =>
			new Map(items.map((i) => [i.id, i.name || i.assetTag || "Unknown Item"])),
		[items]
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

	const getHolderName = (
		id: string | number | null | undefined,
		type: "location" | "organizer"
	) => {
		if (!id) return "N/A";
		return type === "location"
			? locationMap.get(id as number)
			: organizerMap.get(id as string);
	};

	const filteredMovements = movements.filter((movement) =>
		(itemMap.get(movement.itemId) || "")
			.toLowerCase()
			.includes(filter.toLowerCase())
	);

	const handleDelete = () => {
		if (!itemToDelete) return;
		deleteMutation.mutate(itemToDelete.id, {
			onSuccess: () => {
				toast.success(`Movement record deleted successfully.`);
				setItemToDelete(null);
			},
			onError: (error) => {
				toast.error(`Failed to delete movement: ${error.message}`);
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
					placeholder="Filter by item name/tag..."
				/>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Item</TableHead>
						<TableHead>Reason</TableHead>
						<TableHead>From</TableHead>
						<TableHead>To</TableHead>
						<TableHead>Date</TableHead>
						<TableHead className="w-[50px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredMovements.map((movement) => (
						<TableRow key={movement.id}>
							<TableCell className="font-medium">
								{itemMap.get(movement.itemId)}
							</TableCell>
							<TableCell>
								<Badge variant="secondary">{movement.reason}</Badge>
							</TableCell>
							<TableCell>
								{getHolderName(movement.fromLocationId, "location") ||
									getHolderName(movement.fromOrganizerId, "organizer")}
							</TableCell>
							<TableCell>
								{getHolderName(movement.toLocationId, "location") ||
									getHolderName(movement.toOrganizerId, "organizer")}
							</TableCell>
							<TableCell>
								{new Date(movement.createdAt * 1000).toLocaleDateString()}
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
												onClick={() => setItemToDelete(movement)}
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
				itemName={`movement for ${itemMap.get(itemToDelete?.itemId || "")}`}
				isPending={deleteMutation.isPending}
			/>
		</div>
	);
}
