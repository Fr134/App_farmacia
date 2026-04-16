import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Search,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSivatAssessments,
  deleteSivatAssessment,
  type SivatAssessmentData,
} from "@/services/api";
import { generateSivatPdf } from "@/lib/sivatPdf";
import { getScoreClass } from "@/lib/sivatData";

const CLASSIFICATIONS = [
  { value: "", label: "Tutte" },
  { value: "ALTA", label: "Alta" },
  { value: "BUONA", label: "Buona" },
  { value: "PARZIALE", label: "Parziale" },
  { value: "NON_ADERENZA", label: "Non aderenza" },
];

const CLASS_COLORS: Record<string, string> = {
  ALTA: "accent-green",
  BUONA: "accent-blue",
  PARZIALE: "accent-amber",
  NON_ADERENZA: "accent-red",
};

export default function SivatHistoryPage() {
  const { isAdmin } = useAuth();
  const [assessments, setAssessments] = useState<SivatAssessmentData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSivatAssessments({
        patientName: searchName || undefined,
        classification: filterClass || undefined,
        page,
      });
      setAssessments(result.assessments);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, [searchName, filterClass, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchName(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterClass = (value: string) => {
    setFilterClass(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa valutazione?")) return;
    setDeleting(id);
    try {
      await deleteSivatAssessment(id);
      fetchData();
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPdf = (a: SivatAssessmentData) => {
    // Extract extra data from answers JSON if present (new format stores them there)
    const raw = a.answers as Record<string, unknown>;
    generateSivatPdf({
      patientName: a.patientName,
      patientAge: raw._patientAge ? String(raw._patientAge) : "",
      answers: a.answers as Record<string, number | null>,
      sectionScores: {
        a: a.scoreA,
        b: a.scoreB,
        c: a.scoreC,
        d: a.scoreD,
        e: a.scoreE,
      },
      sectionEEnabled: a.sectionEEnabled,
      supportLevel: a.supportLevel,
      totalScore: a.totalScore,
      criticalities: a.criticalities,
      interventions: a.interventions,
      preliminaryAnswers: (raw._preliminary as Record<string, string>) ?? {},
      drugAnswers: (raw._drugAnswers as Record<string, string>) ?? {},
      drugSectionEnabled: (raw._drugSectionsEnabled as Record<string, boolean>) ?? {},
      pdcPercentage: a.pdcPercentage,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-blue/10">
            <ClipboardCheck className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Storico Valutazioni SIVAT-D
            </h1>
            <p className="text-sm text-text-dim">
              {total} valutazion{total === 1 ? "e" : "i"} registrat{total === 1 ? "a" : "e"}
            </p>
          </div>
        </div>
        <Link
          to="/tools/sivat"
          className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accent-blue/90 transition-colors"
        >
          Nuova Valutazione
        </Link>
      </div>

      {/* Filters */}
      <SectionCard>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cerca paziente..."
              className="w-full rounded-btn border border-border-card bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
            />
          </div>
          <div className="flex gap-1.5">
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleFilterClass(c.value)}
                className={`px-3 py-2 rounded-btn text-xs font-medium border transition-all ${
                  filterClass === c.value
                    ? `bg-accent-blue/15 border-accent-blue/50 text-accent-blue`
                    : "border-border-card text-text-muted hover:bg-white/[0.05]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-accent-red text-sm">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-20 text-text-dim text-sm">
          Nessuna valutazione trovata
        </div>
      ) : (
        <div className="rounded-card border border-border-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-card bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Paziente</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Punteggio</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Classe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Operatore</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">A</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">B</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">C</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">D</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">E</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const sc = getScoreClass(a.totalScore);
                  const color = CLASS_COLORS[a.classification] ?? "accent-blue";
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border-card/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-text-primary font-medium">
                        {a.patientName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold font-mono text-${color}`}>
                          {a.totalScore}
                        </span>
                        <span className="text-text-dim">/100</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-${color}/15 text-${color}`}>
                          {sc.label.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {a.userName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-text-muted">{a.scoreA}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-text-muted">{a.scoreB}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-text-muted">{a.scoreC}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-text-muted">{a.scoreD}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-text-muted">{a.scoreE ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownloadPdf(a)}
                            className="p-1.5 rounded-btn text-text-dim hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                            title="Scarica PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(a.id)}
                              disabled={deleting === a.id}
                              className="p-1.5 rounded-btn text-text-dim hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                              title="Elimina"
                            >
                              {deleting === a.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border-card">
              <span className="text-xs text-text-dim">
                Pagina {page} di {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-btn text-text-muted hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-btn text-text-muted hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-[11px] text-text-dim/60 pb-4">
        PharmaControl · Strumenti · SIVAT-D
      </p>
    </div>
  );
}
