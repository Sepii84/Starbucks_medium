import { GlassCard } from "@/components/ui/GlassCard";

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <GlassCard className="h-24 animate-pulse p-5" />
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="h-32 animate-pulse" />
        <GlassCard className="h-32 animate-pulse" />
        <GlassCard className="h-32 animate-pulse" />
      </div>
    </div>
  );
}
