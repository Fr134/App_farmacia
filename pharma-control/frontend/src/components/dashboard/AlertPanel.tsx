import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Alert, AlertSummary, AlertSeverity } from "@/types";

interface AlertPanelProps {
  alerts: Alert[];
  summary: AlertSummary;
  loading: boolean;
  onSectorClick?: (sector: string) => void;
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    color: string;
    icon: typeof AlertTriangle;
    label: string;
    glowClass: string;
  }
> = {
  critical: {
    color: COLORS.accentRed,
    icon: AlertTriangle,
    label: "Critici",
    glowClass: "shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse-slow",
  },
  warning: {
    color: COLORS.accentAmber,
    icon: AlertCircle,
    label: "Attenzione",
    glowClass: "",
  },
  info: {
    color: COLORS.accentBlue,
    icon: Info,
    label: "Info",
    glowClass: "",
  },
  positive: {
    color: COLORS.accentGreen,
    icon: CheckCircle,
    label: "Positivi",
    glowClass: "shadow-[0_0_8px_rgba(16,185,129,0.2)]",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  margin: "Margine",
  revenue: "Ricavi",
  cost: "Costi",
  volume: "Volume",
  channel: "Canali",
  concentration: "Concentrazione",
  anomaly: "Anomalia",
};

function indicatorColor(summary: AlertSummary): string {
  if (summary.critical > 0) return COLORS.accentRed;
  if (summary.warning > 0) return COLORS.accentAmber;
  return COLORS.accentGreen;
}

function formatMetricValue(alert: Alert): string {
  const v = alert.currentValue;
  if (alert.metric.includes("pct") || alert.metric.includes("margin") || alert.metric.includes("ricarico")) {
    return formatPercent(v);
  }
  if (alert.metric.includes("revenue") || alert.metric.includes("cost") || alert.metric.includes("ticket")) {
    return formatCurrency(v);
  }
  return String(v);
}

export default function AlertPanel({
  alerts,
  summary,
  loading,
  onSectorClick,
}: AlertPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(null);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-3 w-3 rounded-full bg-text-dim animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/[0.05] animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-btn bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary p-5">
        <div className="flex items-center justify-center gap-3 py-4">
          <CheckCircle className="h-5 w-5" style={{ color: COLORS.accentGreen }} />
          <span className="text-sm text-text-muted">
            Tutto nella norma! Nessuna anomalia rilevata.
          </span>
        </div>
      </div>
    );
  }

  const filteredAlerts = severityFilter
    ? alerts.filter((a) => a.severity === severityFilter)
    : alerts;

  const visibleAlerts = expanded ? filteredAlerts : filteredAlerts.slice(0, 4);
  const hasMore = filteredAlerts.length > 4;

  const summaryEntries: { severity: AlertSeverity; count: number }[] = [
    { severity: "critical", count: summary.critical },
    { severity: "warning", count: summary.warning },
    { severity: "info", count: summary.info },
    { severity: "positive", count: summary.positive },
  ];

  return (
    <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-2.5 w-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: indicatorColor(summary) }}
          />
          <h3 className="text-sm font-semibold text-text-primary">
            Insights & Alert
          </h3>
          <span className="text-xs text-text-dim">
            ({alerts.length})
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-text-dim" />
        ) : (
          <ChevronUp className="h-4 w-4 text-text-dim" />
        )}
      </button>

      {/* Summary bar — always visible */}
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3">
        {summaryEntries.map(({ severity, count }) => {
          const cfg = SEVERITY_CONFIG[severity];
          const isActive = severityFilter === severity;
          return (
            <button
              key={severity}
              onClick={() =>
                setSeverityFilter(isActive ? null : severity)
              }
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "ring-1 ring-white/20 bg-white/[0.08]"
                  : "bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
              style={{ color: cfg.color }}
            >
              <cfg.icon className="h-3 w-3" />
              <span>{count}</span>
              <span className="text-text-dim">{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Alert cards */}
      {!collapsed && (
        <div className="space-y-2 px-5 pb-5">
          {visibleAlerts.map((alert, index) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              index={index}
              onSectorClick={onSectorClick}
            />
          ))}

          {/* Show all / Show less */}
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full rounded-btn bg-white/[0.03] py-2 text-xs font-medium text-text-muted hover:bg-white/[0.06] hover:text-text-primary transition-colors"
            >
              {expanded
                ? "Mostra meno"
                : `Mostra tutti (${filteredAlerts.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Alert Card ──────────────────────────────────────────── */

function AlertCard({
  alert,
  index,
  onSectorClick,
}: {
  alert: Alert;
  index: number;
  onSectorClick?: (sector: string) => void;
}) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-btn border border-border-card bg-white/[0.02] overflow-hidden transition-all ${cfg.glowClass}`}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: cfg.color,
        animationDelay: `${index * 50}ms`,
        animation: `alertSlideUp 0.3s ease-out ${index * 50}ms both`,
      }}
    >
      <div className="px-4 py-3">
        {/* Top row: icon + title + category */}
        <div className="flex items-start gap-2 mb-1.5">
          <Icon
            className="h-4 w-4 mt-0.5 flex-shrink-0"
            style={{ color: cfg.color }}
          />
          <span className="flex-1 text-sm font-semibold text-text-primary">
            {alert.title}
          </span>
          <span
            className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${cfg.color}15`,
              color: cfg.color,
            }}
          >
            {CATEGORY_LABELS[alert.category] ?? alert.category}
          </span>
        </div>

        {/* Message */}
        <p className="text-[13px] leading-relaxed text-text-muted ml-6">
          {alert.message}
        </p>

        {/* Bottom row: sector + metric + delta */}
        <div className="mt-2 ml-6 flex flex-wrap items-center gap-3">
          {alert.sector && (
            <button
              onClick={() => onSectorClick?.(alert.sector!)}
              className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
            >
              {alert.sector}
            </button>
          )}
          <span className="font-mono text-[11px] text-text-dim">
            {formatMetricValue(alert)}
          </span>
          {alert.delta != null && (
            <span
              className="font-mono text-[11px] font-medium"
              style={{
                color:
                  alert.delta > 0
                    ? COLORS.accentGreen
                    : alert.delta < 0
                      ? COLORS.accentRed
                      : COLORS.textDim,
              }}
            >
              {alert.delta > 0 ? "+" : ""}
              {formatPercent(alert.delta)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
