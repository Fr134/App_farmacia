import { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Area,
} from "recharts";
import SectionCard from "@/components/ui/SectionCard";
import KPICard from "@/components/ui/KPICard";
import { COLORS } from "@/lib/constants";
import {
  getSivatDashboard,
  getSivatPatientHistory,
  type SivatDashboardData,
  type SivatAssessmentData,
} from "@/services/api";
import { getScoreClass } from "@/lib/sivatData";

const CLASS_COLORS: Record<string, string> = {
  ALTA: "#10B981",
  BUONA: "#3B82F6",
  PARZIALE: "#F59E0B",
  NON_ADERENZA: "#EF4444",
};

const CLASS_LABELS: Record<string, string> = {
  ALTA: "Alta",
  BUONA: "Buona",
  PARZIALE: "Parziale",
  NON_ADERENZA: "Non aderenza",
};

const SECTION_BAR_COLORS: Record<string, string> = {
  A: "#3B82F6",
  B: "#10B981",
  C: "#F59E0B",
  D: "#8B5CF6",
  E: "#EF4444",
};

const SUPPORT_LABELS: Record<number, string> = {
  0: "Nessuno",
  1: "Base",
  2: "Caregiver",
  3: "Deblistering",
};

const MONTHS_IT: Record<string, string> = {
  "01": "Gen", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mag", "06": "Giu",
  "07": "Lug", "08": "Ago", "09": "Set", "10": "Ott", "11": "Nov", "12": "Dic",
};

function formatMonth(yyyymm: string): string {
  const [year, month] = yyyymm.split("-");
  return `${MONTHS_IT[month] ?? month} ${year.slice(2)}`;
}

