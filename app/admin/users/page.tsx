import { Search } from "lucide-react";
import { AdminUserForm } from "@/components/admin/AdminUserForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { inputClasses } from "@/components/ui/Form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [admin, params] = await Promise.all([requireAdmin(), searchParams]);
  const q = params.q?.trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">Users</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">Account control</h1>
      </div>
      <GlassCard className="p-5">
        <form className="relative max-w-lg">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size={18}
          />
          <input
            className={`${inputClasses} pl-11`}
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search users by name or email"
          />
        </form>
      </GlassCard>
      <div className="space-y-4">
        {users.length ? (
          users.map((user) => (
            <AdminUserForm key={user.id} user={user} currentAdminId={admin.id} />
          ))
        ) : (
          <GlassCard className="p-8 text-on-surface-variant">No matching users.</GlassCard>
        )}
      </div>
    </div>
  );
}
