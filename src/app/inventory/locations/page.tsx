"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

import { useAllLocations } from "@/common/api/location";
import { Button } from "@/components/ui/button";
import { LocationFormDialog } from "@/components/inventory/location-form-dialog";
import { LocationTable } from "@/components/inventory/location-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsPage() {
	const [isCreateOpen, setCreateOpen] = useState(false);
	const { data: locations, isLoading } = useAllLocations();

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Locations</h1>
					<p className="text-muted-foreground">
						Manage your inventory locations.
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Location
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
				<LocationTable locations={locations || []} />
			)}

			<LocationFormDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
