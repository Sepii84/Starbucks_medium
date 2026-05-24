import type { MetadataRoute } from "next";
import { absoluteUrl, getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/menu", "/gift-cards", "/rewards", "/about", "/location"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/order",
          "/wallet",
          "/wallet/",
          "/bag",
          "/wallet/top-up/"
        ]
      }
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getBaseUrl().origin
  };
}
