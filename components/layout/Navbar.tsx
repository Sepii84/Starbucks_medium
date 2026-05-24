import { Award, Gift, LogOut, Shield, UserCircle, WalletCards } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BagLink } from "@/components/layout/BagLink";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button, LinkButton } from "@/components/ui/Button";
import type { ClientUser } from "@/lib/serializers";

export function Navbar({ user }: { user: ClientUser | null }) {
  return (
    <header className="fixed top-0 z-50 w-full overflow-x-clip border-b border-white/10 bg-surface/35 px-5 py-4 shadow-2xl backdrop-blur-3xl md:px-16">
      <a
        href="#main-content"
        className="focus-ring sr-only rounded-full bg-background px-4 py-3 text-sm text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 md:gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <span className="truncate font-display text-xl font-extrabold uppercase text-primary md:text-2xl">
            Starbucks
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 font-mono text-[11px] font-bold uppercase text-on-surface-variant md:flex"
        >
          <Link className="transition hover:text-primary" href="/">
            Home
          </Link>
          <Link className="transition hover:text-primary" href="/menu">
            Menu
          </Link>
          <Link className="inline-flex items-center gap-2 transition hover:text-primary" href="/rewards">
            <Award size={14} />
            Rewards
          </Link>
          <Link className="inline-flex items-center gap-2 transition hover:text-primary" href="/gift-cards">
            <Gift size={14} />
            Gift Cards
          </Link>
          {user?.role === "USER" ? (
            <>
              <Link className="inline-flex items-center gap-2 transition hover:text-primary" href="/wallet">
                <WalletCards size={14} />
                Wallet
              </Link>
              <Link className="transition hover:text-primary" href="/account">
                Account
              </Link>
            </>
          ) : (
            <>
              <Link className="transition hover:text-primary" href="/about">
                About
              </Link>
              <Link className="transition hover:text-primary" href="/location">
                Location
              </Link>
            </>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {user?.role === "USER" && (
            <>
              <form action={logoutAction} className="md:hidden">
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-11 w-11 p-0"
                  aria-label="Log out"
                >
                  <LogOut size={18} />
                  <span className="sr-only">Logout</span>
                </Button>
              </form>
              <BagLink iconOnly compact className="md:hidden" />
              <BagLink className="hidden md:inline-flex" />
            </>
          )}
          {user?.role === "ADMIN" && (
            <LinkButton href="/admin" variant="secondary" className="hidden md:inline-flex">
              <Shield size={16} />
              Admin
            </LinkButton>
          )}
          {user ? (
            <form action={logoutAction} className="hidden md:block">
              <Button type="submit" variant="ghost">
                <LogOut size={16} />
                Logout
              </Button>
            </form>
          ) : (
            <LinkButton href="/login" variant="secondary" className="hidden md:inline-flex">
              <UserCircle size={16} />
              Login
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
