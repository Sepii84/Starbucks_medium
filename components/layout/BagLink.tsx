"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/order/CartProvider";

export function BagLink({
  className,
  compact = false
}: {
  className?: string;
  compact?: boolean;
}) {
  const { count } = useCart();

  return (
    <Link
      href="/order"
      className={cn(
        "focus-ring relative inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 font-mono text-[11px] font-bold uppercase text-primary transition hover:bg-primary/15",
        className
      )}
      aria-label={`Open bag with ${count} items`}
    >
      <ShoppingBag size={compact ? 18 : 16} />
      <span className={compact ? "text-[10px]" : ""}>Bag</span>
      <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] text-on-primary">
        {count}
      </span>
    </Link>
  );
}
