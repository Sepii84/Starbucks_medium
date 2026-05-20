import Image from "next/image";
import { ArrowRight, Leaf, Sparkles, Zap } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { FallbackImage } from "@/components/ui/FallbackImage";
import { GlassCard } from "@/components/ui/GlassCard";
import { getFeaturedMenuItems, getSiteInfo } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, siteInfo] = await Promise.all([getFeaturedMenuItems(3), getSiteInfo()]);

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden px-5 md:px-16">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 py-12 md:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-[11px] font-bold uppercase text-primary">
                Next-gen brewing
              </span>
            </div>
            <div className="space-y-5">
              <h1 className="font-display text-5xl font-extrabold uppercase leading-tight md:text-7xl">
                Brewed for <br />
                <span className="bg-gradient-to-r from-primary via-secondary to-amber bg-clip-text text-transparent">
                  the Future
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-on-surface-variant">
                Experience coffee through technological precision and botanical luxury.
                Every cup is crafted for calm focus, quick ordering, and a little neon glow.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <LinkButton href="/menu">
                Explore Menu
                <ArrowRight size={16} />
              </LinkButton>
              <LinkButton href="/about" variant="ghost">
                Our Story
              </LinkButton>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-[115%] w-[115%] rounded-full bg-primary/10 blur-3xl" />
            <GlassCard className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] p-4">
              <Image
                src="/images/site/home-hero-coffee.png"
                alt="Futuristic coffee cup on a dark counter"
                width={720}
                height={900}
                priority
                className="h-full w-full rounded-[1.4rem] object-cover brightness-110"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-xl border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] font-bold uppercase text-primary">
                  Signature Drop
                </p>
                <p className="mt-1 font-display text-xl font-semibold">Siren Mist Latte</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase text-primary">
                Curated fluidity
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                Popular right now
              </h2>
            </div>
            <LinkButton href="/menu" variant="secondary">
              View Full Menu
            </LinkButton>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {featured.map((item) => (
              <GlassCard key={item.id} className="overflow-hidden rounded-2xl">
                <FallbackImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-56 w-full object-cover"
                />
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-xl font-semibold uppercase">{item.name}</h3>
                    <span className="text-primary">{formatCurrency(Number(item.price))}</span>
                  </div>
                  <p className="text-sm leading-6 text-on-surface-variant">{item.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low/35 px-5 py-20 backdrop-blur-sm md:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:items-center">
          <GlassCard className="relative overflow-hidden rounded-[2rem]">
            <Image
              src="/images/site/home-sanctuary-interior.png"
              alt="Luxury coffee shop interior"
              width={900}
              height={900}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="font-display text-2xl font-semibold">The Sanctuary</p>
              <p className="font-mono text-[10px] font-bold uppercase text-primary">
                Seattle flight 01
              </p>
            </div>
          </GlassCard>

          <div className="space-y-8">
            <h2 className="font-display text-4xl font-semibold uppercase leading-tight">
              Rooted in craft,
              <br />
              <span className="text-secondary">wired for speed</span>
            </h2>
            <p className="text-lg leading-8 text-on-surface-variant">{siteInfo.aboutText}</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Leaf, label: "Botanical", value: "100%" },
                { icon: Zap, label: "Fast Orders", value: "24/7" },
                { icon: Sparkles, label: "Fresh Menu", value: "Live" }
              ].map((stat) => (
                <GlassCard key={stat.label} className="p-4">
                  <stat.icon className="mb-4 text-primary" size={20} />
                  <p className="font-display text-2xl font-bold text-secondary">{stat.value}</p>
                  <p className="mt-1 font-mono text-[10px] font-bold uppercase text-on-surface-variant">
                    {stat.label}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
