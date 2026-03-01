"use client";

import { useState, useCallback } from "react";
import { uploadCsv } from "@/lib/api";
import type { UploadResult } from "@/types";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export function useUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setStatus("uploading");
    setError(null);
    setResult(null);

    try {
      const data = await uploadCsv(file);
      setResult(data);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante il caricamento";
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, upload, reset };
}
