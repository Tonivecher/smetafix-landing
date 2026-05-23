import type { jsPDF as jsPDFType } from "jspdf";

export async function generatePdfReport(element: HTMLElement, rawFileName: string): Promise<void> {
  if (typeof window === "undefined" || !element) return;

  // Dynamically import to ensure no SSR compilation issues
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  // Determine standard file name format
  const cleanFileName = rawFileName.replace(/\.[^/.]+$/, ""); // strip extension
  const finalPdfName = `smetafix_report_${cleanFileName}.pdf`;

  // Capture canvas with high density (scale: 2) for crystal clear vector text rendering
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  
  // Initialize standard A4 PDF document (A4 in points: 595.28 x 841.89)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  }) as jsPDFType;

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Match proportions to A4 width
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = imgWidth / pdfWidth;
  const renderHeight = imgHeight / ratio;

  let heightLeft = renderHeight;
  let position = 0;

  // Add the first page
  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, renderHeight, undefined, "FAST");
  heightLeft -= pdfHeight;

  // If the document is longer than one A4 page, dynamically slice it onto consecutive pages
  while (heightLeft > 0) {
    position = heightLeft - renderHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, renderHeight, undefined, "FAST");
    heightLeft -= pdfHeight;
  }

  // Download PDF file
  pdf.save(finalPdfName);
}
