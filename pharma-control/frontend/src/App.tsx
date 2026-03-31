import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import FinancialRoute from "@/components/auth/FinancialRoute";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UploadPage from "@/pages/UploadPage";
import UsersPage from "@/pages/UsersPage";
import ExpensesPage from "@/pages/ExpensesPage";
import BudgetListPage from "@/pages/BudgetListPage";
import BudgetDetailPage from "@/pages/BudgetDetailPage";
import BodyCompositionPage from "@/pages/BodyCompositionPage";
import SivatPage from "@/pages/SivatPage";
import SivatHistoryPage from "@/pages/SivatHistoryPage";
import SivatDashboardPage from "@/pages/SivatDashboardPage";

function DefaultRedirect() {
  const { isOperator } = useAuth();
  return <Navigate to={isOperator ? "/tools/body-composition" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<FinancialRoute><DashboardPage /></FinancialRoute>} />
            <Route path="/expenses" element={<FinancialRoute><ExpensesPage /></FinancialRoute>} />
            <Route path="/budget" element={<FinancialRoute><BudgetListPage /></FinancialRoute>} />
            <Route path="/budget/:id" element={<FinancialRoute><BudgetDetailPage /></FinancialRoute>} />
            <Route path="/upload" element={<FinancialRoute><UploadPage /></FinancialRoute>} />
            <Route path="/tools/body-composition" element={<BodyCompositionPage />} />
            <Route path="/tools/sivat" element={<SivatPage />} />
            <Route path="/tools/sivat/history" element={<SivatHistoryPage />} />
            <Route path="/tools/sivat/dashboard" element={<FinancialRoute><SivatDashboardPage /></FinancialRoute>} />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route path="/" element={<DefaultRedirect />} />
            <Route path="*" element={<DefaultRedirect />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
