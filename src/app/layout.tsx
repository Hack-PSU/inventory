import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/common/context";
import { BottomNav } from "@/components/BottomNavbar";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "HackPSU Inventory App",
	description: "HackPSU Inventory App",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<LayoutProvider>
					{children}
					<BottomNav />
					<Toaster richColors position="bottom-right" />
				</LayoutProvider>
				<Analytics />
			</body>
		</html>
	);
}
