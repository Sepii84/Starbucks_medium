import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Sora } from "next/font/google";
import { CartProvider } from "@/components/order/CartProvider";
import {
  absoluteUrl,
  defaultOgImage,
  defaultSeoDescription,
  getBaseUrl,
  logoPath,
  siteName
} from "@/lib/seo";
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
  metadataBase: getBaseUrl(),
  title: {
    default: "Starbucks Medium | Premium Coffee, Rewards & Gift Cards",
    template: `%s | ${siteName}`
  },
  description: defaultSeoDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: absoluteUrl("/") }],
  creator: siteName,
  publisher: siteName,
  keywords: [
    "coffee",
    "premium coffee",
    "coffee menu",
    "coffee rewards",
    "gift cards",
    "Starbucks-inspired demo",
    "online coffee ordering"
  ],
  icons: {
    icon: logoPath,
    shortcut: logoPath,
    apple: logoPath
  },
  alternates: {
    canonical: absoluteUrl("/")
  },
  openGraph: {
    type: "website",
    siteName,
    title: "Starbucks Medium | Premium Coffee, Rewards & Gift Cards",
    description: defaultSeoDescription,
    url: absoluteUrl("/"),
    images: [defaultOgImage]
  },
  twitter: {
    card: "summary_large_image",
    title: "Starbucks Medium | Premium Coffee, Rewards & Gift Cards",
    description: defaultSeoDescription,
    images: [defaultOgImage.url]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
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
