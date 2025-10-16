// inventory/provider.ts
import { apiFetch } from "@/common/api/apiClient";
import {
	InventoryCategoryEntity,
	InventoryCategoryCreateEntity,
	InventoryItemEntity,
	InventoryItemCreateEntity,
	InventoryMovementEntity,
	InventoryMovementCreateEntity,
	InventoryItemUpdateEntity,
} from "./entity";

/* -------- Categories -------- */
export async function getAllCategories(): Promise<InventoryCategoryEntity[]> {
	return apiFetch<InventoryCategoryEntity[]>("/inventory/categories", {
		method: "GET",
	});
}

export async function createCategory(
	data: InventoryCategoryCreateEntity
): Promise<InventoryCategoryEntity> {
	return apiFetch<InventoryCategoryEntity>("/inventory/categories", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function deleteCategory(id: number): Promise<void> {
	await apiFetch<void>(`/inventory/categories/${id}`, { method: "DELETE" });
}

/* -------- Items -------- */
export async function getAllItems(): Promise<InventoryItemEntity[]> {
	return apiFetch<InventoryItemEntity[]>("/inventory/items", { method: "GET" });
}

export async function createItem(
	data: InventoryItemCreateEntity
): Promise<InventoryItemEntity> {
	return apiFetch<InventoryItemEntity>("/inventory/items", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function updateItem(
	id: string,
	data: InventoryItemUpdateEntity
): Promise<InventoryItemEntity> {
	return apiFetch<InventoryItemEntity>(`/inventory/items/${id}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	})
}

export async function deleteItem(id: string): Promise<InventoryItemEntity> {
	return apiFetch<InventoryItemEntity>(`/inventory/items/${id}`, {
		method: "DELETE",
	});
}

/* -------- Movements -------- */
export async function getAllMovements(): Promise<InventoryMovementEntity[]> {
	return apiFetch<InventoryMovementEntity[]>("/inventory/movements", {
		method: "GET",
	});
}

export async function createMovement(
	data: InventoryMovementCreateEntity
): Promise<InventoryMovementEntity> {
	return apiFetch<InventoryMovementEntity>("/inventory/movements", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export async function deleteMovement(id: string): Promise<void> {
	await apiFetch<void>(`/inventory/movements/${id}`, { method: "DELETE" });
}
