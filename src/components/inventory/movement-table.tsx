"use client";

import { useState, useMemo } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type {
	InventoryMovementEntity,
	InventoryItemEntity,
	InventoryCategoryEntity,
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
	categories: InventoryCategoryEntity[];
	locations: LocationEntity[];
	organizers: OrganizerEntity[];
}

export function MovementTable({
	movements,
	items,
	categories,
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

	const getHolderDisplay = (
		locationId: number | null | undefined,
		organizerId: string | null | undefined
	) => {
		if (locationId && organizerId) {
			// Both are present - show both with clear distinction
			return (
				<div className="space-y-1">
					<div className="flex items-center gap-1">
						<Badge variant="outline" className="text-xs">
							Location
						</Badge>
						<span className="text-sm">
							{locationMap.get(locationId) || "Unknown Location"}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<Badge variant="outline" className="text-xs">
							Person
						</Badge>
						<span className="text-sm">
							{organizerMap.get(organizerId) || "Unknown Person"}
						</span>
					</div>
				</div>
			);
		} else if (locationId) {
			// Only location
			return (
				<div className="flex items-center gap-1">
					<Badge variant="secondary" className="text-xs">
						Location
					</Badge>
					<span className="text-sm">
						{locationMap.get(locationId) || "Unknown Location"}
					</span>
				</div>
			);
		} else if (organizerId) {
			// Only organizer
			return (
				<div className="flex items-center gap-1">
					<Badge variant="secondary" className="text-xs">
						Person
					</Badge>
					<span className="text-sm">
						{organizerMap.get(organizerId) || "Unknown Person"}
					</span>
				</div>
			);
		} else {
			// Neither
			return <span className="text-muted-foreground text-sm">Unassigned</span>;
		}
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
			<div className="p-3 sm:p-4">
				<SearchInput
					value={filter}
					onChange={(e: any) => setFilter(e.target.value)}
					placeholder="Filter by item name/tag..."
				/>
			</div>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="whitespace-nowrap">Item</TableHead>
							<TableHead className="whitespace-nowrap min-w-[120px]">Category</TableHead>
							<TableHead className="whitespace-nowrap">Reason</TableHead>
							<TableHead className="min-w-[120px] sm:min-w-[150px] whitespace-nowrap">
								From
							</TableHead>
							<TableHead className="min-w-[120px] sm:min-w-[150px] whitespace-nowrap">
								To
							</TableHead>
							<TableHead className="whitespace-nowrap">Date</TableHead>
							<TableHead className="w-[50px] text-right whitespace-nowrap">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredMovements.map((movement) => {
							const item = items.find(i => i.id === movement.itemId);
							const categoryName = item ? categoryMap.get(item.categoryId) : "Unknown Category";
							
							return (
								<TableRow key={movement.id}>
									<TableCell className="font-medium">
										<div className="min-w-0">
											<div className="truncate text-sm sm:text-base">
												{itemMap.get(movement.itemId)}
											</div>
										</div>
									</TableCell>
									<TableCell className="min-w-[120px]">
										<Badge variant="outline" className="text-xs sm:text-sm">
											{categoryName || "Unknown Category"}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className="text-xs sm:text-sm">
											{movement.reason}
										</Badge>
									</TableCell>
								<TableCell className="min-w-0">
									<div className="text-xs sm:text-sm">
										{getHolderDisplay(
											movement.fromLocationId,
											movement.fromOrganizerId
										)}
									</div>
								</TableCell>
								<TableCell className="min-w-0">
									<div className="text-xs sm:text-sm">
										{getHolderDisplay(
											movement.toLocationId,
											movement.toOrganizerId
										)}
									</div>
								</TableCell>
								<TableCell className="whitespace-nowrap text-xs sm:text-sm">
									{new Date(movement.createdAt).toLocaleDateString()}
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
							);
						})}
					</TableBody>
				</Table>
			</div>
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
