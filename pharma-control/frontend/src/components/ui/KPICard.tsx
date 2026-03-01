import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatChange } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor: string;
  change?: number | null;
}

export default function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  change,
}: KPICardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary"
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
          <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted">
            {label}
          </span>
        </div>

        <p className="font-mono text-[28px] font-bold leading-tight text-text-primary">
          {value}
        </p>

        {subtitle && (
          <p className="mt-1.5 text-[12px] text-text-dim">{subtitle}</p>
        )}

        {change != null && (
          <div
            className="mt-2 flex items-center gap-1"
            style={{
              color:
                change > 0
                  ? COLORS.accentGreen
                  : change < 0
                    ? COLORS.accentRed
                    : COLORS.textDim,
            }}
          >
            {change > 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : change < 0 ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : null}
            <span className="font-mono text-xs font-medium">
              {formatChange(change)} vs prec.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
