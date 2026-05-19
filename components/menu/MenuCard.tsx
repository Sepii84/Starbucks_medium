import Image from "next/image";
import { Lock, Sparkles } from "lucide-react";
import { AddToBagButton } from "@/components/menu/AddToBagButton";
import type { PublicMenuItem } from "@/components/menu/types";
import { LinkButton } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatCurrency } from "@/lib/utils";

export function MenuCard({
  item,
  role
}: {
  item: PublicMenuItem;
  role?: "USER" | "ADMIN" | null;
}) {
  return (
    <article className="group flex h-full flex-col">
      <GlassCard className="relative mb-5 aspect-[4/5] overflow-hidden rounded-2xl p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container/60" />
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={720}
          height={900}
          className="h-full w-full rounded-xl object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-surface/75 px-3 py-2 text-primary backdrop-blur-md">
          <Sparkles size={14} />
          <span className="font-mono text-[10px] font-bold uppercase">
            {item.category.name}
          </span>
        </div>
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-full border border-white/15 bg-surface px-4 py-2 font-mono text-[11px] font-bold uppercase text-on-surface">
              Unavailable
            </span>
          </div>
        )}
      </GlassCard>

      <div className="flex flex-1 flex-col gap-4">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-xl font-semibold uppercase text-on-surface">
              {item.name}
            </h3>
            <p className="shrink-0 font-display text-lg font-light text-primary">
              {formatCurrency(item.price)}
            </p>
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-on-surface-variant">
            {item.description}
          </p>
        </div>

        <div className="mt-auto">
          {role === "USER" && item.isAvailable ? (
            <AddToBagButton
              item={{
                id: item.id,
                name: item.name,
                price: item.price,
                imageUrl: item.imageUrl
              }}
            />
          ) : role === "USER" ? (
            <button
              type="button"
              disabled
              className="w-full rounded-full border border-white/10 px-5 py-3 font-mono text-[11px] font-bold uppercase text-on-surface-variant"
            >
              Currently Unavailable
            </button>
          ) : (
            <LinkButton
              href="/login?message=Please sign in to order.&next=/menu"
              variant="secondary"
              className="w-full"
            >
              <Lock size={16} />
              Login to Order
            </LinkButton>
          )}
        </div>
      </div>
    </article>
  );
}
