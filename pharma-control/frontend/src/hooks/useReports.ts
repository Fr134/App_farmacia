import { useState, useEffect, useCallback } from "react";
import { getReports } from "@/services/api";
import type { ReportSummary } from "@/types";

export function useReports() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore sconosciuto";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refetch: fetchReports };
}
