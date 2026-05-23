"use client";

import {
  Bell,
  Coffee,
  Award,
  Gift,
  Globe2,
  Home,
  LogOut,
  Menu,
  Shield,
  ShoppingBag,
  UserCircle,
  Users,
  WalletCards,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu Management", icon: Coffee },
  { href: "/admin/rewards", label: "Rewards", icon: Award },
  { href: "/admin/gift-cards", label: "Gift Cards", icon: Gift },
  { href: "/admin/wallet", label: "Wallet", icon: WalletCards },
  { href: "/admin/site-info", label: "Website Information", icon: Globe2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/account", label: "Admin Account", icon: UserCircle }
];

function SidebarContent({
  unreadCount,
  onNavigate
}: {
  unreadCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Link
        href="/admin"
        className="flex shrink-0 items-center gap-3 px-5 pb-8 pt-5"
        onClick={onNavigate}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-glow">
          <Shield size={20} />
        </span>
        <span>
          <span className="block font-display text-xl font-extrabold uppercase text-primary">
            Starbucks
          </span>
          <span className="block font-mono text-[10px] font-bold uppercase text-on-surface-variant">
            Admin panel
          </span>
        </span>
      </Link>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-5">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                active
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-transparent text-on-surface-variant hover:border-white/10 hover:bg-white/[0.03] hover:text-on-surface"
              )}
            >
              <span className="flex items-center gap-3">
                <link.icon size={18} />
                {link.label}
              </span>
              {link.href === "/admin/notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/10 p-5 pb-6">
        <Link
          href="/admin/notifications"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-on-surface-variant"
        >
          <span>Unread alerts</span>
          <NotificationBell count={unreadCount} />
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="focus-ring flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300/50 hover:bg-red-500/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    let ignore = false;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/admin/notifications/count", {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { count?: number };

        if (!ignore) {
          setUnreadCount(Number(data.count ?? 0));
        }
      } catch {
        // The badge is progressive enhancement; navigation still works.
      }
    }

    void loadUnreadCount();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <div className="fixed left-0 top-0 z-50 hidden h-screen w-72 overflow-hidden border-r border-white/10 bg-surface/60 backdrop-blur-3xl lg:block">
        <SidebarContent unreadCount={unreadCount} />
      </div>

      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-surface/60 px-4 py-3 backdrop-blur-3xl lg:hidden">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
            <Shield size={18} />
          </span>
          <span className="font-display text-lg font-extrabold uppercase text-primary">
            Starbucks Admin
          </span>
        </Link>
        <button
          type="button"
          className="focus-ring rounded-full border border-white/10 p-2 text-primary"
          onClick={() => setOpen(true)}
          aria-label="Open admin navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/70 lg:hidden">
          <div className="flex h-full w-[86vw] max-w-sm flex-col overflow-hidden border-r border-white/10 bg-surface">
            <div className="flex shrink-0 justify-end px-5 pb-3 pt-5">
              <button
                type="button"
                className="focus-ring rounded-full border border-white/10 p-2 text-primary"
                onClick={() => setOpen(false)}
                aria-label="Close admin navigation"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent unreadCount={unreadCount} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
