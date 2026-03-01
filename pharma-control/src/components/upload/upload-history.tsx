"use client";

import { useState } from "react";
import { Trash2, FileSpreadsheet } from "lucide-react";
import { useReports } from "@/hooks/use-reports";
import { deleteReport } from "@/lib/api";
import { MESI_DISPLAY } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function UploadHistory() {
  const { reports, loading, refetch } = useReports();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteReport(id);
      setConfirmId(null);
      refetch();
    } catch {
      // Error silently handled — report stays in list
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-text-dim">
        Caricamento...
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <FileSpreadsheet className="h-8 w-8 text-text-dim" />
        <p className="text-sm text-text-muted">Nessun report caricato</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const monthName = MESI_DISPLAY[r.periodMonth] ?? `${r.periodMonth}`;
        const isConfirming = confirmId === r.id;

        return (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-btn border border-border-card bg-white/[0.02] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {r.filename}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-dim">
                <span>
                  {monthName} {r.periodYear}
                </span>
                <span>{formatDate(r.uploadedAt)}</span>
                <span className="font-mono text-text-muted">
                  {formatCurrency(r.totalRevenueGross)}
                </span>
              </div>
            </div>

            {isConfirming ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-text-muted">
                  Eliminare {monthName} {r.periodYear}?
                </span>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deleting}
                  className="rounded-btn bg-accent-red px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-red/90 disabled:opacity-50"
                >
                  {deleting ? "..." : "Elimina"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="rounded-btn border border-border-card px-3 py-1 text-xs text-text-muted transition-colors hover:text-text-primary"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(r.id)}
                className="flex-shrink-0 rounded-btn p-2 text-text-dim transition-colors hover:bg-accent-red/10 hover:text-accent-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
