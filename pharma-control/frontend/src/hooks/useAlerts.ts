import { useState, useEffect, useCallback } from "react";
import { getAlerts } from "@/services/api";
import type { Alert, AlertSummary } from "@/types";

const EMPTY_SUMMARY: AlertSummary = { critical: 0, warning: 0, info: 0, positive: 0 };

export function useAlerts(reportId?: string | null, compareTo?: string | null) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!reportId) {
      setAlerts([]);
      setSummary(EMPTY_SUMMARY);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAlerts(reportId, compareTo ?? undefined);
      setAlerts(data.alerts);
      setSummary(data.summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore sconosciuto";
      setError(message);
      setAlerts([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [reportId, compareTo]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, summary, loading, error };
}
