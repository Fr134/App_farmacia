import { useState, useMemo } from "react";
import {
  Activity,
  User,
  Scale,
  Heart,
  Droplets,
  Bone,
  Dumbbell,
  Percent,
  Timer,
  Brain,
  Flame,
  Download,
  RotateCcw,
  Calculator,
  Printer,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import { generateBodyCompositionPdf } from "@/lib/bodyCompositionPdf";
import { generateBlankFormPdf } from "@/lib/bodyCompositionBlankPdf";

interface FormField {
  key: string;
  label: string;
  labelShort: string;
  icon: React.ElementType;
  unit: string;
  placeholder: string;
  type: "text" | "number";
  color: string;
}

const FORM_FIELDS: FormField[] = [
  { key: "nome", label: "Nome e Cognome", labelShort: "Nome", icon: User, unit: "", placeholder: "es. Mario Rossi", type: "text", color: "accent-blue" },
  { key: "peso", label: "Peso", labelShort: "Peso", icon: Scale, unit: "Kg", placeholder: "es. 55,2", type: "number", color: "accent-cyan" },
  { key: "pesoAbbigliamento", label: "Peso Abbigliamento", labelShort: "Peso Abb.", icon: Scale, unit: "Kg", placeholder: "es. 1", type: "number", color: "accent-cyan" },
  { key: "frequenzaCardiaca", label: "Frequenza Cardiaca", labelShort: "FC", icon: Heart, unit: "bpm", placeholder: "es. 81", type: "number", color: "accent-red" },
  { key: "grassoViscerale", label: "Grasso Viscerale", labelShort: "Grasso Visc.", icon: Activity, unit: "LV", placeholder: "es. 5,5", type: "number", color: "accent-amber" },
  { key: "massaOssea", label: "Massa Ossea", labelShort: "Massa Ossea", icon: Bone, unit: "Kg", placeholder: "es. 2,1", type: "number", color: "accent-purple" },
  { key: "massaMuscolare", label: "Massa Muscolare", labelShort: "Massa Musc.", icon: Dumbbell, unit: "Kg", placeholder: "es. 38,70", type: "number", color: "accent-green" },
  { key: "grassoCorporeo", label: "Grasso Corporeo", labelShort: "Grasso Corp.", icon: Percent, unit: "%", placeholder: "es. 26,2", type: "number", color: "accent-amber" },
  { key: "etaMetabolica", label: "Età Metabolica", labelShort: "Età Metab.", icon: Timer, unit: "", placeholder: "es. 35", type: "number", color: "accent-purple" },
  { key: "acquaCorporea", label: "Acqua Corporea", labelShort: "Acqua Corp.", icon: Droplets, unit: "%", placeholder: "es. 54,1", type: "number", color: "accent-blue" },
  { key: "qualitaMuscolare", label: "Punteggio Qualità Muscolare", labelShort: "Qualità Musc.", icon: Brain, unit: "Pt", placeholder: "es. 47", type: "number", color: "accent-green" },
  { key: "valutazioneFisico", label: "Valutazione del Fisico", labelShort: "Val. Fisico", icon: Activity, unit: "", placeholder: "es. 5", type: "number", color: "accent-cyan" },
  { key: "tassoMetabolico", label: "Tasso Metabolico Basale (BMR)", labelShort: "BMR", icon: Flame, unit: "Kcal", placeholder: "es. 1211", type: "number", color: "accent-red" },
  { key: "imc", label: "IMC / BMI", labelShort: "IMC", icon: Calculator, unit: "", placeholder: "es. 22,1", type: "number", color: "accent-amber" },
];

type FormData = Record<string, string>;

function parseItalianDecimal(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
}

function formatItalianDecimal(n: number, decimals = 2): string {
  return n.toFixed(decimals).replace(".", ",");
}

export default function BodyCompositionPage() {
  const [form, setForm] = useState<FormData>(() =>
    Object.fromEntries(FORM_FIELDS.map((f) => [f.key, ""]))
  );

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setForm(Object.fromEntries(FORM_FIELDS.map((f) => [f.key, ""])));
  };

  const peso = parseItalianDecimal(form.peso);
  const grassoCorporeo = parseItalianDecimal(form.grassoCorporeo);

  const massaMagra = useMemo(() => {
    if (!peso || !grassoCorporeo) return null;
    return peso * (1 - grassoCorporeo / 100);
  }, [peso, grassoCorporeo]);

  const canCalculate = peso > 0 && grassoCorporeo > 0 && grassoCorporeo < 100;
  const canDownload = canCalculate && form.nome.trim().length > 0;

  const handleDownloadPdf = () => {
    if (!canDownload || massaMagra === null) return;
    generateBodyCompositionPdf(form, massaMagra, FORM_FIELDS);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-green/10">
            <Activity className="h-5 w-5 text-accent-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Analisi Composizione Corporea
            </h1>
            <p className="text-sm text-text-dim">
              Inserisci i dati della bilancia impedenziometrica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateBlankFormPdf}
            className="flex items-center gap-2 rounded-btn border border-border-card px-4 py-2 text-sm font-medium text-text-muted hover:bg-white/[0.03] hover:text-text-primary transition-colors"
          >
            <Printer className="h-4 w-4" />
            Stampa Scheda
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-btn border border-border-card px-4 py-2 text-sm font-medium text-text-muted hover:bg-white/[0.03] hover:text-text-primary transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={!canDownload}
            className={`flex items-center gap-2 rounded-btn px-4 py-2 text-sm font-semibold transition-colors ${
              canDownload
                ? "bg-accent-green text-white hover:bg-accent-green/90"
                : "bg-white/[0.05] text-text-dim cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            Scarica PDF
          </button>
        </div>
      </div>

      {/* Massa Magra Result Card */}
      {canCalculate && massaMagra !== null && (
        <div className="relative overflow-hidden rounded-card border border-accent-green/30 bg-gradient-to-r from-accent-green/10 via-accent-green/5 to-transparent">
          <div className="absolute top-0 left-0 h-full w-1 bg-accent-green" />
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-green/15">
                <Dumbbell className="h-6 w-6 text-accent-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">
                  Massa Magra Calcolata
                </p>
                <p className="text-3xl font-bold font-mono text-accent-green">
                  {formatItalianDecimal(massaMagra)} Kg
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-cyan/15">
                <Percent className="h-6 w-6 text-accent-cyan" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-muted">
                  % Massa Magra
                </p>
                <p className="text-3xl font-bold font-mono text-accent-cyan">
                  {formatItalianDecimal(massaMagra / peso * 100, 1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <SectionCard title="Dati Rilevazione" subtitle="Compila i campi dalla bilancia impedenziometrica">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FORM_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="group">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-text-muted">
                  <Icon className={`h-4 w-4 text-${field.color}`} />
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode={field.type === "number" ? "decimal" : "text"}
                    value={form[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`
                      w-full rounded-btn border border-border-card bg-white/[0.03] px-4 py-3.5
                      text-base text-text-primary placeholder:text-text-dim/50
                      focus:border-${field.color} focus:outline-none focus:ring-1 focus:ring-${field.color}/30
                      transition-colors font-mono
                      ${field.key === "nome" ? "font-sans" : ""}
                    `}
                  />
                  {field.unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-dim">
                      {field.unit}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Info */}
      {!canDownload && (
        <p className="text-center text-xs text-text-dim">
          {!form.nome.trim()
            ? "Inserisci il nome del cliente per abilitare il download del PDF"
            : "Inserisci Peso e Grasso Corporeo per calcolare la Massa Magra"}
        </p>
      )}

      {/* Footer */}
      <p className="text-center text-[11px] text-text-dim/60 pb-4">
        PharmaControl · Strumenti
      </p>
    </div>
  );
}
