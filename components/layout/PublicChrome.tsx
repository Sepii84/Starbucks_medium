import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppBackground } from "@/components/layout/AppBackground";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { getSessionUser } from "@/lib/auth";
import { serializeSessionUserForClient } from "@/lib/serializers";

export async function PublicChrome({
  children,
  redirectAdmins = true
}: {
  children: React.ReactNode;
  redirectAdmins?: boolean;
}) {
  const user = await getSessionUser();
  const clientUser = user ? serializeSessionUserForClient(user) : null;

  if (redirectAdmins && user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  return (
    <AppBackground>
      <div className="flex min-h-screen flex-col">
        <Navbar user={clientUser} />
        <MobileNav user={clientUser} />
        {children}
      </div>
    </AppBackground>
  );
}
