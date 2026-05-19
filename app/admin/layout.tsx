import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AppBackground } from "@/components/layout/AppBackground";
import { requireAdmin } from "@/lib/auth";
import { getAdminNotificationCount } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unreadCount = await getAdminNotificationCount();

  return (
    <AppBackground>
      <AdminSidebar unreadCount={unreadCount} />
      <main className="min-h-screen px-5 pb-12 pt-24 lg:pl-80 lg:pr-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </AppBackground>
  );
}
