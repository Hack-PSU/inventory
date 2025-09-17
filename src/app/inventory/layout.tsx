"use client";

import type React from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import { InventoryBottomNavbar } from "@/components/InventoryBottomNavbar";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
        <div className="w-full flex-1">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="Home" className="h-6 w-6" />
            <span>Inventory</span>
          </Link>
        </div>
      </header>

			{/* Main Content */}
			<main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24">
				{children}
				<Toaster richColors />
			</main>

      {/* Bottom Navigation */}
      <InventoryBottomNavbar />
    </div>
  );
}
