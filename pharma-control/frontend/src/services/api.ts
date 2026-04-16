import type {
  ApiResponse,
  AlertResponse,
  ReportSummary,
  ReportWithSectors,
  UploadResult,
  ExpenseCategory,
  Expense,
  ExpenseSummary,
  QuarterlyVatData,
  Supplier,
  Budget,
  BudgetSummary,
  BudgetWithSummary,
  BudgetRevenueLine,
  BudgetExpenseLine,
  AdjustmentMode,
  RecurrenceType,
} from "@/types";

// Runtime API URL injection (see inject-config.sh)
declare global {
  interface Window {
    __API_URL__?: string;
  }
}

const BASE_URL = window.__API_URL__
  ? `${window.__API_URL__}/api`
  : "/api";

// Token stored in memory — set by AuthContext after login
let authToken: string | null = localStorage.getItem("token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> || {}),
  };

  // Attach token as Authorization header
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Impossibile connettersi al server");
  }

  // On 401, clear token and redirect to login
  if (res.status === 401) {
    setToken(null);
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Non autenticato");
  }

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Errore del server (HTTP ${res.status})`);
  }

  if (!json.success) {
    throw new Error(json.error ?? "Errore sconosciuto");
  }

  return json.data as T;
}

// Auth
export interface LoginResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string; pharmacyId: string; pharmacyName: string };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  // Store token for subsequent requests
  setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function getMe(): Promise<{ id: string; email: string; name: string; role: string; pharmacyId: string; pharmacyName: string }> {
  return request("/auth/me");
}

// Reports
export async function getReports(): Promise<ReportSummary[]> {
  return request<ReportSummary[]>("/reports");
}

export async function getLatestReport(): Promise<ReportWithSectors> {
  return request<ReportWithSectors>("/reports/latest");
}

export async function getReport(id: string): Promise<ReportWithSectors> {
  return request<ReportWithSectors>(`/reports/${id}`);
}

export async function getAggregateReport(
  from: string,
  to: string
): Promise<ReportWithSectors> {
  return request<ReportWithSectors>(
    `/reports/aggregate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export async function uploadCsv(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  // Don't set Content-Type — browser sets it with boundary for FormData
  return request<UploadResult>("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getAlerts(
  reportId: string,
  compareTo?: string
): Promise<AlertResponse> {
  const params = compareTo ? `?compare_to=${encodeURIComponent(compareTo)}` : "";
  return request<AlertResponse>(`/reports/${reportId}/alerts${params}`);
}

export async function getQuarterlyVat(month: number, year: number): Promise<QuarterlyVatData> {
  return request<QuarterlyVatData>(
    `/reports/quarterly-vat?month=${month}&year=${year}`
  );
}

export async function deleteReport(id: string): Promise<void> {
  await request(`/reports/${id}`, { method: "DELETE" });
}

// Users (admin)
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
}

