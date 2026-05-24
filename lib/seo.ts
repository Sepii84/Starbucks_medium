import type { Metadata } from "next";

export const siteName = "Starbucks Medium";
export const defaultSeoDescription =
  "Order handcrafted coffee, explore premium menu favorites, earn rewards, and send digital gift cards through Starbucks Medium.";
export const defaultOgImage = {
  url: "/images/site/sanctuary-coffee-shop.png",
  width: 1672,
  height: 941,
  alt: "Warm green-toned Starbucks Medium coffee shop interior"
};
export const logoPath = "/images/site/starbucks-brand-mark.svg";

export function getBaseUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.NODE_ENV === "production"
      ? "https://starbucks-medium.vercel.app"
      : "http://localhost:3011");

  try {
    return new URL(candidate);
  } catch {
    return new URL("http://localhost:3011");
  }
}

export function absoluteUrl(path = "/") {
  return new URL(path, getBaseUrl()).toString();
}

export function createPageMetadata({
  title,
  description,
  path,
  image = defaultOgImage,
  noIndex = false
}: {
  title: string;
  description: string;
  path: string;
  image?: typeof defaultOgImage;
  noIndex?: boolean;
}): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical
    },
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: canonical,
      images: [
        {
          url: image.url,
          width: image.width,
          height: image.height,
          alt: image.alt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false
          }
        }
      : {
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
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};
