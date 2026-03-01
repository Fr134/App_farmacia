import { Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { MESI_DISPLAY } from "@/lib/constants";
import type { UploadResult } from "@/types";

interface UploadResultSuccessProps {
  result: UploadResult;
}

interface UploadResultErrorProps {
  error: string;
  onRetry: () => void;
}

export function UploadSuccess({ result }: UploadResultSuccessProps) {
  const monthName = MESI_DISPLAY[result.period.month] ?? `${result.period.month}`;

  return (
    <div className="rounded-card border border-accent-green/30 bg-accent-green/[0.05] p-5">
      <div className="flex items-start gap-3">
        <CheckCircle className="h-6 w-6 flex-shrink-0 text-accent-green" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            Report caricato con successo!
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Periodo rilevato: {monthName} {result.period.year}
          </p>

          {result.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-amber" />
                  <p className="text-xs text-accent-amber">{w}</p>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-1 rounded-btn bg-accent-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-green/90"
          >
            Vai alla Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function UploadError({ error, onRetry }: UploadResultErrorProps) {
  return (
    <div className="rounded-card border border-accent-red/30 bg-accent-red/[0.05] p-5">
      <div className="flex items-start gap-3">
        <XCircle className="h-6 w-6 flex-shrink-0 text-accent-red" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            Errore nel caricamento
          </p>
          <p className="mt-1 text-xs text-accent-red">{error}</p>

          <button
            onClick={onRetry}
            className="mt-4 rounded-btn border border-border-card bg-white/[0.03] px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-white/[0.06]"
          >
            Riprova
          </button>
        </div>
      </div>
    </div>
  );
}
