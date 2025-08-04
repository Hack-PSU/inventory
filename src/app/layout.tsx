import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutProvider } from "@/common/context";
import { BottomNav } from "@/components/BottomNavbar";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		default: "HackPSU Inventory App",
		template: "%s | HackPSU Inventory",
	},
	description:
		"HackPSU inventory management application for tracking items and equipment. Manage categories, locations, movements, and analytics for hackathon events.",
	authors: [{ name: "HackPSU Team" }],
	creator: "HackPSU Team",
	publisher: "HackPSU",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	manifest: "/manifest.json",
	themeColor: "#ffffff",
	colorScheme: "light",
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
	},
	icons: {
		icon: "/logo.svg",
		shortcut: "/logo.svg",
		apple: "/logo.svg",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "HackPSU Inventory",
		startupImage: "/logo.svg",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://inventory.hackpsu.org",
		title: "HackPSU Inventory App",
		description:
			"HackPSU inventory management application for tracking items and equipment",
		siteName: "HackPSU Inventory",
		images: [
			{
				url: "/logo.svg",
				width: 512,
				height: 512,
				alt: "HackPSU Inventory Logo",
			},
		],
	},
	twitter: {
		card: "summary",
		title: "HackPSU Inventory App",
		description:
			"HackPSU inventory management application for tracking items and equipment",
		images: ["/logo.svg"],
		creator: "@hackpsu",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	other: {
		"mobile-web-app-capable": "yes",
		"application-name": "HackPSU Inventory",
		"msapplication-TileColor": "#ffffff",
		"msapplication-config": "/browserconfig.xml",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="HackPSU Inventory" />
				<link rel="apple-touch-icon" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="72x72" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="96x96" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="128x128" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="144x144" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="152x152" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="180x180" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="192x192" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="384x384" href="/logo.svg" />
				<link rel="apple-touch-icon" sizes="512x512" href="/logo.svg" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-touch-fullscreen" content="yes" />
				<link rel="apple-touch-startup-image" href="/logo.svg" />
			</head>
			<body className={inter.className}>
				<LayoutProvider>
					{children}
					<Toaster richColors position="bottom-right" />
				</LayoutProvider>
				<Analytics />
			</body>
		</html>
	);
}
