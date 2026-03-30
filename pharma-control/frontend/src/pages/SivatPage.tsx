import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  User,
  Brain,
  Pill,
  Settings,
  Heart,
  HandHelping,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import { generateSivatPdf } from "@/lib/sivatPdf";

// ── Types ──

interface SivatOption {
  label: string;
  value: number;
}

interface SivatQuestion {
  id: string;
  text: string;
  options: SivatOption[];
}

interface SivatSection {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  maxScore: number;
  color: string;
  icon: React.ElementType;
  questions: SivatQuestion[];
}

// ── Section Definitions ──

const SECTION_A: SivatSection = {
  id: "a",
  letter: "A",
  title: "Aderenza Comportamentale Dichiarata",
  subtitle: "Ciò che il paziente riferisce · max 20 punti",
  maxScore: 20,
  color: "accent-blue",
  icon: Brain,
  questions: [
    {
      id: "a1",
      text: "Negli ultimi 7 giorni, quante volte ha saltato una dose?",
      options: [
        { label: "Mai", value: 4 },
        { label: "1 volta", value: 3 },
        { label: "2 volte", value: 2 },
        { label: "3 o più", value: 1 },
        { label: "Quasi sempre / non sa", value: 0 },
      ],
    },
    {
      id: "a2",
      text: "Le capita di cambiare orario o dose senza parlarne con medico o farmacia?",
      options: [
        { label: "Mai", value: 4 },
        { label: "Raramente", value: 3 },
        { label: "A volte", value: 2 },
        { label: "Spesso", value: 1 },
        { label: "Molto spesso", value: 0 },
      ],
    },
    {
      id: "a3",
      text: "Quando si sente bene, tende a trascurare o sospendere la terapia?",
      options: [
        { label: "Mai", value: 4 },
        { label: "Raramente", value: 3 },
        { label: "A volte", value: 2 },
        { label: "Spesso", value: 1 },
        { label: "Sì, spesso", value: 0 },
      ],
    },
    {
      id: "a4",
      text: "Se compare un effetto indesiderato, interrompe il farmaco prima di confrontarsi con qualcuno?",
      options: [
        { label: "Mai", value: 4 },
        { label: "Raramente", value: 3 },
        { label: "A volte", value: 2 },
        { label: "Spesso", value: 1 },
        { label: "Sempre / quasi sempre", value: 0 },
      ],
    },
    {
      id: "a5",
      text: "Quanto si sente costante nel seguire la terapia ogni giorno?",
      options: [
        { label: "Molto costante", value: 4 },
        { label: "Abbastanza", value: 3 },
        { label: "Discontinuo", value: 2 },
        { label: "Poco costante", value: 1 },
        { label: "Per niente", value: 0 },
      ],
    },
  ],
};

const SECTION_B_QUESTION: SivatQuestion = {
  id: "b1",
  text: "PDC — Proportion of Days Covered",
  options: [
    { label: "≥ 90%", value: 25 },
    { label: "80–89%", value: 22 },
    { label: "70–79%", value: 18 },
    { label: "60–69%", value: 12 },
    { label: "40–59%", value: 6 },
    { label: "< 40%", value: 0 },
  ],
};

const SECTION_B: SivatSection = {
  id: "b",
  letter: "B",
  title: "Aderenza Oggettiva di Copertura / Refill",
  subtitle: "Indicatore oggettivo PDC · max 25 punti",
  maxScore: 25,
  color: "accent-green",
  icon: Pill,
  questions: [SECTION_B_QUESTION],
};

const SECTION_C: SivatSection = {
  id: "c",
  letter: "C",
  title: "Complessità Terapeutica / Rischio Strutturale",
  subtitle: "Fragilità del regime terapeutico · max 15 punti",
  maxScore: 15,
  color: "accent-amber",
  icon: Settings,
  questions: [
    {
      id: "c1",
      text: "Numero di farmaci cronici",
      options: [
        { label: "1–3 farmaci", value: 3 },
        { label: "4–6 farmaci", value: 2 },
        { label: "Più di 6", value: 0 },
      ],
    },
    {
      id: "c2",
      text: "Assunzioni al giorno",
      options: [
        { label: "1 volta/die", value: 3 },
        { label: "2 volte/die", value: 2 },
        { label: "3 volte/die", value: 1 },
        { label: "4 o più", value: 0 },
      ],
    },
    {
      id: "c3",
      text: "Complessità degli orari",
      options: [
        { label: "Semplici / allineati ai pasti", value: 3 },
        { label: "Orari misti", value: 2 },
        { label: "Schema complesso", value: 0 },
      ],
    },
    {
      id: "c4",
      text: "Presenza caregiver",
      options: [
        { label: "Caregiver affidabile", value: 3 },
        { label: "Supporto saltuario", value: 2 },
        { label: "Nessun supporto (pz. fragile)", value: 0 },
      ],
    },
    {
      id: "c5",
      text: "Cambi recenti di terapia",
      options: [
        { label: "Nessun cambio recente", value: 3 },
        { label: "Cambio ultimi 30–60 giorni", value: 2 },
        { label: "Più cambi / terapia instabile", value: 0 },
      ],
    },
  ],
};

