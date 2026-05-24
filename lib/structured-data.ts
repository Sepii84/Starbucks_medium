import { absoluteUrl, defaultSeoDescription, logoPath, siteName } from "@/lib/seo";

type PublicSiteInfo = {
  instagramUrl?: string | null;
  twitterUrl?: string | null;
};

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl("/"),
    description: defaultSeoDescription
  };
}

export function cafeJsonLd(siteInfo?: PublicSiteInfo) {
  const sameAs = [siteInfo?.instagramUrl, siteInfo?.twitterUrl].filter(
    (url): url is string => Boolean(url && url !== "#" && url.startsWith("https://"))
  );

  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: siteName,
    url: absoluteUrl("/"),
    logo: absoluteUrl(logoPath),
    image: absoluteUrl("/images/site/sanctuary-coffee-shop.png"),
    description: defaultSeoDescription,
    servesCuisine: "Coffee",
    ...(sameAs.length ? { sameAs } : {})
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}
