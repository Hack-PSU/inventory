"use client";

import { useMemo } from "react";
import { BarChart3, Package, MapPin, TrendingUp, Clock } from "lucide-react";

import {
	useAllItems,
	useAllCategories,
	useAllMovements,
} from "@/common/api/inventory";
import { useAllLocations } from "@/common/api/location";
import { useAllOrganizers } from "@/common/api/organizer";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function AnalyticsPage() {
	const { data: items, isLoading: isLoadingItems } = useAllItems();
	const { data: categories, isLoading: isLoadingCategories } =
		useAllCategories();
	const { data: locations, isLoading: isLoadingLocations } = useAllLocations();
	const { data: movements, isLoading: isLoadingMovements } = useAllMovements();
	const { data: organizers, isLoading: isLoadingOrganizers } =
		useAllOrganizers();

	const isLoading =
		isLoadingItems ||
		isLoadingCategories ||
		isLoadingLocations ||
		isLoadingMovements ||
		isLoadingOrganizers;

	const analytics = useMemo(() => {
		if (!items || !categories || !locations || !movements || !organizers)
			return null;

		// Status distribution
		const statusCounts = items.reduce(
			(acc, item) => {
				acc[item.status] = (acc[item.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Category distribution
		const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
		const categoryCounts = items.reduce(
			(acc, item) => {
				const categoryName = categoryMap.get(item.categoryId) || "Unknown";
				acc[categoryName] = (acc[categoryName] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Location distribution
		const locationMap = new Map(locations.map((l) => [l.id, l.name]));
		const locationCounts = items.reduce(
			(acc, item) => {
				if (item.holderLocationId) {
					const locationName =
						locationMap.get(item.holderLocationId) || "Unknown";
					acc[locationName] = (acc[locationName] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		);

		// Recent movements (last 30 days)
		const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
		const recentMovements = movements.filter(
			(m) => m.createdAt > thirtyDaysAgo
		);

		// Movement reasons
		const movementReasons = movements.reduce(
			(acc, movement) => {
				acc[movement.reason] = (acc[movement.reason] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Items with people vs locations
		const itemsWithPeople = items.filter(
			(item) => item.holderOrganizerId
		).length;
		const itemsWithLocations = items.filter(
			(item) => item.holderLocationId
		).length;

		return {
			totalItems: items.length,
			statusCounts,
			categoryCounts,
			locationCounts,
			recentMovements: recentMovements.length,
			totalMovements: movements.length,
			movementReasons,
			itemsWithPeople,
			itemsWithLocations,
			unassignedItems: items.length - itemsWithPeople - itemsWithLocations,
		};
	}, [items, categories, locations, movements, organizers]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
					<p className="text-muted-foreground">
						Inventory insights and metrics.
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
			</div>
		);
	}

	if (!analytics) return null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
				<p className="text-muted-foreground">Inventory insights and metrics.</p>
			</div>

			{/* Overview Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Items</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{analytics.totalItems}</div>
						<p className="text-xs text-muted-foreground">
							{analytics.statusCounts.active || 0} active
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Recent Movements
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.recentMovements}
						</div>
						<p className="text-xs text-muted-foreground">Last 30 days</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Items with People
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.itemsWithPeople}
						</div>
						<p className="text-xs text-muted-foreground">
							Currently checked out
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Locations in Use
						</CardTitle>
						<MapPin className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{Object.keys(analytics.locationCounts).length}
						</div>
						<p className="text-xs text-muted-foreground">
							Active storage locations
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Status Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>Item Status Distribution</CardTitle>
						<CardDescription>
							Current status of all inventory items
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{Object.entries(analytics.statusCounts).map(([status, count]) => (
							<div key={status} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Badge variant="outline">{status}</Badge>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-24">
										<Progress
											value={(count / analytics.totalItems) * 100}
											className="h-2"
										/>
									</div>
									<span className="text-sm font-medium w-8 text-right">
										{count}
									</span>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Category Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>Items by Category</CardTitle>
						<CardDescription>Distribution across categories</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{Object.entries(analytics.categoryCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 6)
							.map(([category, count]) => (
								<div
									key={category}
									className="flex items-center justify-between"
								>
									<span className="text-sm font-medium">{category}</span>
									<div className="flex items-center gap-2">
										<div className="w-24">
											<Progress
												value={(count / analytics.totalItems) * 100}
												className="h-2"
											/>
										</div>
										<span className="text-sm font-medium w-8 text-right">
											{count}
										</span>
									</div>
								</div>
							))}
					</CardContent>
				</Card>

				{/* Location Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>Items by Location</CardTitle>
						<CardDescription>Current location distribution</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{Object.entries(analytics.locationCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 6)
							.map(([location, count]) => (
								<div
									key={location}
									className="flex items-center justify-between"
								>
									<span className="text-sm font-medium">{location}</span>
									<div className="flex items-center gap-2">
										<div className="w-24">
											<Progress
												value={(count / analytics.itemsWithLocations) * 100}
												className="h-2"
											/>
										</div>
										<span className="text-sm font-medium w-8 text-right">
											{count}
										</span>
									</div>
								</div>
							))}
					</CardContent>
				</Card>

				{/* Movement Reasons */}
				<Card>
					<CardHeader>
						<CardTitle>Movement Reasons</CardTitle>
						<CardDescription>Most common movement types</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{Object.entries(analytics.movementReasons)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 6)
							.map(([reason, count]) => (
								<div key={reason} className="flex items-center justify-between">
									<Badge variant="secondary">{reason}</Badge>
									<div className="flex items-center gap-2">
										<div className="w-24">
											<Progress
												value={(count / analytics.totalMovements) * 100}
												className="h-2"
											/>
										</div>
										<span className="text-sm font-medium w-8 text-right">
											{count}
										</span>
									</div>
								</div>
							))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
