import jsPDF from "jspdf";

interface FormField {
  key: string;
  label: string;
  labelShort: string;
  unit: string;
  color: string;
}

type FormData = Record<string, string>;

function formatValue(value: string, unit: string): string {
  if (!value) return "—";
  return unit ? `${value} ${unit}` : value;
}

// Color mappings for PDF (RGB)
const PDF_COLORS = {
  "accent-blue": [59, 130, 246],
  "accent-green": [16, 185, 129],
  "accent-red": [239, 68, 68],
  "accent-amber": [245, 158, 11],
  "accent-purple": [139, 92, 246],
  "accent-cyan": [6, 182, 212],
} as const;

function getColor(colorKey: string): [number, number, number] {
  return (PDF_COLORS[colorKey as keyof typeof PDF_COLORS] ?? [148, 163, 184]) as [number, number, number];
}

export function generateBodyCompositionPdf(
  form: FormData,
  massaMagra: number,
  fields: FormField[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Background ──
  doc.setFillColor(11, 15, 25);
  doc.rect(0, 0, 210, 297, "F");

  // ── Top accent bar ──
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 4, "F");

  // ── Logo placeholder ──
  y = 18;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, 14, 14, 3, 3, "F");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("LOGO", margin + 7, y + 8.5, { align: "center" });

  // ── Title ──
  doc.setFontSize(18);
  doc.setTextColor(241, 245, 249);
  doc.text("Analisi Composizione Corporea", margin + 18, y + 7);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Report generato da PharmaControl", margin + 18, y + 13);

  // ── Date ──
  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(dateStr, pageWidth - margin, y + 7, { align: "right" });

  // ── Divider ──
  y += 22;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // ── Client Name ──
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("CLIENTE", margin, y);
  doc.setFontSize(16);
  doc.setTextColor(241, 245, 249);
  y += 8;
  doc.text(form.nome || "—", margin, y);

  // ── Massa Magra Result Box ──
  y += 12;
  const boxH = 28;
  const halfBox = (contentWidth - 6) / 2;

  // Left box: Massa Magra Kg
  doc.setFillColor(10, 35, 25);
  doc.roundedRect(margin, y, halfBox, boxH, 4, 4, "F");
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, y, 3, boxH, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("MASSA MAGRA CALCOLATA", margin + 10, y + 10);
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  const massaMagraStr = massaMagra.toFixed(2).replace(".", ",") + " Kg";
  doc.text(massaMagraStr, margin + 10, y + 22);

  // Right box: % Massa Magra
  const rightX = margin + halfBox + 6;
  const peso = parseFloat(form.peso?.replace(",", ".") || "0") || 0;
  const massaMagraPct = peso > 0 ? (massaMagra / peso) * 100 : 0;
  doc.setFillColor(8, 30, 35);
  doc.roundedRect(rightX, y, halfBox, boxH, 4, 4, "F");
  doc.setFillColor(6, 182, 212);
  doc.roundedRect(rightX, y, 3, boxH, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("% MASSA MAGRA", rightX + 10, y + 10);
  doc.setFontSize(22);
  doc.setTextColor(6, 182, 212);
  const massaMagraPctStr = massaMagraPct.toFixed(1).replace(".", ",") + "%";
  doc.text(massaMagraPctStr, rightX + 10, y + 22);

  // ── Data Grid ──
  y += boxH + 14;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("DATI RILEVAZIONE", margin, y);
  y += 6;

  // Grid layout: 2 columns
  const colWidth = contentWidth / 2;
  const dataFields = fields.filter((f) => f.key !== "nome");
  const rowHeight = 16;

  dataFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = margin + col * colWidth;
    const fy = y + row * rowHeight;

    // Row background (alternating)
    if (row % 2 === 0) {
      doc.setFillColor(17, 24, 39);
      doc.rect(fx, fy, colWidth - 4, rowHeight - 2, "F");
    }

    // Color dot
    const [r, g, b] = getColor(field.color);
    doc.setFillColor(r, g, b);
    doc.circle(fx + 4, fy + 5.5, 1.5, "F");

    // Label
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(field.labelShort, fx + 9, fy + 6.5);

    // Value
    doc.setFontSize(10);
    doc.setTextColor(241, 245, 249);
    const val = formatValue(form[field.key], field.unit);
    doc.text(val, fx + colWidth - 8, fy + 6.5, { align: "right" });
  });

  // ── Footer ──
  const footerY = 280;
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
  doc.text("PharmaControl © " + now.getFullYear(), pageWidth / 2, footerY + 9, {
    align: "center",
  });

  // ── Save ──
  const safeName = (form.nome || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_");
  doc.save(`composizione_corporea_${safeName}_${now.toISOString().slice(0, 10)}.pdf`);
}
