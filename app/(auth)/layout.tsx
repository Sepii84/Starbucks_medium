import { PublicChrome } from "@/components/layout/PublicChrome";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
