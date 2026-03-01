interface StatMiniProps {
  label: string;
  value: string;
  color?: string;
}

export default function StatMini({
  label,
  value,
  color,
}: StatMiniProps) {
  return (
    <div className="rounded-btn bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-dim">
        {label}
      </p>
      <p
        className="mt-0.5 font-mono text-[13px] font-semibold"
        style={{ color: color ?? "#F1F5F9" }}
      >
        {value}
      </p>
    </div>
  );
}
