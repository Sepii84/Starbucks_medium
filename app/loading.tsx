import { AppBackground } from "@/components/layout/AppBackground";
import { GlassCard } from "@/components/ui/GlassCard";

export default function Loading() {
  return (
    <AppBackground>
      <div className="flex min-h-screen items-center justify-center px-5">
        <GlassCard className="p-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-primary/40 shadow-glow" />
          <p className="font-mono text-[11px] font-bold uppercase text-primary">
            Brewing interface
          </p>
        </GlassCard>
      </div>
    </AppBackground>
  );
}
