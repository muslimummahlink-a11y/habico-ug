import jsPDF from "jspdf";
import { BRAND, hexToRgb, PDF_MARGIN, CONTENT_WIDTH, loadLogo, drawWatermark } from "@/lib/pdf-brand";

export interface QuotationPdfItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface QuotationPdfData {
  quotation_number: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  title: string;
  description?: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  valid_until?: string | null;
  notes?: string | null;
  terms_and_conditions?: string | null;
  items: QuotationPdfItem[];
  created_at: string;
}

const UGX = (n: number) => `UGX ${n.toLocaleString()}`;

function drawHeader(pdf: jsPDF, pageW: number, logoDataUri: string | null) {
  const h = 36;
  pdf.setFillColor(...hexToRgb(BRAND.headerBg));
  pdf.rect(0, 0, pageW, h, "F");

  if (logoDataUri) {
    try { pdf.addImage(logoDataUri, "PNG", PDF_MARGIN, 4, 28, 28); } catch {}
  }

  const textX = logoDataUri ? PDF_MARGIN + 34 : PDF_MARGIN;
  pdf.setFontSize(16);
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.setFont("helvetica", "bold");
  pdf.text("HABICO", textX, 16);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("PROPERTY MANAGERS", textX, 24);
  pdf.setFontSize(6);
  pdf.setTextColor(...hexToRgb(BRAND.muted));
  pdf.text("KAMPALA, UGANDA", textX, 30);
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(1.5);
  pdf.line(0, h, pageW, h);
  return h;
}

function drawFooter(pdf: jsPDF, pageW: number, pageH: number) {
  const y = pageH - 20;
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, pageW - PDF_MARGIN, y);
  pdf.setFontSize(6);
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.setFont("helvetica", "normal");
  pdf.text("Basiima Building, 2nd Floor Room C03, Kampala", PDF_MARGIN, y + 5);
  pdf.text("0756742220 | 0702239607 · habicopropertymanagers@gmail.com", PDF_MARGIN, y + 9);
  pdf.text(`© ${new Date().getFullYear()} Habico Property Managers Ltd. All rights reserved.`, PDF_MARGIN, y + 13);
}

function statusColor(status: string): [number, number, number] {
  switch (status) {
    case "accepted": return hexToRgb(BRAND.success);
    case "rejected": return hexToRgb(BRAND.danger);
    case "sent": return hexToRgb(BRAND.accent);
    default: return hexToRgb(BRAND.muted);
  }
}

