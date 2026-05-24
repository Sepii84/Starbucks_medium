import type { Metadata } from "next";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { noIndexMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = noIndexMetadata;

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicChrome>
      <PublicPageFrame>{children}</PublicPageFrame>
    </PublicChrome>
  );
}
