"use client";

import { useState, useMemo } from "react";
import { Package, MapPin, Users, Eye } from "lucide-react";

import { useAllItems, useAllCategories } from "@/common/api/inventory";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function CatalogPage() {
	const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

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

	const catalogData = useMemo(() => {
		if (!items || !categories || !locations || !organizers) return [];

		const locationMap = new Map(locations.map((l) => [l.id, l.name]));
		const organizerMap = new Map(
			organizers.map((o) => [o.id, `${o.firstName} ${o.lastName}`])
		);

		return categories
			.map((category) => {
				const categoryItems = items.filter(
					(item) => item.categoryId === category.id
				);

				// Location distribution for this category
				const locationCounts = categoryItems.reduce(
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

				// Status distribution
				const statusCounts = categoryItems.reduce(
					(acc, item) => {
						acc[item.status] = (acc[item.status] || 0) + 1;
						return acc;
					},
					{} as Record<string, number>
				);

				// Items with people
				const itemsWithPeople = categoryItems.filter(
					(item) => item.holderOrganizerId
				).length;

				return {
					category,
					totalItems: categoryItems.length,
					locationCounts,
					statusCounts,
					itemsWithPeople,
					items: categoryItems,
				};
			})
			.filter((data) => data.totalItems > 0); // Only show categories with items
	}, [items, categories, locations, organizers]);

	const selectedCategoryData = useMemo(() => {
		if (!selectedCategory) return null;
		return catalogData.find((data) => data.category.id === selectedCategory);
	}, [selectedCategory, catalogData]);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Catalog</h1>
					<p className="text-muted-foreground">
						Browse inventory by category and location.
					</p>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Catalog</h1>
				<p className="text-muted-foreground">
					Browse inventory by category and location.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{catalogData.map(
					({
						category,
						totalItems,
						locationCounts,
						statusCounts,
						itemsWithPeople,
					}) => (
						<Card
							key={category.id}
							className="hover:shadow-md transition-shadow"
						>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">{category.name}</CardTitle>
									<Badge variant="secondary">{totalItems} items</Badge>
								</div>
								{category.description && (
									<CardDescription>{category.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Status Overview */}
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm font-medium">
										<Package className="h-4 w-4" />
										Status Distribution
									</div>
									<div className="space-y-1">
										{Object.entries(statusCounts).map(([status, count]) => (
											<div
												key={status}
												className="flex items-center justify-between text-sm"
											>
												<Badge variant="outline" className="text-xs">
													{status}
												</Badge>
												<span>{count}</span>
											</div>
										))}
									</div>
								</div>

								{/* Location Distribution */}
								<div className="space-y-2">
									<div className="flex items-center gap-2 text-sm font-medium">
										<MapPin className="h-4 w-4" />
										Top Locations
									</div>
									<div className="space-y-1">
										{Object.entries(locationCounts)
											.sort(([, a], [, b]) => b - a)
											.slice(0, 3)
											.map(([location, count]) => (
												<div
													key={location}
													className="flex items-center justify-between text-sm"
												>
													<span className="truncate">{location}</span>
													<div className="flex items-center gap-2">
														<Progress
															value={(count / totalItems) * 100}
															className="h-1 w-12"
														/>
														<span className="text-xs w-6 text-right">
															{count}
														</span>
													</div>
												</div>
											))}
									</div>
								</div>

								{/* People Assignment */}
								{itemsWithPeople > 0 && (
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4" />
											<span>With People</span>
										</div>
										<Badge variant="outline">{itemsWithPeople}</Badge>
									</div>
								)}

								<Button
									variant="outline"
									className="w-full bg-transparent"
									onClick={() => setSelectedCategory(category.id)}
								>
									<Eye className="mr-2 h-4 w-4" />
									View Details
								</Button>
							</CardContent>
						</Card>
					)
				)}
			</div>

			{/* Category Detail Dialog */}
			<Dialog
				open={!!selectedCategory}
				onOpenChange={(open) => !open && setSelectedCategory(null)}
			>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{selectedCategoryData?.category.name} - Detailed View
						</DialogTitle>
						<DialogDescription>
							All items in this category with their current locations and status
						</DialogDescription>
					</DialogHeader>

					{selectedCategoryData && (
						<div className="space-y-4">
							{/* Summary Stats */}
							<div className="grid grid-cols-3 gap-4">
								<Card>
									<CardContent className="pt-4">
										<div className="text-2xl font-bold">
											{selectedCategoryData.totalItems}
										</div>
										<p className="text-xs text-muted-foreground">Total Items</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="pt-4">
										<div className="text-2xl font-bold">
											{Object.keys(selectedCategoryData.locationCounts).length}
										</div>
										<p className="text-xs text-muted-foreground">Locations</p>
									</CardContent>
								</Card>
								<Card>
									<CardContent className="pt-4">
										<div className="text-2xl font-bold">
											{selectedCategoryData.itemsWithPeople}
										</div>
										<p className="text-xs text-muted-foreground">With People</p>
									</CardContent>
								</Card>
							</div>

							{/* Items Table */}
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Asset Tag</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Current Location</TableHead>
											<TableHead>Assigned Person</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{selectedCategoryData.items.map((item) => {
											const location = locations?.find(
												(l) => l.id === item.holderLocationId
											);
											const organizer = organizers?.find(
												(o) => o.id === item.holderOrganizerId
											);

											return (
												<TableRow key={item.id}>
													<TableCell className="font-medium">
														{item.name || "N/A"}
													</TableCell>
													<TableCell>{item.assetTag}</TableCell>
													<TableCell>
														<Badge variant="outline">{item.status}</Badge>
													</TableCell>
													<TableCell>
														{location?.name || "Unassigned"}
													</TableCell>
													<TableCell>
														{organizer
															? `${organizer.firstName} ${organizer.lastName}`
															: "Unassigned"}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
