export default function KPICardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/[0.06]" />
      <div className="p-5 space-y-3">
        {/* Label row */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
        </div>
        {/* Value */}
        <div className="h-8 w-36 rounded bg-white/[0.06] animate-pulse" />
        {/* Subtitle */}
        <div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}
