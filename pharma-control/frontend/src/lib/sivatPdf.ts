import jsPDF from "jspdf";
import {
  ALL_SECTIONS,
  SUPPORT_OPTIONS,
  getScoreClass,
  type Answers,
} from "@/pages/SivatPage";

interface SivatPdfData {
  patientName: string;
  answers: Answers;
  sectionScores: Record<string, number | null>;
  sectionEEnabled: boolean;
  supportLevel: number | null;
  totalScore: number;
  criticalities: string[];
  interventions: string[];
  pdcPercentage: number | null;
}

const SECTION_COLORS: Record<string, [number, number, number]> = {
  "accent-blue": [59, 130, 246],
  "accent-green": [16, 185, 129],
  "accent-amber": [245, 158, 11],
  "accent-purple": [139, 92, 246],
  "accent-red": [239, 68, 68],
  "accent-cyan": [6, 182, 212],
};

function getColor(key: string): [number, number, number] {
  return SECTION_COLORS[key] ?? [148, 163, 184];
}

export function generateSivatPdf(data: SivatPdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Background ──
  doc.setFillColor(11, 15, 25);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ── Top accent bar ──
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 4, "F");

  // ── Logo placeholder ──
  y = 16;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, 14, 14, 3, 3, "F");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("LOGO", margin + 7, y + 8.5, { align: "center" });

  // ── Title ──
  doc.setFontSize(16);
  doc.setTextColor(241, 245, 249);
  doc.text("SIVAT-D · Aderenza Terapeutica", margin + 18, y + 7);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Sistema Integrato di Valutazione con Deblistering", margin + 18, y + 12);

  // ── Date ──
  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(dateStr, pageWidth - margin, y + 7, { align: "right" });

  // ── Divider ──
  y += 20;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // ── Patient Name ──
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("PAZIENTE", margin, y);
  doc.setFontSize(14);
  doc.setTextColor(241, 245, 249);
  y += 6;
  doc.text(data.patientName || "—", margin, y);

  // ── Score Box ──
  y += 10;
  const scoreClass = getScoreClass(data.totalScore);
  const scoreColor = getColor(scoreClass.color);
  const boxH = 26;

  // Score box
  const scoreBoxW = 65;
  doc.setFillColor(
    Math.round(scoreColor[0] * 0.15),
    Math.round(scoreColor[1] * 0.15 + 5),
    Math.round(scoreColor[2] * 0.15 + 5)
  );
  doc.roundedRect(margin, y, scoreBoxW, boxH, 4, 4, "F");
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(margin, y, 3, boxH, 2, 2, "F");

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("PUNTEGGIO SIVAT-D", margin + 9, y + 9);
  doc.setFontSize(20);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${data.totalScore}/100`, margin + 9, y + 20);

  // Class box
  const classBoxX = margin + scoreBoxW + 5;
  const classBoxW = contentWidth - scoreBoxW - 5;
  doc.setFillColor(17, 24, 39);
  doc.roundedRect(classBoxX, y, classBoxW, boxH, 4, 4, "F");

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("CLASSIFICAZIONE", classBoxX + 8, y + 9);
  doc.setFontSize(11);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(scoreClass.label, classBoxX + 8, y + 17);

  if (!data.sectionEEnabled) {
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Punteggio riparametrizzato (sez. E esclusa)", classBoxX + 8, y + 23);
  }

  // Support level
  if (data.supportLevel !== null) {
    doc.setFontSize(8);
    doc.setTextColor(6, 182, 212);
    const supportLabel = SUPPORT_OPTIONS.find(o => o.value === data.supportLevel)?.label ?? "";
    doc.text(
      `Supporto organizzativo: Livello ${data.supportLevel} — ${supportLabel}`,
      classBoxX + 8,
      y + (data.sectionEEnabled ? 23 : 23)
    );
  }

  // ── Section Breakdown ──
  y += boxH + 10;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DETTAGLIO PER SEZIONE", margin, y);
  y += 6;

  const sections = data.sectionEEnabled
    ? ALL_SECTIONS
    : ALL_SECTIONS.filter((s) => s.id !== "e");

  for (const section of sections) {
    const score = data.sectionScores[section.id];
    if (score === null) continue;
    const pct = Math.round((score / section.maxScore) * 100);
    const sColor = getColor(section.color);

    // Row background
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");

    // Color indicator
    doc.setFillColor(sColor[0], sColor[1], sColor[2]);
    doc.roundedRect(margin, y, 2.5, 12, 1, 1, "F");

    // Section letter and title
    doc.setFontSize(8);
    doc.setTextColor(sColor[0], sColor[1], sColor[2]);
    doc.text(`${section.letter}.`, margin + 6, y + 7);
    doc.setTextColor(241, 245, 249);
    doc.text(section.title, margin + 12, y + 7);

    // Score
    doc.setTextColor(sColor[0], sColor[1], sColor[2]);
    doc.text(`${score}/${section.maxScore}`, pageWidth - margin - 25, y + 7, {
      align: "right",
    });

    // Mini bar
    const barX = pageWidth - margin - 22;
    const barW = 20;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(barX, y + 4, barW, 3, 1, 1, "F");
    doc.setFillColor(sColor[0], sColor[1], sColor[2]);
    doc.roundedRect(barX, y + 4, (barW * pct) / 100, 3, 1, 1, "F");

    y += 14;
  }

  // ── Section Detail: questions and answers ──
  y += 4;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("RISPOSTE DETTAGLIATE", margin, y);
  y += 5;

  for (const section of sections) {
    const score = data.sectionScores[section.id];
    if (score === null) continue;
    const sColor = getColor(section.color);

    // Section header
    doc.setFontSize(7);
    doc.setTextColor(sColor[0], sColor[1], sColor[2]);
    doc.text(`${section.letter}. ${section.title}`, margin, y + 3);
    y += 5;

    for (const q of section.questions) {
      const answerValue = data.answers[q.id];
      if (answerValue === null || answerValue === undefined) continue;
      const selectedOption = q.options.find((o) => o.value === answerValue);

      // Check if we need a new page
      if (y > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(11, 15, 25);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageWidth, 4, "F");
        y = 14;
      }

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      const questionLines = doc.splitTextToSize(q.text, contentWidth - 30);
      doc.text(questionLines, margin + 3, y + 3);

      doc.setTextColor(241, 245, 249);
      doc.text(
        `${selectedOption?.label ?? "—"} (${answerValue}pt)`,
        pageWidth - margin,
        y + 3,
        { align: "right" }
      );

      y += Math.max(questionLines.length * 3.5, 4.5);
    }

    y += 2;
  }

  // ── PDC Info ──
  if (data.pdcPercentage !== null) {
    if (y > pageHeight - 30) {
      doc.addPage();
      doc.setFillColor(11, 15, 25);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 4, "F");
      y = 14;
    }
    doc.setFontSize(7);
    doc.setTextColor(16, 185, 129);
    doc.text(
      `PDC calcolato: ${data.pdcPercentage.toFixed(1).replace(".", ",")}%`,
      margin,
      y + 3
    );
    y += 6;
  }

  // ── Criticalities ──
  if (data.criticalities.length > 0) {
    if (y > pageHeight - 40) {
      doc.addPage();
      doc.setFillColor(11, 15, 25);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 4, "F");
      y = 14;
    }

    y += 2;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("CRITICITÀ PRINCIPALI", margin, y);
    y += 5;

    for (const crit of data.criticalities) {
      doc.setFillColor(245, 158, 11);
      doc.circle(margin + 2, y + 1.5, 1, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(245, 158, 11);
      doc.text(crit, margin + 6, y + 3);
      y += 5;
    }
  }

  // ── Interventions ──
  if (data.interventions.length > 0) {
    if (y > pageHeight - 35) {
      doc.addPage();
      doc.setFillColor(11, 15, 25);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 4, "F");
      y = 14;
    }

    y += 3;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("INTERVENTI CONSIGLIATI", margin, y);
    y += 5;

    for (const interv of data.interventions) {
      doc.setFillColor(16, 185, 129);
      doc.circle(margin + 2, y + 1.5, 1, "F");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text(interv, margin + 6, y + 3);
      y += 5;
    }
  }

  // ── Footer ──
  const footerY = pageHeight - 17;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Questo report è generato automaticamente e non costituisce diagnosi medica.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );
  doc.text(
    "SIVAT-D — Sistema Integrato di Valutazione dell'Aderenza Terapeutica con Deblistering",
    pageWidth / 2,
    footerY + 9,
    { align: "center" }
  );
  doc.text(`PharmaControl © ${now.getFullYear()}`, pageWidth / 2, footerY + 13, {
    align: "center",
  });

  // ── Save ──
  const safeName = (data.patientName || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");
  doc.save(`sivat_d_${safeName}_${now.toISOString().slice(0, 10)}.pdf`);
}
