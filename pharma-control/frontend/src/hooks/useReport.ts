import { useState, useEffect, useCallback } from "react";
import { getLatestReport, getReport } from "@/services/api";
import type { ReportWithSectors } from "@/types";

export function useReport(reportId?: string | null) {
  const [report, setReport] = useState<ReportWithSectors | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEmpty(false);

    try {
      const data = reportId
        ? await getReport(reportId)
        : await getLatestReport();
      setReport(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore sconosciuto";
      if (
        message.includes("Nessun report") ||
        message.includes("non trovato")
      ) {
        setEmpty(true);
        setReport(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { report, loading, error, empty, refetch: fetchReport };
}
