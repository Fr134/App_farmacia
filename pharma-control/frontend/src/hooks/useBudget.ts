import { useState, useEffect, useCallback } from "react";
import { getBudget } from "@/services/api";
import type { Budget, BudgetSummary } from "@/types";

export function useBudget(id: string | undefined) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getBudget(id);
      setBudget(data.budget);
      setSummary(data.summary);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return { budget, summary, loading, error, refetch: fetchBudget, setBudget, setSummary };
}
