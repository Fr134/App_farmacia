import { useAuth } from "@/contexts/AuthContext";
import { useUpload } from "@/hooks/useUpload";
import Dropzone from "@/components/upload/Dropzone";
import { UploadSuccess, UploadError } from "@/components/upload/UploadResult";
import UploadHistory from "@/components/upload/UploadHistory";

export default function UploadPage() {
  const { isAdmin } = useAuth();
  const { status, result, error, upload, reset } = useUpload();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          {isAdmin ? "Carica Report Vendite" : "Report Vendite"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {isAdmin
            ? "Carica il file CSV esportato dal gestionale della farmacia. Il sistema estrarrà automaticamente periodo, settori e metriche."
            : "Visualizza i report vendite caricati."}
        </p>
      </div>

      {/* Dropzone — admin only */}
      {isAdmin && (status === "idle" || status === "uploading") && (
        <Dropzone onUpload={upload} uploading={status === "uploading"} />
      )}

      {/* Result — admin only */}
      {isAdmin && status === "success" && result && <UploadSuccess result={result} />}
      {isAdmin && status === "error" && error && (
        <UploadError error={error} onRetry={reset} />
      )}

      {/* Separator */}
      <div className="border-t border-border-card" />

      {/* Upload History */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          Report Caricati
        </h2>
        <UploadHistory showDelete={isAdmin} />
      </div>
    </div>
  );
}
