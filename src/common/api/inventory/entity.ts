// inventory/entity.ts

export enum InventoryItemStatus {
	ACTIVE = "active",
	CHECKED_OUT = "checked_out",
	LOST = "lost",
	DISPOSED = "disposed",
	ARCHIVED = "archived",
}

export enum MovementReason {
	CHECKOUT = "checkout",
	RETURN = "return",
	TRANSFER = "transfer",
	LOST = "lost",
	DISPOSED = "disposed",
	REPAIR = "repair",
	OTHER = "other",
}

/** ----- Categories ----- */
export interface InventoryCategoryEntity {
	id: number;
	name: string;
	description?: string | null;
}

export type InventoryCategoryCreateEntity = Omit<InventoryCategoryEntity, "id">;

/** ----- Items ----- */
export interface InventoryItemEntity {
	id: string; // uuid
	categoryId: number;
	name?: string | null;
	assetTag?: string | null;
	serialNumber?: string | null;
	status: InventoryItemStatus;
	holderLocationId?: number | null;
	holderOrganizerId?: string | null;
	notes?: string | null;
	createdAt: number;
	updatedAt: number;
}

export type InventoryItemCreateEntity = Omit<
	InventoryItemEntity,
	"id" | "createdAt" | "updatedAt" | "status"
> & {
	status?: InventoryItemStatus;
};

// Only update the name, asset tag, serial number, and note
export type InventoryItemUpdateEntity = Omit<
	InventoryItemEntity,
	"id" | "categoryId" | "holderLocationId" | "holderOrganizerId" | "createdAt" | "updatedAt" | "status"
>;

/** ----- Movements ----- */
export interface InventoryMovementEntity {
	id: string; // uuid
	itemId: string;
	fromLocationId?: number | null;
	fromOrganizerId?: string | null;
	toLocationId?: number | null;
	toOrganizerId?: string | null;
	reason: MovementReason;
	notes?: string | null;
	movedByOrganizerId: string;
	createdAt: number;
}

export type InventoryMovementCreateEntity = Omit<
	InventoryMovementEntity,
	"id" | "createdAt" | "movedByOrganizerId"
>;
