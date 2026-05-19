import { Coffee } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <GlassCard className="flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <Coffee size={22} />
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-on-surface-variant">{description}</p>
    </GlassCard>
  );
}
