export const COLORS = {
  bgPrimary: "#0B0F19",
  bgCard: "#111827",
  borderCard: "#1E293B",
  accentBlue: "#3B82F6",
  accentGreen: "#10B981",
  accentRed: "#EF4444",
  accentAmber: "#F59E0B",
  accentPurple: "#8B5CF6",
  accentCyan: "#06B6D4",
  textPrimary: "#F1F5F9",
  textMuted: "#94A3B8",
  textDim: "#64748B",
} as const;

export const CHART_COLORS = [
  COLORS.accentBlue,
  COLORS.accentGreen,
  COLORS.accentAmber,
  COLORS.accentPurple,
  COLORS.accentCyan,
  COLORS.accentRed,
] as const;

export const MESI_DISPLAY: Record<number, string> = {
  1: "Gennaio",
  2: "Febbraio",
  3: "Marzo",
  4: "Aprile",
  5: "Maggio",
  6: "Giugno",
  7: "Luglio",
  8: "Agosto",
  9: "Settembre",
  10: "Ottobre",
  11: "Novembre",
  12: "Dicembre",
};
