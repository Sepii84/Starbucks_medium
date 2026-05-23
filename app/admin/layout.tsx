import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AppBackground } from "@/components/layout/AppBackground";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, isActive: true }
  });

  if (!admin?.isActive || admin.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AppBackground>
      <AdminSidebar initialUnreadCount={0} />
      <main className="min-h-screen px-5 pb-12 pt-24 lg:pl-80 lg:pr-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </AppBackground>
  );
}
