interface Props {
  height?: number;
}

export default function ChartSkeleton({ height = 260 }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-btn bg-white/[0.02]"
      style={{ height }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
      {/* Faint bar outlines */}
      <div className="flex h-full items-end justify-around px-6 pb-4 gap-3">
        {[65, 80, 45, 90, 55].map((h, i) => (
          <div
            key={i}
            className="w-full max-w-[40px] rounded-t bg-white/[0.04] animate-pulse"
            style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
