import { PublicChrome } from "@/components/layout/PublicChrome";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
