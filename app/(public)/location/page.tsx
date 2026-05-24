import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PublicPageFrame } from "@/components/layout/PublicPageFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { GlassCard } from "@/components/ui/GlassCard";
import { LinkButton } from "@/components/ui/Button";
import { getSiteInfo } from "@/lib/data";
import { createPageMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "Locations | Starbucks Medium",
    description:
      "Find Starbucks Medium cafe location information, opening details, and contact options.",
    path: "/location"
  })
};

export default async function LocationPage() {
  const siteInfo = await getSiteInfo();

  return (
    <PublicPageFrame siteInfo={siteInfo}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Locations", path: "/location" }
        ])}
      />
      <section className="px-5 py-14 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">Location</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase md:text-6xl">
            Find the sanctuary
          </h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">
            Visit us in person, call the bar, or place an order before you arrive.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {[
              { icon: MapPin, label: "Address", value: siteInfo.address },
              { icon: Clock, label: "Opening hours", value: siteInfo.openingHours },
              { icon: Phone, label: "Phone", value: siteInfo.phone },
              { icon: Mail, label: "Email", value: siteInfo.email }
            ].map((item) => (
              <GlassCard key={item.label} className="flex gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase text-primary">
                    {item.label}
                  </p>
                  <p className="mt-1 text-on-surface-variant">{item.value}</p>
                </div>
              </GlassCard>
            ))}
          </div>
          <GlassCard className="flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl p-8">
            <div className="admin-grid -m-8 mb-0 flex min-h-72 items-center justify-center bg-surface-container/50 p-8">
              <div className="rounded-full border border-primary/30 bg-primary/10 px-6 py-3 font-mono text-[11px] font-bold uppercase text-primary shadow-glow">
                Map preview
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/menu">Order Ahead</LinkButton>
              {siteInfo.mapUrl && (
                <LinkButton href={siteInfo.mapUrl} variant="ghost">
                  Open Map
                </LinkButton>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
      </section>
    </PublicPageFrame>
  );
}
