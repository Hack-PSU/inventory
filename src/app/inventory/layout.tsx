"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BarChart3,
	BookOpen,
	Boxes,
	Home,
	LocateFixed,
	Repeat,
	Warehouse,
} from "lucide-react";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

const navigation = [
	{ name: "Items", href: "/inventory/items", icon: Boxes },
	{ name: "Categories", href: "/inventory/categories", icon: Warehouse },
	{ name: "Locations", href: "/inventory/locations", icon: LocateFixed },
	{ name: "Movements", href: "/inventory/movements", icon: Repeat },
	{ name: "Analytics", href: "/inventory/analytics", icon: BarChart3 },
	{ name: "Catalog", href: "/inventory/catalog", icon: BookOpen },
];

export default function InventoryLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<aside className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
						<Link href="/" className="flex items-center gap-2 font-semibold">
							<Home className="h-6 w-6" />
							<span className="">Inventory</span>
						</Link>
					</div>
					<div className="flex-1">
						<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
							{navigation.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
										pathname.startsWith(item.href) && "bg-muted text-primary"
									)}
								>
									<item.icon className="h-4 w-4" />
									{item.name}
								</Link>
							))}
						</nav>
					</div>
				</div>
			</aside>
			<main className="flex flex-col p-4 sm:p-6 lg:p-8">
				{children}
				<Toaster richColors />
			</main>
		</div>
	);
}