const SECTION_D: SivatSection = {
  id: "d",
  letter: "D",
  title: "Capacità di Gestione e Comprensione",
  subtitle: "Autoefficacia e comprensione · max 15 punti",
  maxScore: 15,
  color: "accent-purple",
  icon: Heart,
  questions: [
    {
      id: "d1",
      text: "Sa dire a cosa servono i suoi farmaci principali?",
      options: [
        { label: "Sì, bene", value: 3 },
        { label: "In parte", value: 2 },
        { label: "Poco", value: 1 },
        { label: "No", value: 0 },
      ],
    },
    {
      id: "d2",
      text: "Sa quando e come assumerli correttamente?",
      options: [
        { label: "Sì, sempre", value: 3 },
        { label: "Quasi sempre", value: 2 },
        { label: "Con dubbi", value: 1 },
        { label: "No", value: 0 },
      ],
    },
    {
      id: "d3",
      text: "Sa cosa fare se dimentica una dose?",
      options: [
        { label: "Sì", value: 3 },
        { label: "In parte", value: 2 },
        { label: "No", value: 0 },
      ],
    },
    {
      id: "d4",
      text: "Si sente sicuro nel gestire da solo la terapia?",
      options: [
        { label: "Molto", value: 3 },
        { label: "Abbastanza", value: 2 },
        { label: "Poco", value: 1 },
        { label: "Per niente", value: 0 },
      ],
    },
    {
      id: "d5",
      text: "Ha difficoltà visive, manuali o cognitive che interferiscono?",
      options: [
        { label: "No", value: 3 },
        { label: "Lievi", value: 2 },
        { label: "Moderate", value: 1 },
        { label: "Importanti", value: 0 },
      ],
    },
  ],
};

const SECTION_E: SivatSection = {
  id: "e",
  letter: "E",
  title: "Competenza Tecnica su Device",
  subtitle: "Penna, inalatore, collirio, eparina, cerotto · max 15 punti",
  maxScore: 15,
  color: "accent-red",
  icon: ShieldAlert,
  questions: [
    {
      id: "e1",
      text: "Prepara correttamente il device",
      options: [
        { label: "Correttamente", value: 3 },
        { label: "Errori minori", value: 2 },
        { label: "Errori importanti", value: 1 },
        { label: "Non è in grado", value: 0 },
      ],
    },
    {
      id: "e2",
      text: "Esegue correttamente la somministrazione",
      options: [
        { label: "Correttamente", value: 3 },
        { label: "Errori minori", value: 2 },
        { label: "Errori importanti", value: 1 },
        { label: "Non è in grado", value: 0 },
      ],
    },
    {
      id: "e3",
      text: "Rispetta tempi e modalità (inspirazione, rotazione sede, priming...)",
      options: [
        { label: "Correttamente", value: 3 },
        { label: "Errori minori", value: 2 },
        { label: "Errori importanti", value: 1 },
        { label: "Non è in grado", value: 0 },
      ],
    },
    {
      id: "e4",
      text: "Conserva correttamente il farmaco/device",
      options: [
        { label: "Correttamente", value: 3 },
        { label: "Errori minori", value: 2 },
        { label: "Errori importanti", value: 1 },
        { label: "Non è in grado", value: 0 },
      ],
    },
    {
      id: "e5",
      text: "Sa ripetere la procedura senza aiuto",
      options: [
        { label: "Sì, autonomamente", value: 3 },
        { label: "Con indicazioni", value: 2 },
        { label: "Solo con aiuto", value: 1 },
        { label: "No", value: 0 },
      ],
    },
  ],
};

const SUPPORT_OPTIONS: SivatOption[] = [
  { label: "Nessun supporto", value: 0 },
  { label: "Reminder / foglio terapia / pilloliera semplice", value: 1 },
  { label: "Pilloliera preparata da caregiver", value: 2 },
  { label: "Deblistering personalizzato con monitoraggio farmacia", value: 3 },
];

