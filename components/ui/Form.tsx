import { cn } from "@/lib/utils";

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="mt-2 text-sm text-red-200">{messages[0]}</p>;
}

export function FormMessage({
  message,
  ok
}: {
  message?: string;
  ok?: boolean;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        ok
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-red-300/25 bg-red-500/10 text-red-100"
      )}
    >
      {message}
    </div>
  );
}

export const inputClasses =
  "focus-ring w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60";

export const labelClasses = "font-mono text-[11px] font-bold uppercase text-on-surface-variant";
