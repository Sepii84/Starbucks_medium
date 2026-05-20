import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppBackground } from "@/components/layout/AppBackground";
import { MobileNav } from "@/components/layout/MobileNav";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/auth";

export async function PublicChrome({
  children,
  redirectAdmins = true
}: {
  children: React.ReactNode;
  redirectAdmins?: boolean;
}) {
  const user = await getCurrentUser();

  if (redirectAdmins && user?.role === Role.ADMIN) {
    redirect("/admin");
  }

  return (
    <AppBackground>
      <div className="flex min-h-screen flex-col">
        <Navbar user={user} />
        <MobileNav user={user} />
        {children}
      </div>
    </AppBackground>
  );
}
