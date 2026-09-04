import jsPDF from "jspdf";
import {
  BRAND, PDF_MARGIN, headerBand, footerBand, loadLogo, drawWatermark,
  sectionTitle, detailRow, amountBox, brandedCard,
  hexToRgb,
} from "./pdf-brand";

export interface ReceiptPdfInput {
  receiptNo: string;
  date: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  periodLabel: string;
  paymentType: string;
  method: string;
  amount: number;
}

const typeLabel: Record<string, string> = {
  rent: "Rent", deposit: "Deposit",
  late_fee: "Late Fee", utility: "Utility",
};

async function buildReceiptPdf(input: ReceiptPdfInput): Promise<jsPDF> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cx = pageW / 2;
  let y: number;

  const logoDataUrl = await loadLogo();

  // ── Page border ──
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.rect(5, 5, pageW - 10, pageH - 10);

  // ── Watermark ──
  drawWatermark(pdf, pageW, pageH, logoDataUrl);

  // ── Header band ──
  headerBand(pdf, pageW, logoDataUrl);
  y = 48;

  // ── "Official Receipt" ribbon ──
  const ribbonW = 70;
  const ribbonX = cx - ribbonW / 2;
  pdf.setFillColor(...hexToRgb(BRAND.accent));
  pdf.roundedRect(ribbonX, y - 8, ribbonW, 10, 2, 2, "F");
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text("OFFICIAL RECEIPT", cx, y - 1, { align: "center" });
  y += 10;

  // ── Title ──
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text("PAYMENT RECEIPT", cx, y);
  y += 3;
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(0.8);
  pdf.line(cx - 35, y, cx + 35, y);
  y += 10;

  // ── Receipt # badge ──
  pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
  pdf.roundedRect(PDF_MARGIN, y - 6, 65, 10, 2, 2, "F");
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text("RECEIPT #", PDF_MARGIN + 5, y - 1);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(input.receiptNo.toUpperCase(), PDF_MARGIN + 5, y + 4);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text(input.date, pageW - PDF_MARGIN, y + 2, { align: "right" });
  y += 14;

  // ── Detail card ──
  const cardW = pageW - PDF_MARGIN * 2;
  const cardH = 52;
  brandedCard(pdf, PDF_MARGIN, y, cardW, cardH);
  y += 6;

  const rows: [string, string][] = [
    ["Tenant", input.tenantName],
    ["Property", `${input.propertyName} · ${input.unitNumber}`],
    ["Period", input.periodLabel],
    ["Type", typeLabel[input.paymentType] ?? "Payment"],
    ["Method", input.method.replace(/_/g, " ")],
  ];
  const col1W = 28;
  let ry = y;
  pdf.setFontSize(8);
  for (const [label, value] of rows) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text(label, PDF_MARGIN + 8, ry + 1);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    pdf.text(value, PDF_MARGIN + 8 + col1W, ry + 1);
    ry += 8;
  }

  // ── Amount box (right side of card) ──
  const amountX = PDF_MARGIN + cardW - 72;
  const amountY = y + (cardH - 24) / 2;
  amountBox(
    pdf, "AMOUNT PAID",
    `UGX ${input.amount.toLocaleString()}`,
    amountX, amountY + 6, 64, BRAND.success,
  );

  y = y + cardH + 10;

  // ── Payment breakdown table ──
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text("Payment Breakdown", PDF_MARGIN, y);
  y += 2;
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, pageW - PDF_MARGIN, y);
  y += 6;

  const tHead = ["Description", "Amount"];
  const tColW = [pageW - PDF_MARGIN * 2 - 55, 45];
  const tX = PDF_MARGIN;

  pdf.setFillColor(...hexToRgb(BRAND.primary));
  pdf.rect(tX, y - 4, tColW[0] + tColW[1], 8, "F");
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text(tHead[0], tX + 4, y + 1);
  pdf.text(tHead[1], tX + tColW[0] + tColW[1] - 4, y + 1, { align: "right" });
  y += 8;

  const tRows: [string, number][] = [
    [`${typeLabel[input.paymentType] ?? "Payment"} — ${input.periodLabel}`, input.amount],
  ];
  for (let i = 0; i < tRows.length; i++) {
    if (i % 2 === 1) {
      pdf.setFillColor(...hexToRgb(BRAND.tableAlt));
      pdf.rect(tX, y - 4, tColW[0] + tColW[1], 8, "F");
    }
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    pdf.text(tRows[i][0], tX + 4, y + 1);
    pdf.setFont("helvetica", "bold");
    pdf.text(`UGX ${tRows[i][1].toLocaleString()}`, tX + tColW[0] + tColW[1] - 4, y + 1, { align: "right" });
    y += 8;
  }

  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(tX, y, tX + tColW[0] + tColW[1], y);
  y += 2;
  pdf.setFillColor(...hexToRgb(BRAND.success));
  pdf.rect(tX, y - 4, tColW[0] + tColW[1], 8, "F");
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text("Total Paid", tX + 4, y + 1);
  pdf.text(`UGX ${input.amount.toLocaleString()}`, tX + tColW[0] + tColW[1] - 4, y + 1, { align: "right" });
  y += 14;

  // ── Thank you ──
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Thank you for your payment.", cx, y, { align: "center" });

  // ── Footer ──
  footerBand(pdf, pageW, pageH);

  return pdf;
}

export async function generateReceiptPdfBase64(input: ReceiptPdfInput): Promise<string> {
  const pdf = await buildReceiptPdf(input);
  const buf = Buffer.from(pdf.output("arraybuffer"));
  return buf.toString("base64");
}

export async function generateReceiptPdfBlob(input: ReceiptPdfInput): Promise<Blob> {
  const pdf = await buildReceiptPdf(input);
  return new Blob([pdf.output("arraybuffer")], { type: "application/pdf" });
}
