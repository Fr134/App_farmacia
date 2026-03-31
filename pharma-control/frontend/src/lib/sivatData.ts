// ── Shared SIVAT-D types, constants, and scoring logic ──
// This file is imported by both SivatPage (UI) and sivatPdf (PDF generation)
// to avoid circular dependencies.

export interface SivatOption {
  label: string;
  value: number;
}

export interface SivatQuestion {
  id: string;
  text: string;
  options: SivatOption[];
}

export interface SivatSectionDef {
  id: string;
  letter: string;
  title: string;
  subtitle: string;
  maxScore: number;
  color: string;
  questions: SivatQuestion[];
}

export type Answers = Record<string, number | null>;

// ── Section Definitions ──

export const SECTION_A: SivatSectionDef = {
  id: "a",
  letter: "A",
  title: "Aderenza Comportamentale Dichiarata",
  subtitle: "Ciò che il paziente riferisce · max 20 punti",
  maxScore: 20,
  color: "accent-blue",
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

export const SECTION_B_QUESTION: SivatQuestion = {
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

export const SECTION_B: SivatSectionDef = {
  id: "b",
  letter: "B",
  title: "Aderenza Oggettiva di Copertura / Refill",
  subtitle: "Indicatore oggettivo PDC · max 25 punti",
  maxScore: 25,
  color: "accent-green",
  questions: [SECTION_B_QUESTION],
};

export const SECTION_C: SivatSectionDef = {
  id: "c",
  letter: "C",
  title: "Complessità Terapeutica / Rischio Strutturale",
  subtitle: "Fragilità del regime terapeutico · max 15 punti",
  maxScore: 15,
  color: "accent-amber",
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

export const SECTION_D: SivatSectionDef = {
  id: "d",
  letter: "D",
  title: "Capacità di Gestione e Comprensione",
  subtitle: "Autoefficacia e comprensione · max 15 punti",
  maxScore: 15,
  color: "accent-purple",
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

export const SECTION_E: SivatSectionDef = {
  id: "e",
  letter: "E",
  title: "Competenza Tecnica su Device",
  subtitle: "Penna, inalatore, collirio, eparina, cerotto · max 15 punti",
  maxScore: 15,
  color: "accent-red",
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

export const ALL_SECTIONS: SivatSectionDef[] = [SECTION_A, SECTION_B, SECTION_C, SECTION_D, SECTION_E];

export const SUPPORT_OPTIONS: SivatOption[] = [
  { label: "Nessun supporto", value: 0 },
  { label: "Reminder / foglio terapia / pilloliera semplice", value: 1 },
  { label: "Pilloliera preparata da caregiver", value: 2 },
  { label: "Deblistering personalizzato con monitoraggio farmacia", value: 3 },
];

// ── Scoring Helpers ──

export function getSectionScore(section: SivatSectionDef, answers: Answers): number | null {
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

export type SivatClassKey = "ALTA" | "BUONA" | "PARZIALE" | "NON_ADERENZA";

export function getScoreClass(score: number): { label: string; color: string; classKey: SivatClassKey } {
  if (score >= 85) return { label: "Aderenza alta", color: "accent-green", classKey: "ALTA" };
  if (score >= 70) return { label: "Aderenza buona ma fragile", color: "accent-blue", classKey: "BUONA" };
  if (score >= 50) return { label: "Aderenza parziale / rischio elevato", color: "accent-amber", classKey: "PARZIALE" };
  return { label: "Non aderenza clinicamente rilevante", color: "accent-red", classKey: "NON_ADERENZA" };
}

export function getCriticalities(
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

export function getSuggestedInterventions(
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
