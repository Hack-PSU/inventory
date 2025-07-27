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

	return (
		<div className="space-y-4 sm:space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
						Movements
					</h1>
					<p className="text-sm sm:text-base text-muted-foreground">
						Track your inventory movements.
					</p>
				</div>
				<Button
					onClick={() => setCreateOpen(true)}
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					<PlusCircle className="mr-2 h-4 w-4" />
					<span className="sm:inline">Create Movement</span>
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
				<MovementTable
					movements={movements || []}
					items={items || []}
					locations={locations || []}
					organizers={organizers || []}
				/>
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
