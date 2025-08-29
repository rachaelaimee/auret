import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auret - Creator-First Marketplace",
  description: "A creator-first marketplace for handmade goods and digital craft assets",
  keywords: ["marketplace", "handmade", "digital assets", "creators", "crafts"],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <CurrencyProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}