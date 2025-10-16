"use client";

import { useState, useMemo , useEffect} from "react";
import { MoreHorizontal, Trash2, SquarePen } from "lucide-react";
import { toast } from "sonner";
import type {
	InventoryItemEntity,
	InventoryCategoryEntity,
} from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";
import type { OrganizerEntity } from "@/common/api/organizer";
import { useDeleteItem } from "@/common/api/inventory";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/inventory/confirm-delete-dialog";
import { SearchInput } from "@/components/inventory/search-input";
import { ItemEditDialog } from "./item-edit-dialog";

type HolderValue = "all" | "unassigned" | `loc:${string}` | `org:${string}`;

interface ItemTableProps {
	items: InventoryItemEntity[];
	categories: InventoryCategoryEntity[];
	locations: LocationEntity[];
	organizers: OrganizerEntity[];
	selectedItemIds: string[]; // needed for checkbox
    onSelectionChange: (ids: string[]) => void; 
}

export function ItemTable({
	items,
	categories,
	locations,
	organizers,
	selectedItemIds,
    onSelectionChange,
}: ItemTableProps) {
	const [filter, setFilter] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [holderFilter, setHolderFilter] = useState<HolderValue>("all");

	const [itemToDelete, setItemToDelete] =
		useState<InventoryItemEntity | null>(null);
	const deleteMutation = useDeleteItem();

	const [itemToEdit, setItemToEdit] = useState<InventoryItemEntity | null>(null);

	const categoryMap = useMemo(
		() => new Map(categories.map((c) => [c.id, c.name])),
		[categories]
	);
	const locationMap = useMemo(
		() => new Map(locations.map((l) => [l.id, l.name])),
		[locations]
	);
	const organizerMap = useMemo(
		() => new Map(organizers.map((o) => [o.id, `${o.firstName} ${o.lastName}`])),
		[organizers]
	);

	const filteredItems = useMemo(() => {
		const text = filter.trim().toLowerCase();

		return items.filter((item) => {
			const matchesText =
				!text ||
				(item.name || "").toLowerCase().includes(text) ||
				(item.assetTag || "").toLowerCase().includes(text);

			// Normalize to string for comparisons
			const matchesCategory =
				categoryFilter === "all" || String(item.categoryId) === categoryFilter;

			const matchesStatus =
				statusFilter === "all" || String(item.status) === statusFilter;

			let matchesHolder = true;
			if (holderFilter !== "all") {
				if (holderFilter === "unassigned") {
					matchesHolder = !item.holderLocationId && !item.holderOrganizerId;
				} else if (holderFilter.startsWith("loc:")) {
					matchesHolder =
						String(item.holderLocationId) === holderFilter.slice(4);
				} else if (holderFilter.startsWith("org:")) {
					matchesHolder =
						String(item.holderOrganizerId) === holderFilter.slice(4);
				}
			}

			return matchesText && matchesCategory && matchesStatus && matchesHolder;
		});
	}, [items, filter, categoryFilter, statusFilter, holderFilter]);


    useEffect(() => {
        onSelectionChange([]);
    }, [filter, categoryFilter, statusFilter, holderFilter]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(filteredItems.map((item) => item.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedItemIds, id]);
        } else {
            onSelectionChange(selectedItemIds.filter((itemId) => itemId !== id));
        }
    };

	const statusOptions = useMemo(() => {
		const set = new Set<string>();
		for (const it of items) {
			if (it.status != null) set.add(String(it.status));
		}
		return Array.from(set).sort();
	}, [items]);

	
	const holderOptions = useMemo(() => {
		const locOpts = locations.map((l) => ({
			label: l.name,
			value: `loc:${String(l.id)}` as const,
		}));
		const orgOpts = organizers.map((o) => ({
			label: `${o.firstName} ${o.lastName}`,
			value: `org:${String(o.id)}` as const,
		}));
		return { locOpts, orgOpts };
	}, [locations, organizers]);

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

	const isAllSelected = filteredItems.length > 0 && selectedItemIds.length === filteredItems.length;

	return (
		<div className="rounded-lg border">
			<div className="flex flex-wrap gap-2 p-4 items-center justify-between">
				{/* Search input on the left */}
				<div className="w-full max-w-sm">
					<SearchInput
						value={filter}
						onChange={(e: any) => setFilter(e.target.value)}
						placeholder="Filter by name or asset tag..."
					/>
				</div>

				{/* Dropdowns on the right */}
				<div className="flex flex-row gap-2 items-center">
					{/* Category */}
					<Select
						value={categoryFilter}
						onValueChange={(v: string) => setCategoryFilter(v)}
					>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{categories.map((c) => (
								<SelectItem key={c.id} value={String(c.id)}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Status */}
					<Select
						value={statusFilter}
						onValueChange={(v: string) => setStatusFilter(v)}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							{statusOptions.map((s) => (
								<SelectItem key={s} value={s}>
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Holder */}
					<Select
						value={holderFilter}
						onValueChange={(v: HolderValue) => setHolderFilter(v)}
					>
						<SelectTrigger className="w-[220px]">
							<SelectValue placeholder="Holder" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Holders</SelectItem>
							<SelectItem value="unassigned">Unassigned</SelectItem>
							<div className="px-2 py-1 text-xs font-medium text-muted-foreground">
								Locations
							</div>
							{holderOptions.locOpts.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
							<div className="px-2 py-1 text-xs font-medium text-muted-foreground">
								Organizers
							</div>
							{holderOptions.orgOpts.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all"
                            />
                        </TableHead>
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

                            <TableCell>
                                <Checkbox
                                    checked={selectedItemIds.includes(item.id)}
                                    onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                                    aria-label={`Select item ${item.name}`}
                                />
                            </TableCell>
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
												className="text-blue-500"
												onClick={() => setItemToEdit(item)}
											>
												<SquarePen className="mr-2 h-4 w-4" />
												Edit
											</DropdownMenuItem>
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

			{/* Dialog for editing item */}

			{itemToEdit && 
				<ItemEditDialog
					open={!!itemToEdit}
					item={itemToEdit}
					onOpenChange={(open) => !open && setItemToEdit(null)}
				/>
			}
		</div>
	);
}
