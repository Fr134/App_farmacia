import type {
  ApiResponse,
  AlertResponse,
  ReportSummary,
  ReportWithSectors,
  UploadResult,
  ExpenseCategory,
  Expense,
  ExpenseSummary,
  Supplier,
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
  user: { id: string; email: string; name: string; role: string };
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

export async function getMe(): Promise<{ id: string; email: string; name: string; role: string }> {
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

// Pharmacy ID — single-pharmacy setup
const PHARMACY_ID = "default";

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
  const params = new URLSearchParams({ pharmacyId: PHARMACY_ID });
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.recurrenceType) params.set("recurrenceType", filters.recurrenceType);
  return request(`/expenses?${params.toString()}`);
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  return request(`/expenses/summary?pharmacyId=${PHARMACY_ID}`);
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
    body: JSON.stringify({ ...data, pharmacyId: PHARMACY_ID }),
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
  const data = await request<{ suppliers: Supplier[] }>(
    `/suppliers?pharmacyId=${PHARMACY_ID}`
  );
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
    body: JSON.stringify({ ...data, pharmacyId: PHARMACY_ID }),
  });
}
