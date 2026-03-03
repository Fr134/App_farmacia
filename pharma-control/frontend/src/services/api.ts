import type {
  ApiResponse,
  AlertResponse,
  ReportSummary,
  ReportWithSectors,
  UploadResult,
} from "@/types";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, {
      ...init,
      credentials: "include",
    });
  } catch {
    throw new Error("Impossibile connettersi al server");
  }

  // On 401, redirect to login
  if (res.status === 401) {
    // Only redirect if we're not already on the login page
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
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
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
