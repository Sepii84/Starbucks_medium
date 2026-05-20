import { Award, Coffee, Gift, LogOut, Shield, UserCircle, WalletCards } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BagLink } from "@/components/layout/BagLink";
import { Button, LinkButton } from "@/components/ui/Button";
import type { SessionUser } from "@/lib/auth";

export function Navbar({ user }: { user: SessionUser | null }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-surface/35 px-5 py-4 shadow-2xl backdrop-blur-3xl md:px-16">
      <a
        href="#main-content"
        className="focus-ring sr-only rounded-full bg-background px-4 py-3 text-sm text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-glow">
            <Coffee size={20} />
          </span>
          <span className="font-display text-xl font-extrabold uppercase text-primary md:text-2xl">
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

        <div className="hidden items-center gap-3 md:flex">
          {user?.role === "USER" && <BagLink />}
          {user?.role === "ADMIN" && (
            <LinkButton href="/admin" variant="secondary">
              <Shield size={16} />
              Admin
            </LinkButton>
          )}
          {user ? (
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">
                <LogOut size={16} />
                Logout
              </Button>
            </form>
          ) : (
            <LinkButton href="/login" variant="secondary">
              <UserCircle size={16} />
              Login
            </LinkButton>
          )}
        </div>
      </div>
    </header>
  );
}