export default function SivatDashboardPage() {
  const [data, setData] = useState<SivatDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientHistory, setPatientHistory] = useState<SivatAssessmentData[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSivatDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Debounced patient search
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatientHistory([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const result = await getSivatPatientHistory(patientSearch.trim());
        setPatientHistory(result.assessments);
      } catch {
        setPatientHistory([]);
      } finally {
        setPatientLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-2 text-accent-red">
        <AlertTriangle className="h-6 w-6" />
        <p className="text-sm">{error ?? "Nessun dato"}</p>
      </div>
    );
  }

  // Prepare chart data
  const classDistData = Object.entries(CLASS_LABELS).map(([key, label]) => ({
    name: label,
    value: data.classificationDistribution[key] ?? 0,
    color: CLASS_COLORS[key],
  }));

  const trendData = data.monthlyTrend.map((t) => ({
    month: formatMonth(t.month),
    count: t.count,
    avgScore: t.avgScore,
  }));

  const sectionData = [
    { section: "A", avg: data.sectionAverages.a, max: 20, pct: Math.round((data.sectionAverages.a / 20) * 100) },
    { section: "B", avg: data.sectionAverages.b, max: 25, pct: Math.round((data.sectionAverages.b / 25) * 100) },
    { section: "C", avg: data.sectionAverages.c, max: 15, pct: Math.round((data.sectionAverages.c / 15) * 100) },
    { section: "D", avg: data.sectionAverages.d, max: 15, pct: Math.round((data.sectionAverages.d / 15) * 100) },
    ...(data.sectionAverages.e !== null
      ? [{ section: "E", avg: data.sectionAverages.e, max: 15, pct: Math.round((data.sectionAverages.e / 15) * 100) }]
      : []),
  ];

  const supportData = [0, 1, 2, 3].map((level) => ({
    level: SUPPORT_LABELS[level],
    count: data.supportLevelDistribution[level] ?? 0,
  }));

  const totalAssessments = data.totalAssessments;
  const pctAlta = totalAssessments > 0
    ? Math.round(((data.classificationDistribution["ALTA"] ?? 0) / totalAssessments) * 100)
    : 0;
  const pctNonAd = totalAssessments > 0
    ? Math.round(((data.classificationDistribution["NON_ADERENZA"] ?? 0) / totalAssessments) * 100)
    : 0;
  const avgScoreClass = getScoreClass(Math.round(data.averageScore));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-blue/10">
          <ClipboardCheck className="h-5 w-5 text-accent-blue" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Analytics SIVAT-D
          </h1>
          <p className="text-sm text-text-dim">
            Dashboard aderenza terapeutica
          </p>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Valutazioni totali"
          value={String(totalAssessments)}
          icon={ClipboardCheck}
          accentColor={COLORS.accentBlue}
        />
        <KPICard
          label="Punteggio medio"
          value={data.averageScore.toFixed(1).replace(".", ",")}
          subtitle={avgScoreClass.label}
          icon={TrendingUp}
          accentColor={CLASS_COLORS[avgScoreClass.classKey] ?? COLORS.accentBlue}
        />
        <KPICard
          label="Aderenza alta"
          value={`${pctAlta}%`}
          subtitle={`${data.classificationDistribution["ALTA"] ?? 0} valutazioni`}
          icon={CheckCircle2}
          accentColor={COLORS.accentGreen}
        />
        <KPICard
          label="Non aderenza"
          value={`${pctNonAd}%`}
          subtitle={`${data.classificationDistribution["NON_ADERENZA"] ?? 0} valutazioni`}
          icon={XCircle}
          accentColor={COLORS.accentRed}
        />
      </div>

      {/* Row 2: Distribution + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <SectionCard title="Distribuzione Classificazioni">
          {totalAssessments > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={classDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {classDistData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#F1F5F9" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {classDistData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-text-muted">{d.name}</span>
                    <span className="text-xs font-bold font-mono text-text-primary ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-text-dim text-sm py-10">Nessun dato</p>
          )}
        </SectionCard>

        {/* Monthly Trend */}
        <SectionCard title="Trend Mensile">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
                />
                <Bar yAxisId="left" dataKey="count" name="Valutazioni" fill="#3B82F6" opacity={0.6} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" dataKey="avgScore" name="Punteggio medio" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-text-dim text-sm py-10">Nessun dato</p>
          )}
        </SectionCard>
      </div>

      {/* Row 3: Section Averages */}
      <SectionCard title="Punteggi Medi per Sezione">
        <ResponsiveContainer width="100%" height={sectionData.length * 50 + 20}>
          <BarChart data={sectionData} layout="vertical" margin={{ left: 10, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="section" tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 600 }} width={30} />
            <Tooltip
              contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`${value}%`, "Media"]}
            />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
              {sectionData.map((entry) => (
                <Cell key={entry.section} fill={SECTION_BAR_COLORS[entry.section] ?? "#64748B"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Row 4: Support + Section E */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Distribuzione Supporto Organizzativo">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={supportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="level" tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Valutazioni" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Utilizzo Sezione E (Device)">
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-5xl font-bold font-mono text-accent-red">
              {data.sectionEUsageRate}%
            </p>
            <p className="text-sm text-text-muted mt-2">
              dei pazienti usa device tecnici
            </p>
            <div className="w-48 h-2 rounded-full bg-white/[0.06] mt-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-red"
                style={{ width: `${data.sectionEUsageRate}%` }}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Row 5: Top criticalities and interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Criticità più Frequenti">
          {data.topCriticalities.length > 0 ? (
            <div className="space-y-2">
              {data.topCriticalities.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border-card/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent-amber w-5">{i + 1}.</span>
                    <span className="text-xs text-text-primary">{c.text}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-accent-amber">{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-dim text-sm py-6">Nessun dato</p>
          )}
        </SectionCard>

        <SectionCard title="Interventi più Consigliati">
          {data.topInterventions.length > 0 ? (
            <div className="space-y-2">
              {data.topInterventions.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border-card/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent-green w-5">{i + 1}.</span>
                    <span className="text-xs text-text-primary">{c.text}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-accent-green">{c.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-dim text-sm py-6">Nessun dato</p>
          )}
        </SectionCard>
      </div>

      {/* Row 6: Patient Lookup */}
      <SectionCard title="Ricerca Paziente" subtitle="Storico valutazioni per paziente">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Cerca paziente..."
            className="w-full rounded-btn border border-border-card bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
          />
        </div>

        {patientLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-accent-blue" />
          </div>
        )}

        {!patientLoading && patientHistory.length > 0 && (
          <div className="space-y-3">
            {/* Sparkline-like score trend */}
            {patientHistory.length > 1 && (
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Trend punteggio</p>
                <ResponsiveContainer width="100%" height={80}>
                  <ComposedChart data={[...patientHistory].reverse()}>
                    <Area
                      type="monotone"
                      dataKey="totalScore"
                      fill="#3B82F6"
                      fillOpacity={0.1}
                      stroke="#3B82F6"
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, fontSize: 11 }}
                      formatter={(val: number) => [`${val}/100`, "Punteggio"]}
                      labelFormatter={(_, payload) => {
                        if (payload?.[0]?.payload?.createdAt) {
                          return new Date(payload[0].payload.createdAt).toLocaleDateString("it-IT");
                        }
                        return "";
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Assessment list */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-card">
                    <th className="text-left py-2 px-2 text-text-muted">Data</th>
                    <th className="text-center py-2 px-2 text-text-muted">Totale</th>
                    <th className="text-center py-2 px-2 text-text-muted">Classe</th>
                    <th className="text-center py-2 px-2 text-text-muted">A</th>
                    <th className="text-center py-2 px-2 text-text-muted">B</th>
                    <th className="text-center py-2 px-2 text-text-muted">C</th>
                    <th className="text-center py-2 px-2 text-text-muted">D</th>
                    <th className="text-center py-2 px-2 text-text-muted">E</th>
                    <th className="text-center py-2 px-2 text-text-muted">Supporto</th>
                  </tr>
                </thead>
                <tbody>
                  {patientHistory.map((a) => {
                    const sc = getScoreClass(a.totalScore);
                    const color = CLASS_COLORS[a.classification] ?? "#3B82F6";
                    return (
                      <tr key={a.id} className="border-b border-border-card/30">
                        <td className="py-2 px-2 text-text-muted">
                          {new Date(a.createdAt).toLocaleDateString("it-IT")}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold" style={{ color }}>
                          {a.totalScore}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold"
                            style={{ backgroundColor: color + "22", color }}
                          >
                            {sc.label.split(" ")[0]}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-text-muted">{a.scoreA}</td>
                        <td className="py-2 px-2 text-center font-mono text-text-muted">{a.scoreB}</td>
                        <td className="py-2 px-2 text-center font-mono text-text-muted">{a.scoreC}</td>
                        <td className="py-2 px-2 text-center font-mono text-text-muted">{a.scoreD}</td>
                        <td className="py-2 px-2 text-center font-mono text-text-muted">{a.scoreE ?? "—"}</td>
                        <td className="py-2 px-2 text-center font-mono text-text-muted">{a.supportLevel ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!patientLoading && patientSearch.trim() && patientHistory.length === 0 && (
          <p className="text-center text-text-dim text-sm py-6">Nessun risultato per "{patientSearch}"</p>
        )}
      </SectionCard>

      {/* Footer */}
      <p className="text-center text-[11px] text-text-dim/60 pb-4">
        PharmaControl · Strumenti · SIVAT-D Analytics
      </p>
    </div>
  );
}
