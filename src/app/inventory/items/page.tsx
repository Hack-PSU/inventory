"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

import { useAllItems, useAllCategories } from "@/common/api/inventory";
import { useAllLocations } from "@/common/api/location";
import { useAllOrganizers } from "@/common/api/organizer";
import { Button } from "@/components/ui/button";
import { ItemFormDialog } from "@/components/inventory/item-form-dialog";
import { ItemTable } from "@/components/inventory/item-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsPage() {
	const [isCreateOpen, setCreateOpen] = useState(false);

	const { data: items, isLoading: isLoadingItems } = useAllItems();
	const { data: categories, isLoading: isLoadingCategories } =
		useAllCategories();
	const { data: locations, isLoading: isLoadingLocations } = useAllLocations();
	const { data: organizers, isLoading: isLoadingOrganizers } =
		useAllOrganizers();

	const isLoading =
		isLoadingItems ||
		isLoadingCategories ||
		isLoadingLocations ||
		isLoadingOrganizers;

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Items</h1>
					<p className="text-muted-foreground">Manage your inventory items.</p>
				</div>
				<Button onClick={() => setCreateOpen(true)} disabled={isLoading}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Item
				</Button>
			</header>

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			) : (
				<ItemTable
					items={items || []}
					categories={categories || []}
					locations={locations || []}
					organizers={organizers || []}
				/>
			)}

			<ItemFormDialog
				open={isCreateOpen}
				onOpenChange={setCreateOpen}
				categories={categories || []}
				locations={locations || []}
				organizers={organizers || []}
			/>
		</div>
	);
}
