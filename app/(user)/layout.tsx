import { PublicChrome } from "@/components/layout/PublicChrome";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";

export const dynamic = "force-dynamic";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicChrome>
      <PublicPageFrame>{children}</PublicPageFrame>
    </PublicChrome>
  );
}
