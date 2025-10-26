"use client";

import { useState } from "react";
import { toast } from "sonner";
import { QrCode, X, Trash2 } from "lucide-react";

import type { InventoryItemEntity, InventoryMovementCreateEntity } from "@/common/api/inventory";
import { useCreateMovement } from "@/common/api/inventory";
import { MovementReason } from "@/common/api/inventory";
import type { LocationEntity } from "@/common/api/location";
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
import { Badge } from "@/components/ui/badge";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CameraSelector } from "./camera-selector";

interface NewBulkMoveDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: InventoryItemEntity[];
	locations: LocationEntity[];
    onSuccess: () => void;
}

export function NewBulkMoveDialog({
	open,
	onOpenChange,
	items,
	locations,
    onSuccess,
}: NewBulkMoveDialogProps) {
    const { mutateAsync: createMovement, isPending } = useCreateMovement();
	const [showScanner, setShowScanner] = useState(false);
	const [selectedCameraId, setSelectedCameraId] = useState<string>("");
	const [scannedItems, setScannedItems] = useState<InventoryItemEntity[]>([]);
	const [toLocationId, setToLocationId] = useState<string>("none");
    const [reason, setReason] = useState<MovementReason>(MovementReason.TRANSFER);

	const handleScanResult = (result: any[]) => {
		if (result && result.length > 0) {
			const scannedValue = result[0].rawValue;

			// Find item by asset tag or name
			const foundItem = items.find(
				(item) =>
					item.assetTag === scannedValue ||
					item.name === scannedValue ||
					item.id === scannedValue
			);

			if (foundItem) {
				// Check if item is already in the list
				if (scannedItems.find((item) => item.id === foundItem.id)) {
					toast.warning(`Item ${foundItem.name || foundItem.assetTag} is already in the list`);
				} else {
					setScannedItems((prev) => [...prev, foundItem]);
					toast.success(`Added item: ${foundItem.name || foundItem.assetTag}`);
				}
			} else {
				toast.error(`No item found with code: ${scannedValue}`);
			}
		}
	};

	const handleScanError = (error: unknown) => {
		console.error("Scan error:", error);
		toast.error("Failed to access camera. Please check permissions.");
	};

	const removeItem = (itemId: string) => {
		setScannedItems((prev) => prev.filter((item) => item.id !== itemId));
	};

	const handleSubmit = () => {
		if (scannedItems.length === 0) {
			toast.error("Please scan at least one item");
			return;
		}

		if (toLocationId === "none") {
			toast.error("Please select a destination location.");
			return;
		}

		// TODO: Implement bulk move mutation
		const promises = scannedItems.map((item) => {
            const body: InventoryMovementCreateEntity = {
                itemId: item.id,
                fromLocationId: item.holderLocationId,
                toLocationId: toLocationId === "none" ? null : Number(toLocationId),
                reason: reason,
            };
            return createMovement(body)
        });

        toast.promise(Promise.all(promises), {
            loading: `Moving ${scannedItems.length} items...`,
            success: () => {
                onOpenChange(false);
                onSuccess();
                return `${scannedItems.length} items moved successfully!`;
            },
            error: (err) => {
                const message = err instanceof Error ? err.message : "An unknown error occurred.";
                console.log(message);
                return `Failed to move items: ${message}`;
            },
        });

		// Reset form
		setScannedItems([]);
		setToLocationId("none");
		setReason(MovementReason.TRANSFER);
		onOpenChange(false);
	};

	const handleCancel = () => {
		setScannedItems([]);
		setToLocationId("none");
		setReason(MovementReason.TRANSFER);
		setShowScanner(false);
		onOpenChange(false);
	};

	if (showScanner) {
		return (
			<Dialog open={open} onOpenChange={handleCancel}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Scan Item</DialogTitle>
						<DialogDescription>
							Position the barcode in the camera view to scan
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<CameraSelector
							selectedDeviceId={selectedCameraId}
							onDeviceChange={setSelectedCameraId}
						/>
						
							<div className="relative">
								<Scanner
									onScan={handleScanResult}
									onError={handleScanError}
									formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8"]}
									constraints={{
										deviceId: selectedCameraId
											? { exact: selectedCameraId }
											: undefined,
									}}
									components={{
										finder: true,
										torch: true,
									}}
									styles={{
										container: { width: "100%", height: "250px" },
									}}
								/>
								<Button
									variant="outline"
									size="icon"
									className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
									onClick={() => setShowScanner(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowScanner(false)}>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleCancel}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Bulk Move Items</DialogTitle>
					<DialogDescription>
						Scan multiple items and move them between locations
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Scan Button */}
					<div className="flex justify-center">
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowScanner(true)}
							className="w-full sm:w-auto"
						>
							<QrCode className="mr-2 h-4 w-4" />
							Scan Item
						</Button>
					</div>

					{/* Location and Reason Dropdowns */}
					<div className="grid grid-cols-1 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">To Location</label>
							<Select
								value={toLocationId}
								onValueChange={setToLocationId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select destination location" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									{locations.map((location) => (
										<SelectItem key={location.id} value={String(location.id)}>
											{location.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Reason</label>
							<Select
								value={reason}
								onValueChange={(value) => setReason(value as MovementReason)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select movement reason" />
								</SelectTrigger>
								<SelectContent>
									{Object.values(MovementReason).map((reasonValue) => (
										<SelectItem key={reasonValue} value={reasonValue}>
											{reasonValue.charAt(0).toUpperCase() + reasonValue.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Scanned Items List */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label className="text-sm font-medium">
								Scanned Items ({scannedItems.length})
							</label>
						</div>
						
						{scannedItems.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
								No items scanned yet. Use the scan button to add items.
							</div>
						) : (
							<div className="max-h-48 overflow-y-auto border rounded-lg">
								{scannedItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center justify-between p-3 border-b last:border-b-0"
									>
										<div className="flex-1">
											<div className="font-medium">
												{item.name || "Unknown Item"}
											</div>
											<div className="text-sm text-muted-foreground">
												<Badge variant="outline" className="text-xs">
													{item.assetTag}
												</Badge>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => removeItem(item.id)}
											className="text-red-500 hover:text-red-700"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button 
						onClick={handleSubmit}
						disabled={scannedItems.length === 0}
					>
						Move {scannedItems.length} Item{scannedItems.length !== 1 ? 's' : ''}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