export async function getUsers(): Promise<UserData[]> {
  return request<UserData[]>("/users");
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<UserData> {
  return request<UserData>("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; role?: string; password?: string }
): Promise<UserData> {
  return request<UserData>(`/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request(`/users/${id}`, { method: "DELETE" });
}

// Expense Categories
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const data = await request<{ categories: ExpenseCategory[] }>("/expense-categories");
  return data.categories;
}

// Expenses
export async function getExpenses(filters?: {
  categoryId?: string;
  recurrenceType?: string;
}): Promise<{ expenses: Expense[]; totalMonthlyNet: number; totalMonthlyGross: number }> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.recurrenceType) params.set("recurrenceType", filters.recurrenceType);
  return request(`/expenses?${params.toString()}`);
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  return request("/expenses/summary");
}

export async function createExpense(data: {
  name: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  amountNet: number;
  vatRate: number;
  isVatDeductible: boolean;
  recurrenceType: string;
  isFixedCost: boolean;
  validFrom: string;
  validTo?: string;
  notes?: string;
}): Promise<{ expense: Expense }> {
  return request("/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateExpense(
  id: string,
  data: Record<string, unknown>
): Promise<{ expense: Expense }> {
  return request(`/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await request(`/expenses/${id}`, { method: "DELETE" });
}

// Suppliers
export async function getSuppliers(): Promise<Supplier[]> {
  const data = await request<{ suppliers: Supplier[] }>("/suppliers");
  return data.suppliers;
}

export async function createSupplier(data: {
  ragioneSociale: string;
  piva?: string;
  codiceFiscale?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<{ supplier: Supplier }> {
  return request("/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Budgets
export async function getBudgets(): Promise<{ budgets: BudgetWithSummary[] }> {
  return request("/budgets");
}

export async function getBudget(id: string): Promise<{ budget: Budget; summary: BudgetSummary }> {
  return request(`/budgets/${id}`);
}

export async function getBudgetSummary(id: string): Promise<{ summary: BudgetSummary }> {
  return request(`/budgets/${id}/summary`);
}

export async function createBudget(data: {
  name: string;
  year: number;
  baselineSource: string;
  baselineYear?: number;
  globalAdjustmentPct?: number;
  notes?: string;
}): Promise<{ budget: Budget; summary: BudgetSummary }> {
  return request("/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateBudget(
  id: string,
  data: Record<string, unknown>
): Promise<{ budget: Budget; summary: BudgetSummary }> {
  return request(`/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  await request(`/budgets/${id}`, { method: "DELETE" });
}

export async function updateRevenueLines(
  budgetId: string,
  data: {
    globalAdjustmentPct?: number | null;
    lines?: Array<{
      id: string;
      adjustmentMode: AdjustmentMode;
      adjustmentPct?: number;
      adjustmentAbsolute?: number;
    }>;
  }
): Promise<{ revenueLines: BudgetRevenueLine[]; summary: BudgetSummary }> {
  return request(`/budgets/${budgetId}/revenue-lines`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createBudgetExpenseLine(
  budgetId: string,
  data: {
    name: string;
    categoryLabel: string;
    amountNet: number;
    vatRate: number;
    recurrenceType: RecurrenceType;
    notes?: string;
  }
): Promise<{ expenseLine: BudgetExpenseLine; summary: BudgetSummary }> {
  return request(`/budgets/${budgetId}/expense-lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateBudgetExpenseLine(
  budgetId: string,
  lineId: string,
  data: Record<string, unknown>
): Promise<{ expenseLine: BudgetExpenseLine; summary: BudgetSummary }> {
  return request(`/budgets/${budgetId}/expense-lines/${lineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteBudgetExpenseLine(
  budgetId: string,
  lineId: string
): Promise<{ summary: BudgetSummary }> {
  return request(`/budgets/${budgetId}/expense-lines/${lineId}`, {
    method: "DELETE",
  });
}

// ── SIVAT-D Assessments ──

export interface SivatAssessmentData {
  id: string;
  userId: string;
  userName?: string;
  patientName: string;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  scoreD: number;
  scoreE: number | null;
  sectionEEnabled: boolean;
  supportLevel: number | null;
  totalScore: number;
  rawScore: number;
  maxPossible: number;
  classification: string;
  pdcPercentage: number | null;
  pdcDaysCovered: number | null;
  pdcDaysObserved: number | null;
  answers: Record<string, number | string | boolean | Record<string, string | number | boolean | null> | null>;
  criticalities: string[];
  interventions: string[];
  createdAt: string;
}

export interface SivatDashboardData {
  totalAssessments: number;
  averageScore: number;
  classificationDistribution: Record<string, number>;
  sectionAverages: { a: number; b: number; c: number; d: number; e: number | null };
  monthlyTrend: Array<{ month: string; count: number; avgScore: number }>;
  supportLevelDistribution: Record<number, number>;
  topCriticalities: Array<{ text: string; count: number }>;
  topInterventions: Array<{ text: string; count: number }>;
  sectionEUsageRate: number;
}

export async function createSivatAssessment(data: Omit<SivatAssessmentData, "id" | "userId" | "userName" | "createdAt">): Promise<{ assessment: SivatAssessmentData }> {
  return request("/sivat/assessments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getSivatAssessments(params?: {
  patientName?: string;
  classification?: string;
  page?: number;
}): Promise<{ assessments: SivatAssessmentData[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.patientName) sp.set("patientName", params.patientName);
  if (params?.classification) sp.set("classification", params.classification);
  if (params?.page) sp.set("page", String(params.page));
  return request(`/sivat/assessments?${sp.toString()}`);
}

export async function getSivatAssessment(id: string): Promise<{ assessment: SivatAssessmentData }> {
  return request(`/sivat/assessments/${id}`);
}

export async function deleteSivatAssessment(id: string): Promise<void> {
  await request(`/sivat/assessments/${id}`, { method: "DELETE" });
}

export async function getSivatDashboard(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<SivatDashboardData> {
  const sp = new URLSearchParams();
  if (params?.dateFrom) sp.set("dateFrom", params.dateFrom);
  if (params?.dateTo) sp.set("dateTo", params.dateTo);
  return request(`/sivat/dashboard?${sp.toString()}`);
}

export async function getSivatPatientHistory(patientName: string): Promise<{ assessments: SivatAssessmentData[] }> {
  return request(`/sivat/patients/${encodeURIComponent(patientName)}`);
}

// ── Pharmacies ──

export interface PharmacyData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  userCount?: number;
}

export async function getPharmacies(): Promise<{ pharmacies: PharmacyData[] }> {
  return request("/pharmacies");
}

export async function createPharmacy(data: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}): Promise<{ pharmacy: PharmacyData }> {
  return request("/pharmacies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updatePharmacy(
  id: string,
  data: { name?: string; address?: string; phone?: string; email?: string }
): Promise<{ pharmacy: PharmacyData }> {
  return request(`/pharmacies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deletePharmacy(id: string): Promise<void> {
  await request(`/pharmacies/${id}`, { method: "DELETE" });
}
