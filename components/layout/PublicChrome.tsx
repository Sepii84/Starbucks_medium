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
      <div className="flex min-h-screen flex-col">
        <Navbar user={user} />
        <MobileNav user={user} />
        <main id="main-content" className="flex-1 pt-20">
          {children}
        </main>
        <Footer siteInfo={siteInfo} />
      </div>
    </AppBackground>
  );
}
