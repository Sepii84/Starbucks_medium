import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Login | Starbucks Medium",
  description:
    "Sign in to Starbucks Medium to access ordering, wallet, rewards, gift cards, or the admin dashboard."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-14">
      <GlassCard className="w-full max-w-md p-6 md:p-8">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Secure entry
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold uppercase">Login</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Admins are sent to the dashboard. Guests with user accounts return to the
            ordering flow.
          </p>
        </div>
        <LoginForm message={params.message} next={params.next} />
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          New here?{" "}
          <Link className="text-primary hover:underline" href="/register">
            Create a user account
          </Link>
        </p>
      </GlassCard>
    </section>
  );
}
