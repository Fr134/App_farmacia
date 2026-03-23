import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

export default function FinancialRoute({ children }: { children: ReactNode }) {
  const { isOperator } = useAuth();

  if (isOperator) {
    return <Navigate to="/tools/body-composition" replace />;
  }

  return <>{children}</>;
}
