import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface DropzoneProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Dropzone({ onUpload, uploading }: DropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function handleUploadClick() {
    if (file && !uploading) {
      onUpload(file);
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed transition-colors ${
          dragOver
            ? "border-accent-blue bg-accent-blue/[0.05]"
            : "border-border-card bg-white/[0.01] hover:border-text-dim"
        }`}
      >
        <Upload
          className={`h-10 w-10 ${
            dragOver ? "text-accent-blue" : "text-text-dim"
          }`}
        />
        <div className="text-center">
          <p className="text-sm text-text-muted">
            Trascina qui il file CSV oppure{" "}
            <span className="text-accent-blue">clicca per selezionare</span>
          </p>
          <p className="mt-1 text-xs text-text-dim">
            File .csv esportato dal gestionale, max 5MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Selected file + upload button */}
      {file && (
        <div className="flex items-center justify-between rounded-btn border border-border-card bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 flex-shrink-0 text-accent-blue" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {file.name}
              </p>
              <p className="text-xs text-text-dim">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>

          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="flex items-center gap-2 rounded-btn bg-accent-blue px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento...
              </>
            ) : (
              "Carica"
            )}
          </button>
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
          <div className="h-full animate-pulse rounded-full bg-accent-blue" style={{ width: "70%" }} />
        </div>
      )}
    </div>
  );
}
