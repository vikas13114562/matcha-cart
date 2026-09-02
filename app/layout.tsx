import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700"] });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Matcha Cart | Fresh Matcha",
  description: "Order your fresh Matcha Cart drink.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#173f2a" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
