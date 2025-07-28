"use client";

import { useDevices } from "@yudiel/react-qr-scanner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Camera } from "lucide-react";

interface CameraSelectorProps {
	selectedDeviceId?: string;
	onDeviceChange: (deviceId: string) => void;
	className?: string;
}

export function CameraSelector({
	selectedDeviceId,
	onDeviceChange,
	className,
}: CameraSelectorProps) {
	const devices = useDevices();

	// Filter for video input devices (cameras)
	const videoDevices = devices.filter(
		(device) => device.kind === "videoinput" && device.deviceId !== "default"
	);

	if (videoDevices.length <= 1) {
		return null; // Don't show selector if only one camera available
	}

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Camera className="h-4 w-4 text-muted-foreground" />
			<Select value={selectedDeviceId} onValueChange={onDeviceChange}>
				<SelectTrigger className="w-[200px]">
					<SelectValue placeholder="Select camera" />
				</SelectTrigger>
				<SelectContent>
					{videoDevices.map((device, index) => (
						<SelectItem key={device.deviceId} value={device.deviceId}>
							{device.label || `Camera ${index + 1}`}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
