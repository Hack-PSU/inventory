"use client";

import { useState } from "react";
import { QrCode, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Scanner } from "@yudiel/react-qr-scanner";
import { cn } from "@/lib/utils";

interface QuickScanButtonProps {
	onScan: (scannedCode: string) => void;
	title?: string;
	description?: string;
	variant?: "default" | "secondary" | "outline";
	className?: string;
}

export function QuickScanButton({
	onScan,
	title = "Quick Scan",
	description = "Scan a barcode to quickly select an item",
	variant = "default",
	className,
}: QuickScanButtonProps) {
	const [showScanner, setShowScanner] = useState(false);

	const handleScanResult = (result: any[]) => {
		if (result && result.length > 0) {
			const scannedValue = result[0].rawValue;
			setShowScanner(false);
			onScan(scannedValue);
		}
	};

	const handleScanError = (error: unknown) => {
		console.error("Scan error:", error);
		toast.error("Failed to access camera. Please check permissions.");
	};

	return (
		<>
			<Button
				variant={variant}
				onClick={() => setShowScanner(true)}
				className={cn("flex items-center gap-2", className)}
			>
				<QrCode className="h-4 w-4" />
				<span className="hidden sm:inline">{title}</span>
				<span className="sm:hidden">Scan</span>
			</Button>

			<Dialog open={showScanner} onOpenChange={setShowScanner}>
				<DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] p-0">
					<DialogHeader className="px-4 pt-4 pb-2">
						<DialogTitle className="text-lg">{title}</DialogTitle>
						<DialogDescription className="text-sm">
							{description}
						</DialogDescription>
					</DialogHeader>

					<div className="relative mx-4 mb-4">
						<Scanner
							onScan={handleScanResult}
							onError={handleScanError}
							formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8"]}
							components={{
								finder: true,
								torch: true,
							}}
							styles={{
								container: {
									width: "100%",
									height: "280px",
									borderRadius: "8px",
									overflow: "hidden",
								},
							}}
						/>
						<Button
							variant="outline"
							size="icon"
							className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm h-8 w-8"
							onClick={() => setShowScanner(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="px-4 pb-4 text-xs text-muted-foreground text-center">
						Supports QR, Code128, Code39, EAN-13/8 formats
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