const ALL_SECTIONS: SivatSection[] = [SECTION_A, SECTION_B, SECTION_C, SECTION_D, SECTION_E];

// ── Helpers ──

type Answers = Record<string, number | null>;

function getSectionScore(section: SivatSection, answers: Answers): number | null {
  let total = 0;
  let allAnswered = true;
  for (const q of section.questions) {
    const val = answers[q.id];
    if (val === null || val === undefined) {
      allAnswered = false;
    } else {
      total += val;
    }
  }
  return allAnswered ? total : null;
}

function getScoreClass(score: number): { label: string; color: string; icon: React.ElementType } {
  if (score >= 85) return { label: "Aderenza alta", color: "accent-green", icon: CheckCircle2 };
  if (score >= 70) return { label: "Aderenza buona ma fragile", color: "accent-blue", icon: CheckCircle2 };
  if (score >= 50) return { label: "Aderenza parziale / rischio elevato", color: "accent-amber", icon: AlertTriangle };
  return { label: "Non aderenza clinicamente rilevante", color: "accent-red", icon: XCircle };
}

function getCriticalities(
  sectionScores: Record<string, number | null>,
  sectionEEnabled: boolean
): string[] {
  const crits: string[] = [];
  const a = sectionScores.a;
  const b = sectionScores.b;
  const c = sectionScores.c;
  const d = sectionScores.d;
  const e = sectionScores.e;

  if (a !== null && a <= 10) crits.push("Prevalenza di dimenticanze e comportamento irregolare");
  if (b !== null && b <= 12) crits.push("Bassa copertura refill / ritiri tardivi");
  if (c !== null && c <= 7) crits.push("Elevata complessità terapeutica");
  if (d !== null && d <= 7) crits.push("Scarsa autonomia e comprensione della terapia");
  if (sectionEEnabled && e !== null && e <= 7) crits.push("Tecnica errata nell'uso del device");

  return crits;
}

function getSuggestedInterventions(
  sectionScores: Record<string, number | null>,
  supportLevel: number | null,
  sectionEEnabled: boolean
): string[] {
  const interventions: string[] = [];
  const a = sectionScores.a;
  const b = sectionScores.b;
  const c = sectionScores.c;
  const d = sectionScores.d;
  const e = sectionScores.e;

  if ((a !== null && a <= 12) || (b !== null && b <= 12))
    interventions.push("Deblistering personalizzato");
  if (c !== null && c <= 7)
    interventions.push("Semplificazione schema terapeutico (consultare medico)");
  if (d !== null && d <= 7)
    interventions.push("Counseling farmaceutico sulla terapia");
  if (sectionEEnabled && e !== null && e <= 7)
    interventions.push("Educazione tecnica sull'uso del device");
  if (supportLevel !== null && supportLevel <= 1)
    interventions.push("Follow-up attivo a 30 giorni");

  if (interventions.length === 0 && a !== null)
    interventions.push("Mantenimento e monitoraggio periodico");

  return interventions;
}

// ── Component ──

