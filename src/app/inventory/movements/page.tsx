"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

import { useAllMovements, useAllItems } from "@/common/api/inventory";
import { useAllLocations } from "@/common/api/location";
import { useAllOrganizers } from "@/common/api/organizer";
import { Button } from "@/components/ui/button";
import { MovementFormDialog } from "@/components/inventory/movement-form-dialog";
import { MovementTable } from "@/components/inventory/movement-table";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickScanButton } from "@/components/inventory/quick-scan-button";
import { toast } from "sonner";

export default function MovementsPage() {
	const [isCreateOpen, setCreateOpen] = useState(false);

	const { data: movements, isLoading: isLoadingMovements } = useAllMovements();
	const { data: items, isLoading: isLoadingItems } = useAllItems();
	const { data: locations, isLoading: isLoadingLocations } = useAllLocations();
	const { data: organizers, isLoading: isLoadingOrganizers } =
		useAllOrganizers();

	const isLoading =
		isLoadingMovements ||
		isLoadingItems ||
		isLoadingLocations ||
		isLoadingOrganizers;

	const handleQuickScan = (scannedCode: string) => {
		// Find item by asset tag and open movement dialog
		const foundItem = (items || []).find(
			(item) =>
				item.assetTag === scannedCode ||
				item.name === scannedCode ||
				item.serialNumber === scannedCode
		);

		if (foundItem) {
			setCreateOpen(true);
			// The movement dialog will handle setting the item
			toast.success(`Found item: ${foundItem.name || foundItem.assetTag}`);
		} else {
			toast.error(`No item found with code: ${scannedCode}`);
		}
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Mobile-optimized header */}
			<header className="space-y-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
						Movements
					</h1>
					<p className="text-sm text-muted-foreground">
						Track your inventory movements.
					</p>
				</div>

				{/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
					<QuickScanButton
						onScan={handleQuickScan}
						title="Quick Movement"
						description="Scan an item to quickly create a movement"
						variant="secondary"
						className="w-full sm:w-auto"
					/>
					<Button
						onClick={() => setCreateOpen(true)}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						<PlusCircle className="mr-2 h-4 w-4" />
						Create Movement
					</Button>
				</div>
			</header>

			{/* Loading skeleton */}
			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-8 sm:h-10 w-full" />
					<Skeleton className="h-10 sm:h-12 w-full" />
					<Skeleton className="h-10 sm:h-12 w-full" />
					<Skeleton className="h-10 sm:h-12 w-full" />
				</div>
			) : (
				<div className="rounded-lg border overflow-hidden">
					<MovementTable
						movements={movements || []}
						items={items || []}
						locations={locations || []}
						organizers={organizers || []}
					/>
				</div>
			)}

			<MovementFormDialog
				open={isCreateOpen}
				onOpenChange={setCreateOpen}
				items={items || []}
				locations={locations || []}
				organizers={organizers || []}
			/>
		</div>
	);
}
