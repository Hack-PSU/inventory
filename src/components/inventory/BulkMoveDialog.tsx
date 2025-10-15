"use client";

import { useState } from "react";
import { toast } from "sonner"; // for showing notifs on screen to user

import type { InventoryItemEntity } from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";

import {
    useCreateMovement,
    InventoryMovementCreateEntity,
    MovementReason,
} from "@/common/api/inventory";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: InventoryItemEntity[];
    locations: LocationEntity[];
    selectedItemIds: string[];
    onSuccess: () => void;
};

export function BulkMoveDialog({
    open,
    onOpenChange,
    items,
    locations,
    selectedItemIds,
    onSuccess,
}: Props) {
    const [destinationId, setDestinationId] = useState<number | undefined>();
    const { mutateAsync: createMovement, isPending } = useCreateMovement();

    const handleSubmit = async () => {
        if (!destinationId) {
            toast.error("Please select a destination location.");
            return;
        }

        const itemsToMove = items.filter((item) => selectedItemIds.includes(item.id));

        const movePromises = itemsToMove.map((item) => {
            const body: InventoryMovementCreateEntity = {
                itemId: item.id,
                fromLocationId: item.holderLocationId,
                toLocationId: destinationId,
                reason: MovementReason.TRANSFER, // jus as default it's gonnna be transfer -- like if you're moving
                // a bunch of things at once, it's prolly for the same reason yk i.e. transfer
            };
            return createMovement(body);
        });

        toast.promise(Promise.all(movePromises), {
            loading: `Moving ${itemsToMove.length} items...`,
            success: () => {
                onOpenChange(false);
                onSuccess();
                return `${itemsToMove.length} items moved successfully!`;
            },
            error: (err) => {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                return `Failed to move items: ${message}`;
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Move {selectedItemIds.length} Items</DialogTitle>
                    <DialogDescription>
                        Select a new location for the selected items. This will create a new "Transfer" movement record for each item.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select onValueChange={(value) => setDestinationId(parseInt(value, 10))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a destination" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((location) => (
                                <SelectItem key={location.id} value={String(location.id)}>
                                    {location.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!destinationId || isPending}>
                        {isPending ? "Moving..." : "Confirm Move"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}