import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}

export default function SectionCard({
  title,
  subtitle,
  children,
  rightAction,
}: SectionCardProps) {
  return (
    <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[12px] text-text-dim">{subtitle}</p>
          )}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
