import { AdminAccountForm } from "@/components/admin/AdminAccountForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">
          Admin account
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
          Your credentials
        </h1>
      </div>
      <GlassCard className="max-w-3xl p-5">
        <AdminAccountForm admin={admin} />
      </GlassCard>
    </div>
  );
}
