import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatPercent } from "@/lib/formatters";
import { COLORS } from "@/lib/constants";
import { useCountUp } from "@/hooks/useCountUp";

interface KPICardWithDeltaProps {
  label: string;
  value: string;
  rawValue?: number;
  formatFn?: (n: number) => string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor: string;
  previousValue?: string | null;
  delta?: number | null;
}

export default function KPICardWithDelta({
  label,
  value,
  rawValue,
  formatFn,
  subtitle,
  icon: Icon,
  accentColor,
  previousValue,
  delta,
}: KPICardWithDeltaProps) {
  const hasDelta = delta != null && previousValue != null;
  const animated = useCountUp(rawValue ?? 0);
  const displayValue = rawValue != null && formatFn ? formatFn(animated) : value;

  return (
    <div className="relative overflow-hidden rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
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
          {displayValue}
        </p>

        {subtitle && (
          <p className="mt-1.5 text-[12px] text-text-dim">{subtitle}</p>
        )}

        {hasDelta && (
          <div className="mt-2 space-y-0.5">
            {/* Delta row */}
            <div
              className="flex items-center gap-1"
              style={{
                color:
                  delta > 0
                    ? COLORS.accentGreen
                    : delta < 0
                      ? COLORS.accentRed
                      : COLORS.textDim,
              }}
            >
              {delta > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : delta < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              <span className="font-mono text-xs font-medium">
                {delta > 0 ? "\u2191" : delta < 0 ? "\u2193" : "\u2014"}{" "}
                {formatPercent(Math.abs(delta))}
              </span>
            </div>
            {/* Previous value */}
            <p className="text-[11px] text-text-dim">
              vs {previousValue}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
