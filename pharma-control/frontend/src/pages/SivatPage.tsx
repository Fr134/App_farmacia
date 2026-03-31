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
  Save,
  History,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import SectionCard from "@/components/ui/SectionCard";
import { generateSivatPdf } from "@/lib/sivatPdf";
import { createSivatAssessment } from "@/services/api";
import {
  type SivatSectionDef,
  type SivatQuestion,
  type Answers,
  SECTION_A,
  SECTION_B,
  SECTION_B_QUESTION,
  SECTION_C,
  SECTION_D,
  SECTION_E,
  ALL_SECTIONS,
  SUPPORT_OPTIONS,
  getSectionScore,
  getScoreClass,
  getCriticalities,
  getSuggestedInterventions,
} from "@/lib/sivatData";

// Icon mapping for sections (kept here to avoid React dependency in sivatData)
const SECTION_ICONS: Record<string, React.ElementType> = {
  a: Brain,
  b: Pill,
  c: Settings,
  d: Heart,
  e: ShieldAlert,
};

const SCORE_ICONS: Record<string, React.ElementType> = {
  "accent-green": CheckCircle2,
  "accent-blue": CheckCircle2,
  "accent-amber": AlertTriangle,
  "accent-red": XCircle,
};

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
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setSaveSuccess(false);
    setSaveError(null);
  };

  const canSave = patientName.trim().length > 0 && totalResult !== null;

  const handleSaveAndDownload = async () => {
    if (!canSave || !totalResult) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const scoreClass = getScoreClass(totalResult.finalScore);
      await createSivatAssessment({
        patientName: patientName.trim(),
        scoreA: sectionScores.a!,
        scoreB: sectionScores.b!,
        scoreC: sectionScores.c!,
        scoreD: sectionScores.d!,
        scoreE: sectionEEnabled ? sectionScores.e! : null,
        sectionEEnabled,
        supportLevel,
        totalScore: totalResult.finalScore,
        rawScore: totalResult.rawTotal,
        maxPossible: totalResult.maxPossible,
        classification: scoreClass.classKey,
        pdcPercentage: pdcPercentage ?? null,
        pdcDaysCovered: pdcDaysCovered ? parseInt(pdcDaysCovered) || null : null,
        pdcDaysObserved: pdcDaysObserved ? parseInt(pdcDaysObserved) || null : null,
        answers,
        criticalities,
        interventions,
      });

      setSaveSuccess(true);

      // Generate PDF after successful save
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
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdfOnly = () => {
    if (!canSave || !totalResult) return;
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

  function renderSectionHeader(section: SivatSectionDef, score: number | null) {
    const Icon = SECTION_ICONS[section.id] ?? ClipboardCheck;
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
          <Link
            to="/tools/sivat/history"
            className="flex items-center gap-2 rounded-btn border border-border-card px-4 py-2 text-sm font-medium text-text-muted hover:bg-white/[0.03] hover:text-text-primary transition-colors"
          >
            <History className="h-4 w-4" />
            Storico
          </Link>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-btn border border-border-card px-4 py-2 text-sm font-medium text-text-muted hover:bg-white/[0.03] hover:text-text-primary transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={handleDownloadPdfOnly}
            disabled={!canSave}
            className={`flex items-center gap-2 rounded-btn border border-border-card px-4 py-2 text-sm font-medium transition-colors ${
              canSave
                ? "text-text-muted hover:bg-white/[0.03] hover:text-text-primary"
                : "text-text-dim cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            Solo PDF
          </button>
          <button
            onClick={handleSaveAndDownload}
            disabled={!canSave || saving}
            className={`flex items-center gap-2 rounded-btn px-4 py-2 text-sm font-semibold transition-colors ${
              canSave && !saving
                ? "bg-accent-blue text-white hover:bg-accent-blue/90"
                : "bg-white/[0.05] text-text-dim cursor-not-allowed"
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salva e Scarica
          </button>
        </div>
      </div>

      {/* Save feedback */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-btn bg-accent-green/10 border border-accent-green/30 px-4 py-3 text-sm text-accent-green">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Valutazione salvata con successo
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 rounded-btn bg-accent-red/10 border border-accent-red/30 px-4 py-3 text-sm text-accent-red">
          <XCircle className="h-4 w-4 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Result Card */}
      {totalResult && (() => {
        const sc = getScoreClass(totalResult.finalScore);
        const ScoreIcon = SCORE_ICONS[sc.color] ?? CheckCircle2;
        return (
          <div className={`relative overflow-hidden rounded-card border border-${sc.color}/30 bg-gradient-to-r from-${sc.color}/10 via-${sc.color}/5 to-transparent`}>
            <div className={`absolute top-0 left-0 h-full w-1 bg-${sc.color}`} />
            <div className="px-6 py-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-${sc.color}/15`}>
                    <ScoreIcon className={`h-7 w-7 text-${sc.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-muted">Punteggio SIVAT-D</p>
                    <p className={`text-4xl font-bold font-mono text-${sc.color}`}>
                      {totalResult.finalScore}
                      <span className="text-lg text-text-dim">/100</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold bg-${sc.color}/15 text-${sc.color}`}>
                    {sc.label}
                  </span>
                  {!sectionEEnabled && (
                    <p className="text-[10px] text-text-dim mt-1">
                      Punteggio riparametrizzato (sez. E esclusa)
                    </p>
                  )}
                </div>
              </div>

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
        );
      })()}

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
      {!canSave && (
        <p className="text-center text-xs text-text-dim">
          {!patientName.trim()
            ? "Inserisci il nome del paziente per abilitare il salvataggio"
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
