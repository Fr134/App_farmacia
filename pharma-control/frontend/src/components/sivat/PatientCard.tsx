import { useEffect, useState } from "react";
import { User, UserPlus, Users, Search, Loader2, CheckCircle2, X } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import { getSivatPatients, type SivatPatientData } from "@/services/api";

export type PatientMode = "new" | "existing";

export interface PatientFormValue {
  fullName: string;
  birthDate: string; // YYYY-MM-DD or ""
  phone: string;
  fiscalCode: string;
  notes: string;
}

export const EMPTY_PATIENT_FORM: PatientFormValue = {
  fullName: "",
  birthDate: "",
  phone: "",
  fiscalCode: "",
  notes: "",
};

export function computeAge(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age >= 0 && age < 130 ? age : null;
}

function formatDateIt(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface PatientCardProps {
  mode: PatientMode;
  onModeChange: (mode: PatientMode) => void;
  value: PatientFormValue;
  onChange: (value: PatientFormValue) => void;
  selectedPatientId: string | null;
  onSelectPatient: (patient: SivatPatientData) => void;
  onClearSelection: () => void;
  loadingPrefill: boolean;
  prefilledFrom: string | null; // ISO date of the assessment used for prefill
}

const inputClass =
  "w-full rounded-btn border border-border-card bg-white/[0.03] px-4 py-3 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors";

export default function PatientCard({
  mode,
  onModeChange,
  value,
  onChange,
  selectedPatientId,
  onSelectPatient,
  onClearSelection,
  loadingPrefill,
  prefilledFrom,
}: PatientCardProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SivatPatientData[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced search of registered patients
  useEffect(() => {
    if (mode !== "existing" || selectedPatientId) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const { patients } = await getSivatPatients(search.trim() || undefined);
        if (!cancelled) setResults(patients);
      } catch (err) {
        if (!cancelled) setSearchError(err instanceof Error ? err.message : "Errore nella ricerca clienti");
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, mode, selectedPatientId]);

  const set = (field: keyof PatientFormValue) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [field]: e.target.value });

  const age = computeAge(value.birthDate);
  const showForm = mode === "new" || selectedPatientId !== null;

  return (
    <SectionCard title="Paziente" subtitle="Anagrafica cliente">
      {/* Mode toggle */}
      <div className="flex flex-wrap gap-2 mb-5">
        {([
          { key: "new", label: "Nuovo cliente", Icon: UserPlus },
          { key: "existing", label: "Cliente registrato", Icon: Users },
        ] as const).map(({ key, label, Icon }) => {
          const active = mode === key;
          return (
            <button
              key={key}
              onClick={() => onModeChange(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium border transition-all ${
                active
                  ? "bg-accent-blue/15 border-accent-blue/50 text-accent-blue"
                  : "border-border-card bg-white/[0.02] text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Search registered patients */}
      {mode === "existing" && !selectedPatientId && (
        <div className="max-w-2xl">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome, codice fiscale o telefono"
              className={`${inputClass} pl-10`}
              autoFocus
            />
          </div>
          {searchError && <p className="text-xs text-accent-red mb-2">{searchError}</p>}
          {searching && results.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-text-dim py-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Ricerca in corso…
            </div>
          ) : results.length === 0 ? (
            <p className="text-xs text-text-dim py-3">
              {search.trim() ? "Nessun cliente trovato" : "Nessun cliente registrato"}
            </p>
          ) : (
            <ul className="divide-y divide-border-card/50 rounded-btn border border-border-card max-h-80 overflow-y-auto">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onSelectPatient(p)}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{p.fullName}</p>
                      <p className="text-xs text-text-dim truncate">
                        {[
                          p.birthDate ? `nato/a il ${formatDateIt(p.birthDate)}` : null,
                          p.fiscalCode,
                          p.phone,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Anagrafica incompleta"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-text-muted">
                        {p.assessmentCount} {p.assessmentCount === 1 ? "valutazione" : "valutazioni"}
                      </p>
                      {p.lastAssessmentAt && (
                        <p className="text-[11px] text-text-dim">Ultima: {formatDateIt(p.lastAssessmentAt)}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Selected patient banner */}
      {mode === "existing" && selectedPatientId && (
        <div className="flex items-center justify-between gap-3 rounded-btn bg-accent-blue/10 border border-accent-blue/30 px-4 py-3 mb-5 max-w-2xl">
          <div className="flex items-center gap-2 text-sm text-accent-blue min-w-0">
            {loadingPrefill ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">
              {loadingPrefill
                ? "Caricamento ultima valutazione…"
                : prefilledFrom
                  ? `Dati precompilati dalla valutazione del ${formatDateIt(prefilledFrom)} — modifica solo ciò che è cambiato`
                  : "Nessuna valutazione precedente: compila il questionario"}
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary shrink-0"
          >
            <X className="h-3.5 w-3.5" /> Cambia cliente
          </button>
        </div>
      )}

      {/* Registry form */}
      {showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="sm:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-text-muted">
              <User className="h-4 w-4 text-accent-blue" />
              Nome e Cognome
            </label>
            <input type="text" value={value.fullName} onChange={set("fullName")} placeholder="es. Mario Rossi" className={inputClass} />
          </div>
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-text-muted">
              Data di nascita
              {age !== null && <span className="text-xs font-mono text-text-dim">{age} anni</span>}
            </label>
            <input type="date" value={value.birthDate} onChange={set("birthDate")} className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">Telefono</label>
            <input type="tel" value={value.phone} onChange={set("phone")} placeholder="es. 333 1234567" className={`${inputClass} font-mono`} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-text-muted">Codice fiscale</label>
            <input
              type="text"
              value={value.fiscalCode}
              onChange={(e) => onChange({ ...value, fiscalCode: e.target.value.toUpperCase() })}
              placeholder="es. RSSMRA50A01H501U"
              maxLength={16}
              className={`${inputClass} font-mono uppercase`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-text-muted">Note</label>
            <textarea
              value={value.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="es. medico curante, allergie, caregiver…"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
