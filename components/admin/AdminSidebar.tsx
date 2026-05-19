"use client";

import {
  Bell,
  Coffee,
  Globe2,
  Home,
  LogOut,
  Menu,
  Shield,
  ShoppingBag,
  UserCircle,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/menu", label: "Menu Management", icon: Coffee },
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
    <div className="flex h-full flex-col">
      <Link href="/admin" className="mb-8 flex items-center gap-3" onClick={onNavigate}>
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

      <nav className="space-y-2">
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

      <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
        <Link
          href="/admin/notifications"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-on-surface-variant"
        >
          <span>Unread alerts</span>
          <NotificationBell count={unreadCount} />
        </Link>
        <form action={logoutAction}>
          <Button className="w-full" type="submit" variant="ghost">
            <LogOut size={16} />
            Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed left-0 top-0 z-50 hidden h-screen w-72 border-r border-white/10 bg-surface/60 p-5 backdrop-blur-3xl lg:block">
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
          <div className="h-full w-[86vw] max-w-sm border-r border-white/10 bg-surface p-5">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                className="focus-ring rounded-full border border-white/10 p-2 text-primary"
                onClick={() => setOpen(false)}
                aria-label="Close admin navigation"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent unreadCount={unreadCount} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