export default function SivatPage() {
  const [patientName, setPatientName] = useState("");
  const [answers, setAnswers] = useState<Answers>(() => {
    const init: Answers = {};
    for (const section of ALL_SECTIONS) {
      for (const q of section.questions) {
        init[q.id] = null;
      }
    }
    return init;
  });
  const [sectionEEnabled, setSectionEEnabled] = useState(false);
  const [supportLevel, setSupportLevel] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    a: true, b: true, c: true, d: true, e: true, f: true,
  });
  const [pdcDaysCovered, setPdcDaysCovered] = useState("");
  const [pdcDaysObserved, setPdcDaysObserved] = useState("");

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // PDC auto-calculation
  const pdcPercentage = useMemo(() => {
    const covered = parseFloat(pdcDaysCovered.replace(",", "."));
    const observed = parseFloat(pdcDaysObserved.replace(",", "."));
    if (!covered || !observed || observed <= 0) return null;
    return (covered / observed) * 100;
  }, [pdcDaysCovered, pdcDaysObserved]);

  // Section scores
  const sectionScores = useMemo(() => {
    const scores: Record<string, number | null> = {};
    for (const section of ALL_SECTIONS) {
      if (section.id === "e" && !sectionEEnabled) {
        scores[section.id] = null;
        continue;
      }
      scores[section.id] = getSectionScore(section, answers);
    }
    return scores;
  }, [answers, sectionEEnabled]);

  // Total score with reparametrization
  const totalResult = useMemo(() => {
    const sectionsToCount = sectionEEnabled
      ? ["a", "b", "c", "d", "e"]
      : ["a", "b", "c", "d"];

    let rawTotal = 0;
    let allComplete = true;
    let maxPossible = 0;

    for (const id of sectionsToCount) {
      const section = ALL_SECTIONS.find((s) => s.id === id)!;
      maxPossible += section.maxScore;
      const score = sectionScores[id];
      if (score === null) {
        allComplete = false;
      } else {
        rawTotal += score;
      }
    }

    if (!allComplete) return null;

    // Reparametrize to 100 if section E is excluded
    const finalScore = sectionEEnabled
      ? rawTotal
      : Math.round((rawTotal / maxPossible) * 100);

    return { rawTotal, finalScore, maxPossible };
  }, [sectionScores, sectionEEnabled]);

  const criticalities = useMemo(
    () => getCriticalities(sectionScores, sectionEEnabled),
    [sectionScores, sectionEEnabled]
  );

  const interventions = useMemo(
    () => getSuggestedInterventions(sectionScores, supportLevel, sectionEEnabled),
    [sectionScores, supportLevel, sectionEEnabled]
  );

  const handleReset = () => {
    setPatientName("");
    setAnswers(() => {
      const init: Answers = {};
      for (const section of ALL_SECTIONS) {
        for (const q of section.questions) {
          init[q.id] = null;
        }
      }
      return init;
    });
    setSectionEEnabled(false);
    setSupportLevel(null);
    setPdcDaysCovered("");
    setPdcDaysObserved("");
  };

  const canDownload = patientName.trim().length > 0 && totalResult !== null;

  const handleDownloadPdf = () => {
    if (!canDownload || !totalResult) return;
    generateSivatPdf({
      patientName,
      answers,
      sectionScores,
      sectionEEnabled,
      supportLevel,
      totalScore: totalResult.finalScore,
      criticalities,
      interventions,
      pdcPercentage,
    });
  };

  // ── Render Helpers ──

  function renderQuestion(q: SivatQuestion, sectionColor: string) {
    const selected = answers[q.id];
    return (
      <div key={q.id} className="py-4 border-b border-border-card/50 last:border-0">
        <p className="text-sm font-medium text-text-primary mb-3">{q.text}</p>
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={`${q.id}-${opt.value}`}
                onClick={() => handleAnswer(q.id, opt.value)}
                className={`
                  px-3 py-2 rounded-btn text-xs font-medium transition-all border
                  ${
                    isSelected
                      ? `bg-${sectionColor}/15 border-${sectionColor}/50 text-${sectionColor}`
                      : "border-border-card bg-white/[0.02] text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                  }
                `}
              >
                {opt.label}
                <span className={`ml-1.5 text-[10px] ${isSelected ? `text-${sectionColor}/70` : "text-text-dim"}`}>
                  {opt.value}pt
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSectionHeader(section: SivatSection, score: number | null) {
    const Icon = section.icon;
    const isExpanded = expandedSections[section.id];
    const ChevIcon = isExpanded ? ChevronUp : ChevronDown;
    const pct = score !== null ? Math.round((score / section.maxScore) * 100) : 0;

    return (
      <button
        onClick={() => toggleSection(section.id)}
        className="w-full flex items-center justify-between py-1 group"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${section.color}/10`}>
            <Icon className={`h-4 w-4 text-${section.color}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold text-${section.color}`}>
                {section.letter}.
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {section.title}
              </span>
            </div>
            <p className="text-xs text-text-dim">{section.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {score !== null && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-${section.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-sm font-bold font-mono text-${section.color}`}>
                {score}/{section.maxScore}
              </span>
            </div>
          )}
          <ChevIcon className="h-4 w-4 text-text-dim group-hover:text-text-muted transition-colors" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-blue/10">
            <ClipboardCheck className="h-5 w-5 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              SIVAT-D · Aderenza Terapeutica
            </h1>
            <p className="text-sm text-text-dim">
              Sistema Integrato di Valutazione dell'Aderenza Terapeutica con Deblistering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                ? "bg-accent-blue text-white hover:bg-accent-blue/90"
                : "bg-white/[0.05] text-text-dim cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            Scarica Report
          </button>
        </div>
      </div>

      {/* Result Card */}
      {totalResult && (
        <div
          className={`relative overflow-hidden rounded-card border border-${getScoreClass(totalResult.finalScore).color}/30 bg-gradient-to-r from-${getScoreClass(totalResult.finalScore).color}/10 via-${getScoreClass(totalResult.finalScore).color}/5 to-transparent`}
        >
          <div className={`absolute top-0 left-0 h-full w-1 bg-${getScoreClass(totalResult.finalScore).color}`} />
          <div className="px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-${getScoreClass(totalResult.finalScore).color}/15`}>
                  {(() => {
                    const ScoreIcon = getScoreClass(totalResult.finalScore).icon;
                    return <ScoreIcon className={`h-7 w-7 text-${getScoreClass(totalResult.finalScore).color}`} />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-muted">Punteggio SIVAT-D</p>
                  <p className={`text-4xl font-bold font-mono text-${getScoreClass(totalResult.finalScore).color}`}>
                    {totalResult.finalScore}
                    <span className="text-lg text-text-dim">/100</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold bg-${getScoreClass(totalResult.finalScore).color}/15 text-${getScoreClass(totalResult.finalScore).color}`}>
                  {getScoreClass(totalResult.finalScore).label}
                </span>
                {!sectionEEnabled && (
                  <p className="text-[10px] text-text-dim mt-1">
                    Punteggio riparametrizzato (sez. E esclusa)
                  </p>
                )}
              </div>
            </div>

            {/* Criticalities & Interventions */}
            {(criticalities.length > 0 || interventions.length > 0) && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                      Criticità principali
                    </p>
                    <ul className="space-y-1">
                      {criticalities.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-xs text-accent-amber">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {interventions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                      Interventi consigliati
                    </p>
                    <ul className="space-y-1">
                      {interventions.map((i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-accent-green">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Name */}
      <SectionCard title="Paziente" subtitle="Dati identificativi">
        <div className="max-w-md">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-text-muted">
            <User className="h-4 w-4 text-accent-blue" />
            Nome e Cognome
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="es. Mario Rossi"
            className="w-full rounded-btn border border-border-card bg-white/[0.03] px-4 py-3.5 text-base text-text-primary placeholder:text-text-dim/50 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30 transition-colors"
          />
        </div>
      </SectionCard>

      {/* Section A */}
      <SectionCard>
        {renderSectionHeader(SECTION_A, sectionScores.a)}
        {expandedSections.a && (
          <div className="mt-3">
            {SECTION_A.questions.map((q) => renderQuestion(q, SECTION_A.color))}
          </div>
        )}
      </SectionCard>

      {/* Section B — PDC */}
      <SectionCard>
        {renderSectionHeader(SECTION_B, sectionScores.b)}
        {expandedSections.b && (
          <div className="mt-3">
            {/* PDC Calculator */}
            <div className="py-4 border-b border-border-card/50">
              <p className="text-sm font-medium text-text-primary mb-1">
                Calcolo PDC (opzionale)
              </p>
              <p className="text-xs text-text-dim mb-3">
                PDC = Giorni coperti / Giorni osservati × 100
              </p>
              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Giorni coperti</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pdcDaysCovered}
                    onChange={(e) => setPdcDaysCovered(e.target.value)}
                    placeholder="es. 75"
                    className="w-28 rounded-btn border border-border-card bg-white/[0.03] px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/50 focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Giorni osservati</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pdcDaysObserved}
                    onChange={(e) => setPdcDaysObserved(e.target.value)}
                    placeholder="es. 90"
                    className="w-28 rounded-btn border border-border-card bg-white/[0.03] px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-dim/50 focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green/30 transition-colors"
                  />
                </div>
                {pdcPercentage !== null && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-btn bg-accent-green/10 border border-accent-green/30">
                    <span className="text-xs text-text-muted">PDC:</span>
                    <span className="text-sm font-bold font-mono text-accent-green">
                      {pdcPercentage.toFixed(1).replace(".", ",")}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Score selection */}
            <div className="py-4">
              <p className="text-sm font-medium text-text-primary mb-1">
                Fascia di copertura
              </p>
              <p className="text-xs text-text-dim mb-3">
                Seleziona la fascia PDC del paziente (o usa il calcolatore sopra come riferimento)
              </p>
              <div className="flex flex-wrap gap-2">
                {SECTION_B_QUESTION.options.map((opt) => {
                  const isSelected = answers.b1 === opt.value;
                  return (
                    <button
                      key={`b1-${opt.value}`}
                      onClick={() => handleAnswer("b1", opt.value)}
                      className={`
                        px-4 py-2.5 rounded-btn text-sm font-medium transition-all border
                        ${
                          isSelected
                            ? "bg-accent-green/15 border-accent-green/50 text-accent-green"
                            : "border-border-card bg-white/[0.02] text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                        }
                      `}
                    >
                      {opt.label}
                      <span className={`ml-2 text-xs ${isSelected ? "text-accent-green/70" : "text-text-dim"}`}>
                        {opt.value}pt
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Section C */}
      <SectionCard>
        {renderSectionHeader(SECTION_C, sectionScores.c)}
        {expandedSections.c && (
          <div className="mt-3">
            {SECTION_C.questions.map((q) => renderQuestion(q, SECTION_C.color))}
          </div>
        )}
      </SectionCard>

      {/* Section D */}
      <SectionCard>
        {renderSectionHeader(SECTION_D, sectionScores.d)}
        {expandedSections.d && (
          <div className="mt-3">
            {SECTION_D.questions.map((q) => renderQuestion(q, SECTION_D.color))}
          </div>
        )}
      </SectionCard>

      {/* Section E — with toggle */}
      <SectionCard>
        <div className="flex items-center justify-between mb-2">
          {renderSectionHeader(SECTION_E, sectionEEnabled ? sectionScores.e : null)}
        </div>
        <div className="flex items-center gap-3 py-2 px-1">
          <button
            onClick={() => setSectionEEnabled(!sectionEEnabled)}
            className="flex items-center gap-2 text-sm"
          >
            {sectionEEnabled ? (
              <ToggleRight className="h-6 w-6 text-accent-red" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-text-dim" />
            )}
            <span className={sectionEEnabled ? "text-text-primary font-medium" : "text-text-dim"}>
              {sectionEEnabled
                ? "Paziente usa device tecnici"
                : "Il paziente non usa device tecnici (sezione esclusa, punteggio riparametrizzato)"}
            </span>
          </button>
        </div>
        {sectionEEnabled && expandedSections.e && (
          <div className="mt-2">
            {SECTION_E.questions.map((q) => renderQuestion(q, SECTION_E.color))}
          </div>
        )}
      </SectionCard>

      {/* Section F — Support Level (separate index) */}
      <SectionCard>
        <button
          onClick={() => toggleSection("f")}
          className="w-full flex items-center justify-between py-1 group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10">
              <HandHelping className="h-4 w-4 text-accent-cyan" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent-cyan">F.</span>
                <span className="text-sm font-semibold text-text-primary">
                  Supporto Organizzativo / Deblistering
                </span>
              </div>
              <p className="text-xs text-text-dim">Indice separato · livello 0–3</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {supportLevel !== null && (
              <span className="text-sm font-bold font-mono text-accent-cyan">
                Livello {supportLevel}
              </span>
            )}
            {expandedSections.f ? (
              <ChevronUp className="h-4 w-4 text-text-dim" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-dim" />
            )}
          </div>
        </button>
        {expandedSections.f && (
          <div className="mt-3 py-4">
            <p className="text-sm font-medium text-text-primary mb-3">
              Livello di supporto organizzativo attuale
            </p>
            <div className="space-y-2">
              {SUPPORT_OPTIONS.map((opt) => {
                const isSelected = supportLevel === opt.value;
                return (
                  <button
                    key={`f-${opt.value}`}
                    onClick={() => setSupportLevel(opt.value)}
                    className={`
                      w-full text-left px-4 py-3 rounded-btn text-sm font-medium transition-all border
                      ${
                        isSelected
                          ? "bg-accent-cyan/15 border-accent-cyan/50 text-accent-cyan"
                          : "border-border-card bg-white/[0.02] text-text-muted hover:bg-white/[0.05] hover:text-text-primary"
                      }
                    `}
                  >
                    <span className={`inline-block w-6 text-xs font-bold ${isSelected ? "text-accent-cyan" : "text-text-dim"}`}>
                      {opt.value}.
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Info */}
      {!canDownload && (
        <p className="text-center text-xs text-text-dim">
          {!patientName.trim()
            ? "Inserisci il nome del paziente per abilitare il download del report"
            : "Completa tutte le sezioni per generare il report SIVAT-D"}
        </p>
      )}

      {/* Footer */}
      <p className="text-center text-[11px] text-text-dim/60 pb-4">
        PharmaControl · Strumenti · SIVAT-D
      </p>
    </div>
  );
}

// Export types/data for PDF generator
export type { Answers };
export {
  ALL_SECTIONS,
  SUPPORT_OPTIONS,
  getScoreClass,
  getSectionScore,
};
