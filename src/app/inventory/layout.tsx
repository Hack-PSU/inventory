"use client";

import type React from "react";
import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Boxes,
	Home,
	LocateFixed,
	Repeat,
	Warehouse,
	BarChart3,
	BookOpen,
	Menu,
} from "lucide-react";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
	{ name: "Items", href: "/inventory/items", icon: Boxes },
	{ name: "Categories", href: "/inventory/categories", icon: Warehouse },
	{ name: "Locations", href: "/inventory/locations", icon: LocateFixed },
	{ name: "Movements", href: "/inventory/movements", icon: Repeat },
	{ name: "Analytics", href: "/inventory/analytics", icon: BarChart3 },
	{ name: "Catalog", href: "/inventory/catalog", icon: BookOpen },
];

function NavigationItems({ onItemClick }: { onItemClick?: () => void }) {
	const pathname = usePathname();

	return (
		<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
			{navigation.map((item) => (
				<Link
					key={item.name}
					href={item.href}
					onClick={onItemClick}
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
	);
}

export default function InventoryLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			{/* Desktop Sidebar */}
			<aside className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
						<Link href="/" className="flex items-center gap-2 font-semibold">
							<Home className="h-6 w-6" />
							<span>Inventory</span>
						</Link>
					</div>
					<div className="flex-1">
						<NavigationItems />
					</div>
				</div>
			</aside>

			{/* Mobile Layout */}
			<div className="flex flex-col md:hidden">
				{/* Mobile Header */}
				<header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
					<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="shrink-0 md:hidden bg-transparent"
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="flex flex-col">
							<div className="flex items-center gap-2 font-semibold">
								<Home className="h-6 w-6" />
								<span>Inventory</span>
							</div>
							<div className="flex-1 mt-4">
								<NavigationItems onItemClick={() => setMobileMenuOpen(false)} />
							</div>
						</SheetContent>
					</Sheet>
					<div className="w-full flex-1">
						<Link href="/" className="flex items-center gap-2 font-semibold">
							<Home className="h-6 w-6" />
							<span>Inventory</span>
						</Link>
					</div>
				</header>
			</div>

			{/* Main Content */}
			<main className="flex flex-col p-4 sm:p-6 lg:p-8">
				{children}
				<Toaster richColors />
			</main>
		</div>
	);
}
