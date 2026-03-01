import type {
  ApiResponse,
  ReportSummary,
  ReportWithSectors,
  UploadResult,
} from "@/types";

const BASE_URL = "/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${url}`, init);
  } catch {
    throw new Error("Impossibile connettersi al server");
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

export async function getReports(): Promise<ReportSummary[]> {
  return request<ReportSummary[]>("/reports");
}

export async function getLatestReport(): Promise<ReportWithSectors> {
  return request<ReportWithSectors>("/reports/latest");
}

export async function getReport(id: string): Promise<ReportWithSectors> {
  return request<ReportWithSectors>(`/reports/${id}`);
}

export async function uploadCsv(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  return request<UploadResult>("/upload", {
    method: "POST",
    body: formData,
  });
}

export async function deleteReport(id: string): Promise<void> {
  await request(`/reports/${id}`, { method: "DELETE" });
}
