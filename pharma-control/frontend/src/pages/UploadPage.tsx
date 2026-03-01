import { useUpload } from "@/hooks/useUpload";
import Dropzone from "@/components/upload/Dropzone";
import { UploadSuccess, UploadError } from "@/components/upload/UploadResult";
import UploadHistory from "@/components/upload/UploadHistory";

export default function UploadPage() {
  const { status, result, error, upload, reset } = useUpload();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          Carica Report Vendite
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Carica il file CSV esportato dal gestionale della farmacia. Il sistema
          estrarrà automaticamente periodo, settori e metriche.
        </p>
      </div>

      {/* Dropzone */}
      {(status === "idle" || status === "uploading") && (
        <Dropzone onUpload={upload} uploading={status === "uploading"} />
      )}

      {/* Result */}
      {status === "success" && result && <UploadSuccess result={result} />}
      {status === "error" && error && (
        <UploadError error={error} onRetry={reset} />
      )}

      {/* Separator */}
      <div className="border-t border-border-card" />

      {/* Upload History */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          Report Caricati
        </h2>
        <UploadHistory />
      </div>
    </div>
  );
}
