import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportReportToPDF({
  title = "Business Report",
  businessName = "Royalion",
  period = "All Time",
  columns = [],
  data = [],
  summary = []
}) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 45, 90); // Dark Primary Blue
  doc.rect(0, 0, 210, 15, "F");

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(businessName.toUpperCase(), 14, 10);

  // Report Title & Period
  doc.setFontSize(16);
  doc.setTextColor(15, 45, 90);
  doc.text(title, 14, 26);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Date Range: ${period}   |   Exported On: ${new Date().toLocaleString()}`, 14, 33);

  let currentY = 40;

  // Summary Metrics Section (if provided)
  if (summary && summary.length > 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 14, 2, 2, "FD");

    doc.setFontSize(summary.length > 3 ? 8 : 9);
    const colWidth = 182 / summary.length;
    summary.forEach((s, i) => {
      const xOffset = 14 + (i * colWidth) + 4;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text(`${s.label}: `, xOffset, currentY + 9);
      const labelWidth = doc.getTextWidth(`${s.label}: `);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 45, 90);
      doc.text(`${s.value}`, xOffset + labelWidth, currentY + 9);
    });

    currentY += 20;
  }

  // Data Table
  autoTable(doc, {
    startY: currentY,
    head: [columns],
    body: data,
    theme: "striped",
    headStyles: {
      fillColor: [15, 45, 90],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak"
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 15, left: 14, right: 14 }
  });

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} — ${businessName}`, 14, 287);
  }

  // Save File
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
