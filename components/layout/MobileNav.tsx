"use client";

import { Award, Gift, Home, LogIn, Menu, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagLink } from "@/components/layout/BagLink";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

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
        "flex min-w-14 flex-col items-center justify-center gap-1 rounded-full px-3 py-2 text-[10px] font-bold uppercase transition",
        active
          ? "bg-secondary-container/25 text-secondary"
          : "text-on-surface-variant hover:text-primary"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

export function MobileNav({ user }: { user: SessionUser | null }) {
  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-tertiary/10 bg-surface-container/50 px-2 pb-3 pt-2 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:hidden">
      <div className="flex h-16 items-center justify-around gap-1">
        <NavItem href="/" label="Home" icon={Home} />
        <NavItem href="/menu" label="Menu" icon={Menu} />
        <NavItem href="/rewards" label="Rewards" icon={Award} />
        <NavItem href="/gift-cards" label="Cards" icon={Gift} />
        {user?.role === "USER" ? (
          <>
            <BagLink compact className="px-2 py-2" />
            <NavItem href="/account" label="Me" icon={UserCircle} />
          </>
        ) : (
          <NavItem href="/login" label="Login" icon={LogIn} />
        )}
      </div>
    </nav>
  );
}
