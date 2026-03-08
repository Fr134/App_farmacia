import { useState, useEffect, useCallback } from "react";
import { getBudgets } from "@/services/api";
import type { BudgetWithSummary } from "@/types";

export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getBudgets();
      setBudgets(data.budgets);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return { budgets, loading, error, refetch: fetchBudgets };
}
