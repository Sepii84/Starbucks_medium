import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppBackground } from "@/components/layout/AppBackground";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { getSiteInfo } from "@/lib/data";

export async function PublicChrome({
  children,
  redirectAdmins = true
}: {
  children: React.ReactNode;
  redirectAdmins?: boolean;
}) {
  const [user, siteInfo] = await Promise.all([getCurrentUser(), getSiteInfo()]);

  if (redirectAdmins && user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  return (
    <AppBackground>
      <Navbar user={user} />
      <main className="min-h-screen pt-20">{children}</main>
      <Footer siteInfo={siteInfo} />
      <MobileNav user={user} />
    </AppBackground>
  );
}
