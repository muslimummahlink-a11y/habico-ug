import jsPDF from "jspdf";
import { BRAND, hexToRgb, PDF_MARGIN, CONTENT_WIDTH, loadLogo, drawWatermark } from "@/lib/pdf-brand";

export interface VendorPaymentReceipt {
  receipt_number: string;
  payee_name: string;
  payee_phone?: string | null;
  payee_email?: string | null;
  payee_address?: string | null;
  description: string;
  category: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  payment_date: string;
  project_name?: string | null;
  notes?: string | null;
}

const UGX = (n: number) => `UGX ${n.toLocaleString()}`;

const methodLabels: Record<string, string> = {
  cash: "Cash Payment",
  bank_transfer: "Bank Transfer",
  mobile_money: "Mobile Money",
  cheque: "Cheque",
  card: "Card Payment",
  other: "Other",
};

export async function generateVendorPaymentReceiptPdf(data: VendorPaymentReceipt): Promise<jsPDF> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const logoDataUrl = await loadLogo();
  drawWatermark(pdf, pageW, pageH, logoDataUrl);

  // Header
  const h = 36;
  pdf.setFillColor(...hexToRgb(BRAND.headerBg));
  pdf.rect(0, 0, pageW, h, "F");

  if (logoDataUrl) {
    try { pdf.addImage(logoDataUrl, "PNG", PDF_MARGIN, 4, 28, 28); } catch {}
  }

  const textX = logoDataUrl ? PDF_MARGIN + 34 : PDF_MARGIN;
  pdf.setFontSize(16);
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.setFont("helvetica", "bold");
  pdf.text("HABICO PROPERTY MANAGERS", textX, 14);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.muted));
  pdf.text("PAYMENT RECEIPT", textX, 22);
  pdf.setFontSize(7);
  pdf.text("Basiima Building, 2nd Floor Room C03, Kampala", textX, 28);
  pdf.text("0756742220 | 0702239607 | habicopropertymanagers@gmail.com", textX, 32);
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(1.5);
  pdf.line(0, h, pageW, h);

  let y = h + 10;

  // Receipt number and date (top right)
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("RECEIPT NO.", pageW - PDF_MARGIN, y, { align: "right" });
  y += 4;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text(data.receipt_number, pageW - PDF_MARGIN, y, { align: "right" });
  y += 5;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("DATE", pageW - PDF_MARGIN, y, { align: "right" });
  y += 4;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  const dateStr = new Date(data.payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  pdf.text(dateStr, pageW - PDF_MARGIN - 20, y, { align: "right" });
  y += 10;

  // PAYMENT RECEIVED FROM box
  pdf.setFillColor(...hexToRgb(BRAND.tableAlt));
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.roundedRect(PDF_MARGIN, y, CONTENT_WIDTH, 36, 2, 2, "FD");

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("PAID TO", PDF_MARGIN + 5, y + 6);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(data.payee_name, PDF_MARGIN + 5, y + 14);

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  let detailY = y + 20;
  if (data.payee_phone) { pdf.text(`Phone: ${data.payee_phone}`, PDF_MARGIN + 5, detailY); detailY += 4; }
  if (data.payee_email) { pdf.text(`Email: ${data.payee_email}`, PDF_MARGIN + 5, detailY); }
  if (data.payee_address) { pdf.text(`Address: ${data.payee_address}`, PDF_MARGIN + 100, y + 20); }

  y += 42;

  // Amount box
  const amountY = y;
  pdf.setFillColor(...hexToRgb(BRAND.accent));
  pdf.roundedRect(PDF_MARGIN, y, CONTENT_WIDTH, 20, 3, 3, "F");
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text("AMOUNT PAID", PDF_MARGIN + 8, y + 8);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(UGX(data.amount), PDF_MARGIN + 8, y + 16);
  y += 26;

  // Payment details grid
  const leftX = PDF_MARGIN;
  const rightX = PDF_MARGIN + CONTENT_WIDTH / 2 + 5;
  const labelColor = hexToRgb(BRAND.textMuted);
  const valueColor = hexToRgb(BRAND.text);

  const drawDetail = (label: string, value: string, x: number, rowY: number) => {
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...labelColor);
    pdf.text(label, x, rowY);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...valueColor);
    pdf.text(value || "—", x + 30, rowY);
  };

  drawDetail("Description:", data.description, leftX, y);
  drawDetail("Category:", data.category.replace("_", " "), rightX, y);
  y += 6;
  drawDetail("Payment Method:", methodLabels[data.payment_method] || data.payment_method, leftX, y);
  drawDetail("Reference:", data.reference_number || "—", rightX, y);
  y += 6;
  if (data.project_name) {
    drawDetail("Project:", data.project_name, leftX, y);
    y += 6;
  }

  y += 4;

  // Notes
  if (data.notes) {
    pdf.setFillColor(...hexToRgb(BRAND.bg));
    pdf.roundedRect(PDF_MARGIN, y, CONTENT_WIDTH, 16, 2, 2, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...labelColor);
    pdf.text("Notes:", PDF_MARGIN + 4, y + 5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...valueColor);
    const noteLines = pdf.splitTextToSize(data.notes, CONTENT_WIDTH - 10);
    pdf.text(noteLines.slice(0, 2), PDF_MARGIN + 4, y + 10);
    y += 20;
  }

  // Divider
  y += 4;
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, pageW - PDF_MARGIN, y);
  y += 8;

  // Authorization section
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("AUTHORIZED BY", PDF_MARGIN, y);
  y += 18;

  // Signature lines — three columns
  const sigW = 50;
  const col2X = PDF_MARGIN + CONTENT_WIDTH / 3 + 5;
  const col3X = PDF_MARGIN + (CONTENT_WIDTH / 3) * 2 + 10;
  pdf.setDrawColor(...hexToRgb(BRAND.text));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, PDF_MARGIN + sigW, y);
  pdf.line(col2X, y, col2X + sigW, y);
  pdf.line(col3X, y, col3X + sigW, y);
  y += 4;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Director's Signature & Date", PDF_MARGIN, y);
  pdf.text("Finance Officer's Signature & Date", col2X, y);
  pdf.text("Received By (Signature & Date)", col3X, y);

  // Footer
  const footerY = pageH - 18;
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, footerY, pageW - PDF_MARGIN, footerY);
  pdf.setFontSize(6);
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.setFont("helvetica", "normal");
  pdf.text("This is a computer-generated receipt. No signature required unless above.", PDF_MARGIN, footerY + 5);
  pdf.text(`© ${new Date().getFullYear()} Habico Property Managers Ltd.`, PDF_MARGIN, footerY + 9);

  return pdf;
}

export async function downloadVendorPaymentReceiptPdf(data: VendorPaymentReceipt) {
  const pdf = await generateVendorPaymentReceiptPdf(data);
  const safeName = (data.payee_name || "payee").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  pdf.save(`receipt-${data.receipt_number}-${safeName}.pdf`);
}
