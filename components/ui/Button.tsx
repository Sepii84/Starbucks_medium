import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-secondary text-on-primary shadow-glow hover:scale-[0.98]",
  secondary:
    "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
  ghost:
    "border border-white/10 bg-white/[0.03] text-on-surface hover:border-primary/35 hover:text-primary",
  danger:
    "border border-red-400/30 bg-red-500/10 text-red-100 hover:bg-red-500/20"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type LinkButtonProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  className?: string;
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-center font-mono text-[11px] font-bold uppercase leading-none transition",
    variants[variant],
    className
  );
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
