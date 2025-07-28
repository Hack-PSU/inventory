"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	Boxes,
	Warehouse,
	LocateFixed,
	Repeat,
	BarChart3,
	BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
	name: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	shortName: string;
}

const navigation: NavItem[] = [
	{ name: "Items", href: "/inventory/items", icon: Boxes, shortName: "Items" },
	{
		name: "Categories",
		href: "/inventory/categories",
		icon: Warehouse,
		shortName: "Categories",
	},
	{
		name: "Locations",
		href: "/inventory/locations",
		icon: LocateFixed,
		shortName: "Locations",
	},
	{
		name: "Movements",
		href: "/inventory/movements",
		icon: Repeat,
		shortName: "Movements",
	},
	{
		name: "Analytics",
		href: "/inventory/analytics",
		icon: BarChart3,
		shortName: "Analytics",
	},
	{
		name: "Catalog",
		href: "/inventory/catalog",
		icon: BookOpen,
		shortName: "Catalog",
	},
];

export function InventoryBottomNavbar() {
	const pathname = usePathname();
	const router = useRouter();

	const handleNavigation = (href: string) => {
		router.push(href);
	};

	const isActive = (href: string) => pathname.startsWith(href);

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
			<div className="grid grid-cols-6 h-16 max-w-screen-xl mx-auto px-2 sm:px-4">
				{navigation.map((item) => {
					const Icon = item.icon;
					const active = isActive(item.href);

					return (
						<button
							key={item.name}
							onClick={() => handleNavigation(item.href)}
							className={cn(
								"relative flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 rounded-lg",
								"hover:text-primary hover:bg-primary/5",
								active ? "text-primary" : "text-muted-foreground"
							)}
						>
							{/* Active Background */}
							{active && (
								<motion.div
									layoutId="bottomNavActive"
									className="absolute inset-0 bg-primary/10 rounded-lg"
									initial={false}
									transition={{
										type: "spring",
										stiffness: 300,
										damping: 30,
									}}
								/>
							)}

							{/* Icon */}
							<Icon
								className={cn(
									"h-5 w-5 mb-1 transition-all duration-200 relative z-10",
									active && "scale-110"
								)}
							/>

							{/* Label - only show on larger screens */}
							<span
								className={cn(
									"text-xs font-medium leading-none transition-all duration-200 relative z-10",
									"hidden sm:block"
								)}
							>
								{item.shortName}
							</span>

							{/* Active Indicator Dot */}
							{active && (
								<motion.div
									className="absolute -top-1 w-1.5 h-1.5 bg-primary rounded-full"
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{
										type: "spring",
										stiffness: 300,
										damping: 30,
									}}
								/>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
