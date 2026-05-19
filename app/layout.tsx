import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { CartProvider } from "@/components/order/CartProvider";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

const jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Starbucks Medium",
  description:
    "A futuristic luxury coffee ordering experience with public browsing, user ordering, and admin management."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.variable} ${manrope.variable} ${jetBrains.variable} font-body`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
