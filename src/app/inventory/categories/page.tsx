"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";

import { useAllCategories } from "@/common/api/inventory";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/inventory/category-form-dialog";
import { CategoryTable } from "@/components/inventory/category-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
	const [isCreateOpen, setCreateOpen] = useState(false);
	const { data: categories, isLoading } = useAllCategories();

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Categories</h1>
					<p className="text-muted-foreground">
						Manage your inventory categories.
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Category
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
				<CategoryTable categories={categories || []} />
			)}

			<CategoryFormDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
		</div>
	);
}
