"use client";

import { Award, Gift, Home, Menu, UserCircle, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClientUser } from "@/lib/serializers";
import { cn } from "@/lib/utils";
import { useHideOnScroll } from "@/lib/useHideOnScroll";

function NavItem({
  href,
  label,
  icon: Icon
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-bold uppercase leading-none transition",
        active
          ? "bg-secondary-container/25 text-secondary"
          : "text-on-surface-variant hover:text-primary"
      )}
    >
      <Icon size={16} />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

export function MobileNav({ user }: { user: ClientUser | null }) {
  const hidden = useHideOnScroll({ threshold: 120 });

  return (
    <nav
      aria-label="Mobile primary navigation"
      className={cn(
        "fixed bottom-0 z-50 w-full overflow-x-clip border-t border-tertiary/10 bg-surface-container/50 px-2 pb-3 pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition duration-300 ease-out md:hidden motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        hidden ? "translate-y-6 opacity-35" : "translate-y-0 opacity-100"
      )}
    >
      <div className="grid h-16 grid-cols-6 items-center gap-1">
        <NavItem href="/" label="Home" icon={Home} />
        <NavItem href="/menu" label="Menu" icon={Menu} />
        <NavItem href="/rewards" label="Reward" icon={Award} />
        <NavItem href="/gift-cards" label="Gift Card" icon={Gift} />
        <NavItem href={user?.role === "USER" ? "/wallet" : "/login"} label="Wallet" icon={WalletCards} />
        <NavItem href={user?.role === "USER" ? "/account" : "/login"} label="Me" icon={UserCircle} />
      </div>
    </nav>
  );
}
