"use client";

import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor: string;
}

export default function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentColor,
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
      </div>
    </div>
  );
}
