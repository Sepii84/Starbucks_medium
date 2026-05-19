import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GlassCard } from "@/components/ui/GlassCard";

export default function RegisterPage() {
  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-5 py-14">
      <GlassCard className="w-full max-w-lg p-6 md:p-8">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            User registration
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold uppercase">
            Create account
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Public registration creates normal user accounts only. Admin accounts are
            managed through the database/admin panel.
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link className="text-primary hover:underline" href="/login">
            Login
          </Link>
        </p>
      </GlassCard>
    </section>
  );
}
