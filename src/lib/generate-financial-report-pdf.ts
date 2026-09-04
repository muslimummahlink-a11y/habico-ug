import jsPDF from "jspdf";
import {
  BRAND, PDF_MARGIN, headerBand, footerBand, loadLogo, drawWatermark,
  sectionTitle, detailRow, brandedCard, amountBox,
  hexToRgb,
} from "./pdf-brand";

export interface FinancialReportPdfInput {
  date: string;
  landlordName: string;
  landlordTel: string;
  propertyName: string;
  propertyLocation: string;
  tenantContext: string;
  totalRentCollected: number;
  totalRentDue: number;
  balance: number;
  companyFee: number;
  landlordShare: number;
  pendingToLandlord: number;
  paymentPeriods: {
    title: string;
    totalPaid: number;
    balance: number;
    payments: { date: string; amount: number; status: string }[];
  }[];
}

export async function generateFinancialReportPdf(data: FinancialReportPdfInput): Promise<jsPDF> {
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

  // ── Title ──
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text("FINANCIAL REPORT", cx, y);
  y += 3;
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(0.8);
  pdf.line(cx - 40, y, cx + 40, y);
  y += 10;

  // ── Date badge ──
  pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
  pdf.roundedRect(PDF_MARGIN, y - 6, 70, 8, 2, 2, "F");
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text(`DATE: ${data.date}`, PDF_MARGIN + 5, y - 1);
  y += 12;

  // ── Landlord / Property card ──
  const cardW = pageW - PDF_MARGIN * 2;
  brandedCard(pdf, PDF_MARGIN, y, cardW, 28);
  let ry = y + 5;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("TO:", PDF_MARGIN + 8, ry);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(data.landlordName, PDF_MARGIN + 22, ry);
  ry += 6;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Tel:", PDF_MARGIN + 8, ry);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(data.landlordTel, PDF_MARGIN + 22, ry);
  ry += 6;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Property:", PDF_MARGIN + 8, ry);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  pdf.text(`${data.propertyName} — ${data.propertyLocation}`, PDF_MARGIN + 22, ry);

  // Amount box on right of card
  amountBox(
    pdf, "RENT COLLECTED",
    `UGX ${data.totalRentCollected.toLocaleString()}`,
    PDF_MARGIN + cardW - 68, y + 14, 60, BRAND.success,
  );

  y = y + cardH + 10;

  // ── Summary grid ──
  if (data.tenantContext) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    const lines = pdf.splitTextToSize(data.tenantContext, pageW - PDF_MARGIN * 2);
    pdf.text(lines, PDF_MARGIN, y);
    y += lines.length * 4 + 6;
  }

  // ── Summary stats ──
  const statW = (pageW - PDF_MARGIN * 2 - 12) / 3;
  const statY = y;
  const statH = 22;

  const stats = [
    { label: "TOTAL RENT DUE", value: `UGX ${data.totalRentDue.toLocaleString()}`, color: BRAND.primary },
    { label: "TOTAL COLLECTED", value: `UGX ${data.totalRentCollected.toLocaleString()}`, color: BRAND.success },
    { label: "BALANCE", value: `UGX ${data.balance.toLocaleString()}`, color: data.balance > 0 ? BRAND.danger : BRAND.success },
  ];

  for (let i = 0; i < stats.length; i++) {
    const sx = PDF_MARGIN + i * (statW + 6);
    pdf.setFillColor(...hexToRgb(stats[i].color));
    pdf.roundedRect(sx, statY, statW, statH, 3, 3, "F");
    pdf.setFontSize(6);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.white));
    pdf.text(stats[i].label, sx + 4, statY + 7);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(stats[i].value, sx + 4, statY + 17);
  }
  y = statY + statH + 10;

  // ── Payment periods ──
  for (const period of data.paymentPeriods) {
    if (y > pageH - 50) {
      pdf.addPage();
      headerBand(pdf, pageW);
      y = 20;
    }

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.primary));
    pdf.text(period.title, PDF_MARGIN, y);
    y += 2;
    pdf.setDrawColor(...hexToRgb(BRAND.border));
    pdf.setLineWidth(0.3);
    pdf.line(PDF_MARGIN, y, pageW - PDF_MARGIN, y);
    y += 6;

    const tColW = [pageW - PDF_MARGIN * 2 - 80, 35, 35];
    const tX = PDF_MARGIN;

    pdf.setFillColor(...hexToRgb(BRAND.primary));
    pdf.rect(tX, y - 4, tColW[0] + tColW[1] + tColW[2], 8, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.white));
    pdf.text("Date", tX + 4, y + 1);
    pdf.text("Amount", tX + tColW[0] + tColW[1] - 4, y + 1, { align: "right" });
    pdf.text("Status", tX + tColW[0] + tColW[1] + tColW[2] - 4, y + 1, { align: "right" });
    y += 8;

    if (period.payments.length === 0) {
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text("No payments recorded for this period.", PDF_MARGIN + 4, y + 1);
      y += 8;
    } else {
      for (let i = 0; i < period.payments.length; i++) {
        if (i % 2 === 1) {
          pdf.setFillColor(...hexToRgb(BRAND.tableAlt));
          pdf.rect(tX, y - 4, tColW[0] + tColW[1] + tColW[2], 8, "F");
        }
        const p = period.payments[i];
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.text));
        pdf.text(p.date, tX + 4, y + 1);
        pdf.setFont("helvetica", "bold");
        pdf.text(`UGX ${p.amount.toLocaleString()}`, tX + tColW[0] + tColW[1] - 4, y + 1, { align: "right" });
        const statusColor = p.status === "completed" || p.status === "paid" ? BRAND.success : BRAND.danger;
        pdf.setTextColor(...hexToRgb(statusColor));
        pdf.text(p.status, tX + tColW[0] + tColW[1] + tColW[2] - 4, y + 1, { align: "right" });
        y += 8;
      }
    }

    pdf.setDrawColor(...hexToRgb(BRAND.border));
    pdf.setLineWidth(0.3);
    pdf.line(tX, y, tX + tColW[0] + tColW[1] + tColW[2], y);
    y += 2;
    pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
    pdf.rect(tX, y - 4, tColW[0] + tColW[1] + tColW[2], 8, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.white));
    pdf.text("Total Paid", tX + 4, y + 1);
    pdf.text(`UGX ${period.totalPaid.toLocaleString()}`, tX + tColW[0] + tColW[1] + tColW[2] - 4, y + 1, { align: "right" });
    y += 4;
    pdf.setFillColor(...hexToRgb(BRAND.bg));
    pdf.rect(tX, y - 4, tColW[0] + tColW[1] + tColW[2], 8, "F");
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(period.balance > 0 ? BRAND.danger : BRAND.success));
    pdf.text("Balance", tX + 4, y + 1);
    pdf.text(`UGX ${period.balance.toLocaleString()}`, tX + tColW[0] + tColW[1] + tColW[2] - 4, y + 1, { align: "right" });
    y += 12;
  }

  // ── Commission breakdown ──
  if (data.totalRentCollected > 0) {
    y = Math.max(y, 170);

    if (y > pageH - 60) {
      pdf.addPage();
      headerBand(pdf, pageW);
      y = 20;
    }

    sectionTitle(pdf, "Commission Breakdown", y, pageW);
    y += 10;

    const commW = (pageW - PDF_MARGIN * 2 - 8) / 2;
    const commItems = [
      { label: "Total Collected", value: `UGX ${data.totalRentCollected.toLocaleString()}`, color: BRAND.primary },
      { label: "Landlord Share (66%)", value: `UGX ${data.landlordShare.toLocaleString()}`, color: BRAND.success },
      { label: "Company Fee (9%)", value: `UGX ${data.companyFee.toLocaleString()}`, color: BRAND.accent },
      { label: "Pending to Landlord", value: `UGX ${data.pendingToLandlord.toLocaleString()}`, color: data.pendingToLandlord > 0 ? BRAND.danger : BRAND.success },
    ];

    for (let i = 0; i < commItems.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx2 = PDF_MARGIN + col * (commW + 8);
      const cy = y + row * 14;
      pdf.setFillColor(...hexToRgb(BRAND.white));
      pdf.setDrawColor(...hexToRgb(BRAND.border));
      pdf.setLineWidth(0.3);
      pdf.roundedRect(cx2, cy - 4, commW, 12, 2, 2, "FD");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text(commItems[i].label, cx2 + 6, cy + 1);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(commItems[i].color));
      pdf.text(commItems[i].value, cx2 + 6, cy + 10);
    }
    y += 36;

    // ── Thank you ──
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("Thank you for your continued partnership.", cx, y, { align: "center" });

    // ── Signatory ──
    y += 16;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    pdf.text("Yours sincerely,", PDF_MARGIN, y);
    y += 20;
    pdf.setDrawColor(...hexToRgb(BRAND.border));
    pdf.setLineWidth(0.5);
    pdf.line(PDF_MARGIN, y, PDF_MARGIN + 60, y);
    y += 4;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.primary));
    pdf.text("Nabbosa Leila", PDF_MARGIN, y);
    y += 4;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("For HABICO PROPERTY MANAGERS LIMITED", PDF_MARGIN, y);
  }

  // ── Footer ──
  footerBand(pdf, pageW, pageH);

  return pdf;
}

export function generateFinancialReportPdfBase64(data: FinancialReportPdfInput): string {
  const pdf = generateFinancialReportPdf(data);
  const buf = Buffer.from(pdf.output("arraybuffer"));
  return buf.toString("base64");
}

export function generateFinancialReportPdfBlob(data: FinancialReportPdfInput): Blob {
  const pdf = generateFinancialReportPdf(data);
  return new Blob([pdf.output("arraybuffer")], { type: "application/pdf" });
}
