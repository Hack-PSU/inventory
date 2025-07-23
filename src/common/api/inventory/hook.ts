// inventory/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getAllCategories,
	createCategory,
	deleteCategory,
	getAllItems,
	createItem,
	deleteItem,
	getAllMovements,
	createMovement,
	deleteMovement,
} from "./provider";
import {
	InventoryCategoryCreateEntity,
	InventoryItemCreateEntity,
	InventoryMovementCreateEntity,
	InventoryCategoryEntity,
	InventoryItemEntity,
	InventoryMovementEntity,
} from "./entity";

/* -------- Query Keys -------- */
export const inventoryQueryKeys = {
	categories: ["inventory", "categories"] as const,
	items: ["inventory", "items"] as const,
	movements: ["inventory", "movements"] as const,
};

/* -------- Categories Hooks -------- */
export function useAllCategories() {
	return useQuery<InventoryCategoryEntity[]>({
		queryKey: inventoryQueryKeys.categories,
		queryFn: getAllCategories,
	});
}

export function useCreateCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: InventoryCategoryCreateEntity) => createCategory(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.categories });
		},
	});
}

export function useDeleteCategory() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => deleteCategory(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.categories });
		},
	});
}

/* -------- Items Hooks -------- */
export function useAllItems() {
	return useQuery<InventoryItemEntity[]>({
		queryKey: inventoryQueryKeys.items,
		queryFn: getAllItems,
	});
}

export function useCreateItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: InventoryItemCreateEntity) => createItem(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.items });
		},
	});
}

export function useDeleteItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteItem(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.items });
		},
	});
}

/* -------- Movements Hooks -------- */
export function useAllMovements() {
	return useQuery<InventoryMovementEntity[]>({
		queryKey: inventoryQueryKeys.movements,
		queryFn: getAllMovements,
	});
}

export function useCreateMovement() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: InventoryMovementCreateEntity) => createMovement(data),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.movements });
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.items }); // item holder/status changed
		},
	});
}

export function useDeleteMovement() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteMovement(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: inventoryQueryKeys.movements });
		},
	});
}
