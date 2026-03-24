import jsPDF from "jspdf";

interface PrintField {
  label: string;
  unit: string;
}

const FIELDS: PrintField[] = [
  { label: "Nome e Cognome", unit: "" },
  { label: "Data", unit: "" },
  { label: "Peso", unit: "Kg" },
  { label: "Peso Abbigliamento", unit: "Kg" },
  { label: "Frequenza Cardiaca", unit: "bpm" },
  { label: "Grasso Viscerale", unit: "LV" },
  { label: "Massa Ossea", unit: "Kg" },
  { label: "Massa Muscolare", unit: "Kg" },
  { label: "Grasso Corporeo", unit: "%" },
  { label: "Età Metabolica", unit: "" },
  { label: "Acqua Corporea", unit: "%" },
  { label: "Punteggio Qualità Muscolare", unit: "Pt" },
  { label: "Valutazione del Fisico", unit: "" },
  { label: "Tasso Metabolico Basale (BMR)", unit: "Kcal" },
  { label: "IMC / BMI", unit: "" },
];

export function generateBlankFormPdf() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Header ──
  y = 20;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Analisi Composizione Corporea", pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Scheda di rilevazione dati — Bilancia impedenziometrica", pageWidth / 2, y, { align: "center" });

  // ── Divider ──
  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // ── Fields ──
  y += 10;
  const rowHeight = 14;
  const labelColWidth = 90;

  FIELDS.forEach((field, i) => {
    const fy = y + i * rowHeight;

    // Alternating background
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, fy - 4, contentWidth, rowHeight, "F");
    }

    // Label
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(field.label, margin + 4, fy + 3);

    // Unit hint
    if (field.unit) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`(${field.unit})`, margin + labelColWidth - 4, fy + 3);
    }

    // Dotted line for writing
    const lineStartX = margin + labelColWidth + 2;
    const lineEndX = margin + contentWidth - 4;
    const lineY = fy + 4;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    // Draw dashed line
    const dashLen = 2;
    const gapLen = 2;
    let cx = lineStartX;
    while (cx < lineEndX) {
      const end = Math.min(cx + dashLen, lineEndX);
      doc.line(cx, lineY, end, lineY);
      cx = end + gapLen;
    }
  });

  // ── Note box ──
  const noteY = y + FIELDS.length * rowHeight + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Note:", margin + 4, noteY);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, noteY + 3, contentWidth, 35, 3, 3, "S");

  // Lines inside note box
  for (let i = 1; i <= 3; i++) {
    const ly = noteY + 3 + i * 8.5;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 4, ly, margin + contentWidth - 4, ly);
  }

  // ── Footer ──
  const footerY = 280;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(
    "La Massa Magra e la relativa percentuale vengono calcolate automaticamente tramite l'app PharmaControl.",
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  // ── Save ──
  doc.save("scheda_composizione_corporea.pdf");
}
