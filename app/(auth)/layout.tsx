import { PublicChrome } from "@/components/layout/PublicChrome";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <PublicChrome>{children}</PublicChrome>;
}
