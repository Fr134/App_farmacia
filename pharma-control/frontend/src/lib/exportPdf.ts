import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_LANDSCAPE = { w: 297, h: 210 }; // mm
const MARGIN = 10; // mm
const CONTENT_W = A4_LANDSCAPE.w - MARGIN * 2;

/**
 * Capture a DOM element as a canvas image and add it to the PDF,
 * scaling to fit the page width while preserving aspect ratio.
 * Automatically adds new pages if content is taller than one page.
 */
async function captureAndAdd(
  pdf: jsPDF,
  element: HTMLElement,
  yOffset: number
): Promise<number> {
  const canvas = await html2canvas(element, {
    backgroundColor: "#0B0F19",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const ratio = canvas.height / canvas.width;
  const imgW = CONTENT_W;
  const imgH = imgW * ratio;

  const maxH = A4_LANDSCAPE.h - MARGIN * 2;

  if (yOffset + imgH > maxH + MARGIN) {
    pdf.addPage();
    yOffset = MARGIN;
  }

  pdf.addImage(imgData, "PNG", MARGIN, yOffset, imgW, imgH);
  return yOffset + imgH + 4;
}

/**
 * Export the dashboard to a multi-page A4 landscape PDF.
 * Expects a container ref with data-pdf-section attributes on child sections.
 */
export async function exportDashboardPdf(
  container: HTMLElement,
  title: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Title
  pdf.setFillColor(11, 15, 25); // bg-primary
  pdf.rect(0, 0, A4_LANDSCAPE.w, A4_LANDSCAPE.h, "F");
  pdf.setTextColor(241, 245, 249); // text-primary
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, MARGIN, MARGIN + 8);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(148, 163, 184); // text-muted
  pdf.text(
    `Generato il ${new Date().toLocaleDateString("it-IT")} alle ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
    MARGIN,
    MARGIN + 14
  );

  let y = MARGIN + 20;

  // Capture each section marked with data-pdf-section
  const sections = container.querySelectorAll<HTMLElement>("[data-pdf-section]");

  for (const section of sections) {
    y = await captureAndAdd(pdf, section, y);
  }

  // Footer on last page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139); // text-dim
    pdf.text(
      `Pharma Control \u2022 Pagina ${i}/${pageCount}`,
      A4_LANDSCAPE.w / 2,
      A4_LANDSCAPE.h - 5,
      { align: "center" }
    );
  }

  pdf.save(`pharma-control-${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