export async function generateQuotationPdf(data: QuotationPdfData): Promise<jsPDF> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = CONTENT_WIDTH;

  const logoDataUri = await loadLogo();
  drawWatermark(pdf, pageW, pageH, logoDataUri);
  let y = drawHeader(pdf, pageW, logoDataUri) + 8;

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text("QUOTATION", PDF_MARGIN, y);
  y += 8;

  // Status badge
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  const sc = statusColor(data.status);
  const statusText = data.status.toUpperCase();
  const badgeW = pdf.getTextWidth(statusText) + 10;
  pdf.setFillColor(...hexToRgb(BRAND.white));
  pdf.setDrawColor(...sc);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(PDF_MARGIN, y - 5, badgeW, 7, 2, 2, "D");
  pdf.setTextColor(...sc);
  pdf.text(statusText, PDF_MARGIN + 5, y);
  y += 12;

  // Quotation number + date
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Quotation #", PDF_MARGIN, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(data.quotation_number, PDF_MARGIN + 30, y);

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Date", PDF_MARGIN + 100, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(new Date(data.created_at).toLocaleDateString("en-GB"), PDF_MARGIN + 112, y);
  y += 6;

  if (data.valid_until) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("Valid Until", PDF_MARGIN, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    pdf.text(data.valid_until, PDF_MARGIN + 30, y);
    y += 6;
  }

  y += 4;

  // Client info card
  const cardY = y;
  pdf.setFillColor(...hexToRgb(BRAND.tableAlt));
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(PDF_MARGIN, cardY, contentW, 24, 2, 2, "FD");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("BILL TO", PDF_MARGIN + 4, cardY + 5);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(data.client_name, PDF_MARGIN + 4, cardY + 11);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  if (data.client_email) pdf.text(data.client_email, PDF_MARGIN + 4, cardY + 16);
  if (data.client_phone) pdf.text(data.client_phone, PDF_MARGIN + 4, cardY + 21);

  y = cardY + 30;

  // Project title
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text(data.title, PDF_MARGIN, y);
  y += 6;

  if (data.description) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    const descLines = pdf.splitTextToSize(data.description, contentW);
    pdf.text(descLines, PDF_MARGIN, y);
    y += descLines.length * 4 + 2;
  }

  y += 4;

  // Line items table
  const colWidths = [8, 82, 18, 28, 34] as const;
  const headers = ["#", "Description", "Qty", "Unit Price", "Amount"];
  const tableX = PDF_MARGIN;

  // Table header
  pdf.setFillColor(...hexToRgb(BRAND.headerBg));
  pdf.rect(tableX, y, contentW, 8, "F");
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  let cx = tableX;
  headers.forEach((h, i) => {
    pdf.text(h, cx + 2, y + 5);
    cx += colWidths[i];
  });
  y += 8;

  // Table rows
  data.items.forEach((item, idx) => {
    if (y > pageH - 40) {
      drawFooter(pdf, pageW, pageH);
      pdf.addPage();
      y = 10;
    }

    if (idx % 2 === 0) {
      pdf.setFillColor(...hexToRgb(BRAND.tableAlt));
      pdf.rect(tableX, y, contentW, 7, "F");
    }

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    cx = tableX;
    pdf.text(String(idx + 1), cx + 2, y + 4.5);
    cx += colWidths[0];
    pdf.text(item.description, cx + 2, y + 4.5);
    cx += colWidths[1];
    pdf.text(String(item.quantity), cx + 2, y + 4.5);
    cx += colWidths[2];
    pdf.text(UGX(item.unit_price), cx + 2, y + 4.5);
    cx += colWidths[3];
    pdf.setFont("helvetica", "bold");
    pdf.text(UGX(item.amount), cx + 2, y + 4.5);

    y += 7;
  });

  // Table border bottom
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(tableX, y, tableX + contentW, y);
  y += 6;

  // Totals
  const totalsX = tableX + contentW - 60;
  const totalsLabelW = 30;
  const totalsValW = 28;

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Subtotal", totalsX, y);
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(UGX(data.subtotal), totalsX + totalsLabelW, y);
  y += 5;

  if (data.discount_amount > 0) {
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("Discount", totalsX, y);
    pdf.setTextColor(...hexToRgb(BRAND.danger));
    pdf.text(`-${UGX(data.discount_amount)}`, totalsX + totalsLabelW, y);
    y += 5;
  }

  if (data.tax_rate > 0) {
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text(`Tax (${data.tax_rate}%)`, totalsX, y);
    pdf.setTextColor(...hexToRgb(BRAND.text));
    pdf.text(UGX(data.tax_amount), totalsX + totalsLabelW, y);
    y += 5;
  }

  // Total line
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(0.8);
  pdf.line(totalsX, y, totalsX + 60, y);
  y += 5;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text("TOTAL", totalsX, y);
  pdf.setTextColor(...hexToRgb(BRAND.accent));
  pdf.text(UGX(data.total_amount), totalsX + totalsLabelW, y);
  y += 12;

  // Notes
  if (data.notes) {
    if (y > pageH - 50) { drawFooter(pdf, pageW, pageH); pdf.addPage(); y = 10; }
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("Notes", PDF_MARGIN, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    const noteLines = pdf.splitTextToSize(data.notes, contentW);
    pdf.text(noteLines, PDF_MARGIN, y);
    y += noteLines.length * 4 + 4;
  }

  // Terms & Conditions
  if (data.terms_and_conditions) {
    if (y > pageH - 50) { drawFooter(pdf, pageW, pageH); pdf.addPage(); y = 10; }
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("Terms & Conditions", PDF_MARGIN, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    const tcLines = pdf.splitTextToSize(data.terms_and_conditions, contentW);
    pdf.text(tcLines, PDF_MARGIN, y);
  }

  drawFooter(pdf, pageW, pageH);

  return pdf;
}

export async function downloadQuotationPdf(data: QuotationPdfData) {
  const pdf = await generateQuotationPdf(data);
  const safeName = (data.client_name || "client").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  pdf.save(`quotation-${data.quotation_number || "draft"}-${safeName}.pdf`);
}
