import { AdminSiteInfoForm } from "@/components/admin/AdminSiteInfoForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSiteInfo } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSiteInfoPage() {
  const siteInfo = await getSiteInfo();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase text-primary">
          Website information
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase">
          Public content
        </h1>
      </div>
      <GlassCard className="p-5">
        <AdminSiteInfoForm siteInfo={siteInfo} />
      </GlassCard>
    </div>
  );
}
