import Image from "next/image";
import type { Metadata } from "next";
import { GlassCard } from "@/components/ui/GlassCard";
import { getSiteInfo } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About | Starbucks Medium",
  description:
    "Learn about the Starbucks Medium demo coffee shop experience, from premium café craft to live digital ordering."
};

const featureBlocks = [
  {
    title: "Craft roast",
    description:
      "Carefully selected blends, warm flavor profiles, and a premium cafe experience built around quality and consistency."
  },
  {
    title: "Live ordering",
    description:
      "Browse the live menu, choose your favorites, and place orders through a smooth digital flow."
  },
  {
    title: "Admin managed",
    description:
      "Menu items, availability, rewards, gift cards, and orders are managed through a dedicated admin system."
  }
];

export default async function AboutPage() {
  const siteInfo = await getSiteInfo();

  return (
    <section className="px-5 py-14 md:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-6">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">About us</p>
          <h1 className="font-display text-4xl font-extrabold uppercase leading-tight md:text-6xl">
            Botanical luxury with a working pulse
          </h1>
          <p className="text-lg leading-8 text-on-surface-variant">{siteInfo.aboutText}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {featureBlocks.map((item) => (
              <GlassCard key={item.title} className="p-5">
                <p className="font-mono text-[11px] font-bold uppercase text-primary">
                  {item.title}
                </p>
                <p className="mt-3 text-sm text-on-surface-variant">
                  {item.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
        <GlassCard className="overflow-hidden rounded-[2rem]">
          <Image
            src="/images/site/about-coffee-bar.png"
            alt="Coffee shop bar"
            width={900}
            height={1100}
            className="aspect-[4/5] w-full object-cover"
          />
        </GlassCard>
      </div>
    </section>
  );
}
