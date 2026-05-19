export function AppBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-on-surface">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-70">
        <div className="glow-field absolute animate-ambient" />
        <div className="glow-vignette absolute inset-0" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
