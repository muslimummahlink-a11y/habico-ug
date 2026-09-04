import { Resend } from "resend";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^RESEND_API_KEY=(.*)$/);
    if (m) return m[1].trim();
  }
  return undefined;
}

// ── Brand helpers ──
const BRAND = {
  primary: "#1e293b", primaryLight: "#334155", accent: "#f59e0b",
  success: "#059669", danger: "#dc2626", muted: "#94a3b8",
  bg: "#f8fafc", border: "#e2e8f0", text: "#1e293b", textMuted: "#64748b",
  white: "#ffffff", headerBg: "#0f172a", tableAlt: "#f1f5f9",
};
const PM = 15;

function hexRgb(h) {
  const v = h.replace("#","");
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)];
}

function headerBand(pdf, pw) {
  const h = 36;
  pdf.setFillColor(...hexRgb(BRAND.headerBg));
  pdf.rect(0, 0, pw, h, "F");
  pdf.setFontSize(16); pdf.setFont("helvetica","bold");
  pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("HABICO", PM, 16);
  pdf.setFontSize(7); pdf.setFont("helvetica","normal");
  pdf.text("PROPERTY MANAGERS", PM, 24);
  pdf.setFontSize(6); pdf.setTextColor(...hexRgb(BRAND.muted));
  pdf.text("KAMPALA, UGANDA", PM, 30);
  pdf.setDrawColor(...hexRgb(BRAND.accent)); pdf.setLineWidth(1.5);
  pdf.line(0, h, pw, h);
}

function footerBand(pdf, pw, ph) {
  const y = ph - 20;
  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.line(PM, y, pw - PM, y);
  pdf.setFontSize(6); pdf.setTextColor(...hexRgb(BRAND.textMuted)); pdf.setFont("helvetica","normal");
  pdf.text("Basiima Building, 2nd Floor Room C03, Kampala", PM, y + 5);
  pdf.text("0756742220 | 0702239607 · habicopropertymanagers@gmail.com", PM, y + 9);
  pdf.text("Tax ID: URA-TIN-123456789", PM, y + 13);
}

// ── Build branded receipt PDF ──
async function buildBrandedReceiptPdf() {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p","mm","a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const cx = pw / 2;
  let y;

  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.rect(5, 5, pw - 10, ph - 10);
  headerBand(pdf, pw);
  y = 48;

  const ribbonW = 70;
  pdf.setFillColor(...hexRgb(BRAND.accent));
  pdf.roundedRect(cx - ribbonW/2, y - 8, ribbonW, 10, 2, 2, "F");
  pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("OFFICIAL RECEIPT", cx, y - 1, { align: "center" });
  y += 10;

  pdf.setFontSize(22); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("PAYMENT RECEIPT", cx, y);
  y += 3;
  pdf.setDrawColor(...hexRgb(BRAND.accent)); pdf.setLineWidth(0.8);
  pdf.line(cx - 35, y, cx + 35, y);
  y += 10;

  pdf.setFillColor(...hexRgb(BRAND.primaryLight));
  pdf.roundedRect(PM, y - 6, 65, 10, 2, 2, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("RECEIPT #", PM + 5, y - 1);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(9);
  pdf.text("SAMPLE-001", PM + 5, y + 4);
  pdf.setFontSize(7); pdf.setFont("helvetica","normal");
  pdf.setTextColor(...hexRgb(BRAND.textMuted));
  const today = new Date().toISOString().slice(0,10);
  pdf.text(today, pw - PM, y + 2, { align: "right" });
  y += 14;

  const cardW = pw - PM * 2;
  pdf.setFillColor(...hexRgb(BRAND.white));
  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.5);
  pdf.roundedRect(PM, y, cardW, 44, 2, 2, "FD");
  y += 6;

  const rows = [
    ["Tenant", "Nama Safari"],
    ["Property", "Nama Holdings Building · Unit A1"],
    ["Period", "July 2026"],
    ["Type", "Rent"],
    ["Method", "Mobile Money"],
  ];
  let ry = y;
  pdf.setFontSize(8);
  for (const [label, value] of rows) {
    pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
    pdf.text(label, PM + 8, ry + 1);
    pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
    pdf.text(value, PM + 8 + 28, ry + 1);
    ry += 8;
  }

  const ax = PM + cardW - 72;
  pdf.setFillColor(...hexRgb(BRAND.success));
  pdf.roundedRect(ax, y + 8, 64, 16, 3, 3, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("AMOUNT PAID", ax + 6, y + 13);
  pdf.setFontSize(11); pdf.setFont("helvetica","bold");
  pdf.text("UGX 1,500,000", ax + 6, y + 20);
  y = y + 44 + 10;

  pdf.setFontSize(10); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("Payment Breakdown", PM, y); y += 2;
  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.line(PM, y, pw - PM, y); y += 6;

  const tX = PM, tCW0 = pw - PM * 2 - 55, tCW1 = 55;
  pdf.setFillColor(...hexRgb(BRAND.primary));
  pdf.rect(tX, y - 4, tCW0 + tCW1, 8, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("Description", tX + 4, y + 1);
  pdf.text("Amount", tX + tCW0 + tCW1 - 4, y + 1, { align: "right" });
  y += 8;

  pdf.setFontSize(8); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  pdf.text("Rent — July 2026", tX + 4, y + 1);
  pdf.setFont("helvetica","bold");
  pdf.text("UGX 1,500,000", tX + tCW0 + tCW1 - 4, y + 1, { align: "right" });
  y += 8;

  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.line(tX, y, tX + tCW0 + tCW1, y); y += 2;
  pdf.setFillColor(...hexRgb(BRAND.success));
  pdf.rect(tX, y - 4, tCW0 + tCW1, 8, "F");
  pdf.setFontSize(9); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("Total Paid", tX + 4, y + 1);
  pdf.text("UGX 1,500,000", tX + tCW0 + tCW1 - 4, y + 1, { align: "right" });
  y += 14;

  pdf.setFontSize(7); pdf.setFont("helvetica","italic"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("Thank you for your payment.", cx, y, { align: "center" });
  footerBand(pdf, pw, ph);

  return Buffer.from(pdf.output("arraybuffer")).toString("base64");
}

// ── Build branded financial report PDF ──
async function buildBrandedReportPdf() {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p","mm","a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const cx = pw / 2;
  let y;

  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.rect(5, 5, pw - 10, ph - 10);
  headerBand(pdf, pw);
  y = 48;

  pdf.setFontSize(22); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("FINANCIAL REPORT", cx, y); y += 3;
  pdf.setDrawColor(...hexRgb(BRAND.accent)); pdf.setLineWidth(0.8);
  pdf.line(cx - 40, y, cx + 40, y); y += 10;

  pdf.setFillColor(...hexRgb(BRAND.primaryLight));
  pdf.roundedRect(PM, y - 6, 70, 8, 2, 2, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text(`DATE: ${new Date().toISOString().slice(0,10)}`, PM + 5, y - 1);
  y += 12;

  pdf.setFillColor(...hexRgb(BRAND.white)); pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.5);
  pdf.roundedRect(PM, y, pw - PM * 2, 24, 2, 2, "FD");
  let ry = y + 5;
  pdf.setFontSize(8);
  pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("TO:", PM + 8, ry); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  pdf.text("NAMA SAFARI", PM + 22, ry);
  ry += 6;
  pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("Tel:", PM + 8, ry); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  pdf.text("0702239607", PM + 22, ry);
  ry += 6;
  pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("Property:", PM + 8, ry); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  pdf.text("Nama Holdings Building — KAMPALA, UGANDA", PM + 22, ry);

  pdf.setFillColor(...hexRgb(BRAND.success));
  pdf.roundedRect(PM + (pw - PM * 2) - 68, y + 4, 60, 16, 3, 3, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("RENT COLLECTED", PM + (pw - PM * 2) - 62, y + 9);
  pdf.setFontSize(9); pdf.setFont("helvetica","bold");
  pdf.text("UGX 4,500,000", PM + (pw - PM * 2) - 62, y + 16);
  y = y + 24 + 10;

  pdf.setFontSize(8); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  const ctx = "The property is occupied by 3 tenants with active lease agreements.";
  pdf.text(ctx, PM, y); y += 8;

  const statW = (pw - PM * 2 - 12) / 3;
  const stats = [
    { label: "TOTAL RENT DUE", value: "UGX 6,000,000", color: BRAND.primary },
    { label: "TOTAL COLLECTED", value: "UGX 4,500,000", color: BRAND.success },
    { label: "BALANCE", value: "UGX 1,500,000", color: BRAND.danger },
  ];
  for (let i = 0; i < stats.length; i++) {
    pdf.setFillColor(...hexRgb(stats[i].color));
    pdf.roundedRect(PM + i * (statW + 6), y, statW, 22, 3, 3, "F");
    pdf.setFontSize(6); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
    pdf.text(stats[i].label, PM + i * (statW + 6) + 4, y + 7);
    pdf.setFontSize(9); pdf.setFont("helvetica","bold");
    pdf.text(stats[i].value, PM + i * (statW + 6) + 4, y + 17);
  }
  y += 32;

  const periods = [
    {
      title: "July 2026", totalPaid: 2500000, balance: 500000,
      payments: [{ date: "2026-07-05", amount: 1000000, status: "Paid" }, { date: "2026-07-12", amount: 1500000, status: "Paid" }],
    },
    {
      title: "June 2026", totalPaid: 2000000, balance: 1000000,
      payments: [{ date: "2026-06-03", amount: 1000000, status: "Paid" }, { date: "2026-06-15", amount: 1000000, status: "Paid" }],
    },
  ];

  for (const period of periods) {
    if (y > ph - 50) { pdf.addPage(); headerBand(pdf, pw); y = 20; }
    pdf.setFontSize(10); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
    pdf.text(period.title, PM, y); y += 2;
    pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
    pdf.line(PM, y, pw - PM, y); y += 6;

    const tX2 = PM, tc0 = pw - PM * 2 - 80, tc1 = 35, tc2 = 35;
    pdf.setFillColor(...hexRgb(BRAND.primary));
    pdf.rect(tX2, y - 4, tc0 + tc1 + tc2, 8, "F");
    pdf.setFontSize(7); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
    pdf.text("Date", tX2 + 4, y + 1);
    pdf.text("Amount", tX2 + tc0 + tc1 - 4, y + 1, { align: "right" });
    pdf.text("Status", tX2 + tc0 + tc1 + tc2 - 4, y + 1, { align: "right" });
    y += 8;

    for (let i = 0; i < period.payments.length; i++) {
      if (i % 2 === 1) { pdf.setFillColor(...hexRgb(BRAND.tableAlt)); pdf.rect(tX2, y - 4, tc0 + tc1 + tc2, 8, "F"); }
      const p = period.payments[i];
      pdf.setFontSize(8); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
      pdf.text(p.date, tX2 + 4, y + 1);
      pdf.setFont("helvetica","bold");
      pdf.text(`UGX ${p.amount.toLocaleString()}`, tX2 + tc0 + tc1 - 4, y + 1, { align: "right" });
      pdf.setTextColor(...hexRgb(BRAND.success)); pdf.text(p.status, tX2 + tc0 + tc1 + tc2 - 4, y + 1, { align: "right" });
      y += 8;
    }

    pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
    pdf.line(tX2, y, tX2 + tc0 + tc1 + tc2, y); y += 2;
    pdf.setFillColor(...hexRgb(BRAND.primaryLight));
    pdf.rect(tX2, y - 4, tc0 + tc1 + tc2, 8, "F");
    pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
    pdf.text("Total Paid", tX2 + 4, y + 1);
    pdf.text(`UGX ${period.totalPaid.toLocaleString()}`, tX2 + tc0 + tc1 + tc2 - 4, y + 1, { align: "right" });
    y += 4;
    const balColor = period.balance > 0 ? BRAND.danger : BRAND.success;
    pdf.setFillColor(...hexRgb(BRAND.bg)); pdf.rect(tX2, y - 4, tc0 + tc1 + tc2, 8, "F");
    pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(balColor));
    pdf.text("Balance", tX2 + 4, y + 1);
    pdf.text(`UGX ${period.balance.toLocaleString()}`, tX2 + tc0 + tc1 + tc2 - 4, y + 1, { align: "right" });
    y += 12;
  }

  if (y > ph - 60) { pdf.addPage(); headerBand(pdf, pw); y = 20; }

  pdf.setFontSize(14); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("Commission Breakdown", cx, y, { align: "center" });
  pdf.setDrawColor(...hexRgb(BRAND.accent)); pdf.setLineWidth(0.5);
  const tw = pdf.getTextWidth("Commission Breakdown");
  pdf.line(cx - tw/2 - 4, y + 2, cx + tw/2 + 4, y + 2);
  y += 14;

  const cw = (pw - PM * 2 - 8) / 2;
  const cItems = [
    { label: "Total Collected", value: "UGX 4,500,000", color: BRAND.primary },
    { label: "Landlord Share (66%)", value: "UGX 2,970,000", color: BRAND.success },
    { label: "Company Fee (9%)", value: "UGX 405,000", color: BRAND.accent },
    { label: "Pending to Landlord", value: "UGX 1,500,000", color: BRAND.danger },
  ];
  for (let i = 0; i < cItems.length; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const cxc = PM + col * (cw + 8), cyc = y + row * 14;
    pdf.setFillColor(...hexRgb(BRAND.white)); pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
    pdf.roundedRect(cxc, cyc - 4, cw, 12, 2, 2, "FD");
    pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
    pdf.text(cItems[i].label, cxc + 6, cyc + 1);
    pdf.setFontSize(9); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(cItems[i].color));
    pdf.text(cItems[i].value, cxc + 6, cyc + 10);
  }
  y += 36;

  pdf.setFontSize(8); pdf.setFont("helvetica","italic"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("Thank you for your continued partnership.", cx, y, { align: "center" });
  y += 16;
  pdf.setFontSize(8); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  pdf.text("Yours sincerely,", PM, y); y += 20;
  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.5);
  pdf.line(PM, y, PM + 60, y); y += 4;
  pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("Nabbosa Leila", PM, y); y += 4;
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("For HABICO PROPERTY MANAGERS LIMITED", PM, y);
  footerBand(pdf, pw, ph);

  return Buffer.from(pdf.output("arraybuffer")).toString("base64");
}

// ── Build branded receipt PDF for receipt email ──
async function buildBrandedReceiptPdfV2() {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p","mm","a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const cx = pw / 2;
  let y;

  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.rect(5, 5, pw - 10, ph - 10);
  headerBand(pdf, pw);
  y = 48;

  const ribbonW = 70;
  pdf.setFillColor(...hexRgb(BRAND.accent));
  pdf.roundedRect(cx - ribbonW/2, y - 8, ribbonW, 10, 2, 2, "F");
  pdf.setFontSize(8); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("OFFICIAL RECEIPT", cx, y - 1, { align: "center" });
  y += 10;

  pdf.setFontSize(22); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("PAYMENT RECEIPT", cx, y); y += 3;
  pdf.setDrawColor(...hexRgb(BRAND.accent)); pdf.setLineWidth(0.8);
  pdf.line(cx - 35, y, cx + 35, y); y += 10;

  pdf.setFillColor(...hexRgb(BRAND.primaryLight));
  pdf.roundedRect(PM, y - 6, 65, 10, 2, 2, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("RECEIPT #", PM + 5, y - 1);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(9);
  pdf.text("SAMPLE-001", PM + 5, y + 4);
  pdf.setFontSize(7); pdf.setFont("helvetica","normal");
  pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text(new Date().toISOString().slice(0,10), pw - PM, y + 2, { align: "right" });
  y += 14;

  const cardW = pw - PM * 2;
  pdf.setFillColor(...hexRgb(BRAND.white)); pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.5);
  pdf.roundedRect(PM, y, cardW, 44, 2, 2, "FD");
  y += 6;
  const rows = [
    ["Tenant", "Nama Safari"],
    ["Property", "Nama Holdings Building · Unit A1"],
    ["Period", "July 2026"],
    ["Type", "Rent"],
    ["Method", "Mobile Money"],
  ];
  let ry = y;
  pdf.setFontSize(8);
  for (const [label, value] of rows) {
    pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
    pdf.text(label, PM + 8, ry + 1);
    pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
    pdf.text(value, PM + 8 + 28, ry + 1);
    ry += 8;
  }
  pdf.setFillColor(...hexRgb(BRAND.success));
  pdf.roundedRect(PM + cardW - 72, y + 8, 64, 16, 3, 3, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("AMOUNT PAID", PM + cardW - 66, y + 13);
  pdf.setFontSize(11); pdf.setFont("helvetica","bold");
  pdf.text("UGX 1,500,000", PM + cardW - 66, y + 20);
  y = y + 44 + 10;

  pdf.setFontSize(10); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.primary));
  pdf.text("Payment Breakdown", PM, y); y += 2;
  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.line(PM, y, pw - PM, y); y += 6;

  const tX = PM, tc0 = pw - PM * 2 - 55, tc1 = 55;
  pdf.setFillColor(...hexRgb(BRAND.primary));
  pdf.rect(tX, y - 4, tc0 + tc1, 8, "F");
  pdf.setFontSize(7); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("Description", tX + 4, y + 1); pdf.text("Amount", tX + tc0 + tc1 - 4, y + 1, { align: "right" });
  y += 8;
  pdf.setFontSize(8); pdf.setFont("helvetica","normal"); pdf.setTextColor(...hexRgb(BRAND.text));
  pdf.text("Rent — July 2026", tX + 4, y + 1);
  pdf.setFont("helvetica","bold"); pdf.text("UGX 1,500,000", tX + tc0 + tc1 - 4, y + 1, { align: "right" });
  y += 8;
  pdf.setDrawColor(...hexRgb(BRAND.border)); pdf.setLineWidth(0.3);
  pdf.line(tX, y, tX + tc0 + tc1, y); y += 2;
  pdf.setFillColor(...hexRgb(BRAND.success));
  pdf.rect(tX, y - 4, tc0 + tc1, 8, "F");
  pdf.setFontSize(9); pdf.setFont("helvetica","bold"); pdf.setTextColor(...hexRgb(BRAND.white));
  pdf.text("Total Paid", tX + 4, y + 1); pdf.text("UGX 1,500,000", tX + tc0 + tc1 - 4, y + 1, { align: "right" });
  y += 14;
  pdf.setFontSize(7); pdf.setFont("helvetica","italic"); pdf.setTextColor(...hexRgb(BRAND.textMuted));
  pdf.text("Thank you for your payment.", cx, y, { align: "center" });
  footerBand(pdf, pw, ph);

  return Buffer.from(pdf.output("arraybuffer")).toString("base64");
}

async function main() {
  const RESEND_API_KEY = loadEnv();
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not found in .env");
    process.exit(1);
  }

  const resend = new Resend(RESEND_API_KEY);
  const TO = "namandisafari@gmail.com";
  const today = new Date().toISOString().slice(0,10);

  // 1. License email (uses HTML certificate via branded wrapper)
  const certHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Inter','Segoe UI',sans-serif; background: #fff; color: #1e293b; padding: 48px; }
  .cert { max-width: 700px; margin:0 auto; border:2px solid #1e293b; border-radius:16px; padding:48px; position:relative; }
  .cert::before { content:''; position:absolute; top:8px; left:8px; right:8px; bottom:8px; border:1px solid #e2e8f0; border-radius:10px; pointer-events:none; }
  .hdr { text-align:center; border-bottom:2px solid #1e293b; padding-bottom:24px; margin-bottom:24px; }
  .hdr h1 { font-size:28px; font-weight:800; letter-spacing:3px; color:#1e293b; margin:0; }
  .hdr p { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:2px; margin:4px 0 0; }
  .badge { display:inline-block; background:#1e293b; color:#fff; padding:8px 24px; border-radius:4px; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; margin-bottom:24px; }
  .field { margin-bottom:20px; }
  .field-lbl { font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:#94a3b8; font-weight:600; margin-bottom:4px; }
  .field-val { font-size:15px; color:#1e293b; font-weight:500; }
  .key { background:#f1f5f9; border-radius:8px; padding:16px 20px; font-family:'SF Mono','Consolas',monospace; font-size:20px; letter-spacing:3px; color:#0f172a; text-align:center; border:1px dashed #cbd5e1; margin:24px 0; }
  .grid { display:flex; gap:24px; margin-bottom:20px; }
  .grid > div { flex:1; }
  .tbl { width:100%; border-collapse:collapse; margin:24px 0; font-size:13px; }
  .tbl th { text-align:left; padding:8px 12px; background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#64748b; font-size:10px; text-transform:uppercase; letter-spacing:1px; }
  .tbl td { padding:10px 12px; border-bottom:1px solid #f1f5f9; }
  .tbl .tot { font-weight:700; font-size:15px; border-top:2px solid #1e293b; }
  .terms { margin-top:24px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; line-height:1.6; }
  .seal { text-align:center; margin-top:32px; opacity:0.6; }
</style></head><body>
<div class="cert">
  <div class="hdr"><h1>HABICO</h1><p>Property Managers · Kampala, Uganda</p></div>
  <div style="text-align:center;"><span class="badge">License Certificate</span></div>
  <p style="font-size:13px;color:#475569;margin-bottom:24px;text-align:center;line-height:1.6;">This certifies that <strong>Nama Holdings Ltd.</strong> is licensed to use the Habico Portal.</p>
  <div class="grid">
    <div class="field"><div class="field-lbl">Company</div><div class="field-val">Nama Holdings Ltd.</div></div>
    <div class="field"><div class="field-lbl">Plan</div><div class="field-val">Full Suite</div></div>
  </div>
  <div class="grid">
    <div class="field"><div class="field-lbl">Registered By</div><div class="field-val">Nama Safari</div></div>
    <div class="field"><div class="field-lbl">Admin Email</div><div class="field-val">namandisafari@gmail.com</div></div>
  </div>
  <div class="field-lbl" style="margin-bottom:8px;">License Key</div>
  <div class="key">XK7M2AB9Q3</div>
  <table class="tbl">
    <tr><th>Description</th><th>Plan</th><th align="right">Amount</th></tr>
    <tr><td>Habico Portal — Initial Registration</td><td>Full Suite</td><td align="right">UGX 150,000</td></tr>
    <tr class="tot"><td colspan="2" style="text-align:right;">Total Paid</td><td align="right">UGX 150,000</td></tr>
  </table>
  <div class="terms"><strong>Terms & Conditions</strong><br/>This license is granted to Nama Holdings Ltd. for the Full Suite plan. It is non-transferable and subject to the terms of service.</div>
  <div class="seal"><svg viewBox="0 0 48 48" width="48" height="48"><rect width="48" height="48" rx="8" fill="#1e293b"/><path d="M12 10h6v14h12V10h6v28h-6V26H18v12h-6V10z" fill="#fff"/></svg></div>
</div></body></html>`;

  console.log("📧 Sending license email...");
  const r1 = await resend.emails.send({
    from: "Habico Licenses <licenses@habico.ug>",
    to: [TO],
    subject: `License Certificate & Invoice — Nama Holdings Ltd. · Habico Portal`,
    html: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 40px;"><table width="100%"><tr>
          <td><img src="https://www.habico.ug/habico-logo.jpg" alt="Habico" width="160" style="display:block;border:0;border-radius:4px;"/></td>
          <td align="right" style="font-size:11px;color:#94a3b8;vertical-align:middle;">PROPERTY<br/>MANAGERS</td>
        </tr></table></td></tr>
        <tr><td style="padding:36px 40px 24px;">
          <p style="font-size:14px;color:#475569;line-height:1.7;">Dear <strong style="color:#1e293b;">Nama Safari</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.7;">Welcome to <strong>Habico</strong>. Your license certificate and invoice are attached.</p>
          <p style="margin:24px 0;font-size:12px;color:#94a3b8;">Best regards,<br/><strong style="color:#475569;">The Habico Team</strong></p>
        </td></tr>
      </table>
    </td></tr></table>`,
    attachments: [{ filename: "Habico-License-Certificate-Nama-Holdings-Ltd.html", content: Buffer.from(certHtml).toString("base64") }],
  });
  console.log(r1.error ? "  ❌ License FAILED: " + r1.error.message : "  ✅ License SENT " + r1.data?.id);

  // 2. Financial report
  console.log("📧 Sending financial report email...");
  const reportPdf = await buildBrandedReportPdf();
  const r2 = await resend.emails.send({
    from: "Habico Reports <reports@habico.ug>",
    to: [TO],
    subject: "Financial Report — Nama Holdings Building · Habico Portal",
    html: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 40px;"><table width="100%"><tr>
          <td><img src="https://www.habico.ug/habico-logo.jpg" alt="Habico" width="160" style="display:block;border:0;border-radius:4px;"/></td>
          <td align="right" style="font-size:11px;color:#94a3b8;vertical-align:middle;">PROPERTY<br/>MANAGERS</td>
        </tr></table></td></tr>
        <tr><td style="padding:36px 40px 24px;">
          <p style="font-size:14px;color:#475569;line-height:1.7;">Dear <strong style="color:#1e293b;">Nama Safari</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.7;">Please find attached the financial report for <strong>Nama Holdings Building</strong>.</p>
          <p style="margin:16px 0;font-size:12px;color:#94a3b8;">For questions, contact <a href="mailto:support@habico.ug" style="color:#2563eb;">support@habico.ug</a> or call 0702 239 607 / 0756 742 220.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Best regards,<br/><strong style="color:#475569;">The Habico Team</strong></p>
        </td></tr>
      </table>
    </td></tr></table>`,
    attachments: [{ filename: "habico-financial-report-sample.pdf", content: reportPdf }],
  });
  console.log(r2.error ? "  ❌ Report FAILED: " + r2.error.message : "  ✅ Report SENT " + r2.data?.id);

  // 3. Receipt
  console.log("📧 Sending receipt email...");
  const receiptPdf = await buildBrandedReceiptPdfV2();
  const r3 = await resend.emails.send({
    from: "Habico Payments <payments@habico.ug>",
    to: [TO],
    subject: "Payment Receipt — Nama Holdings Building · Habico Portal",
    html: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 40px;"><table width="100%"><tr>
          <td><img src="https://www.habico.ug/habico-logo.jpg" alt="Habico" width="160" style="display:block;border:0;border-radius:4px;"/></td>
          <td align="right" style="font-size:11px;color:#94a3b8;vertical-align:middle;">PROPERTY<br/>MANAGERS</td>
        </tr></table></td></tr>
        <tr><td style="padding:36px 40px 24px;">
          <p style="font-size:14px;color:#475569;line-height:1.7;">Dear <strong style="color:#1e293b;">Nama Safari</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.7;">Thank you for your rent payment of <strong style="color:#059669;">UGX 1,500,000</strong> for <strong>Nama Holdings Building · Unit A1</strong>.</p>
          <p style="font-size:14px;color:#475569;line-height:1.7;">A receipt is attached to this email for your records.</p>
          <p style="margin:16px 0;font-size:12px;color:#94a3b8;">For questions, contact <a href="mailto:support@habico.ug" style="color:#2563eb;">support@habico.ug</a> or call 0702 239 607 / 0756 742 220.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Best regards,<br/><strong style="color:#475569;">The Habico Team</strong></p>
        </td></tr>
      </table>
    </td></tr></table>`,
    attachments: [{ filename: "habico-receipt-sample.pdf", content: receiptPdf }],
  });
  console.log(r3.error ? "  ❌ Receipt FAILED: " + r3.error.message : "  ✅ Receipt SENT " + r3.data?.id);

  // 4. Reminder
  console.log("📧 Sending reminder email...");
  const r4 = await resend.emails.send({
    from: "Habico Reminders <reminder@habico.ug>",
    to: [TO],
    subject: "Payment Reminder — Nama Holdings Building · Habico Portal",
    html: `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 40px;text-align:center;">
          <img src="https://www.habico.ug/habico-logo.jpg" alt="Habico" width="140" style="display:block;margin:0 auto;border-radius:4px;"/>
        </td></tr>
        <tr><td style="padding:36px 40px 24px;">
          <p style="font-size:14px;color:#475569;line-height:1.7;">Dear <strong style="color:#1e293b;">Nama Safari</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.7;">This is a friendly reminder that your rent payment of <strong style="color:#dc2626;">UGX 1,500,000</strong> for <strong>Nama Holdings Building · Unit A1</strong> is due.</p>
          <p style="margin:24px 0;text-align:center;">
            <a href="https://wa.me/256702239607?text=Hi%20Habico%2C%20I%27m%20checking%20on%20my%20rent%20payment%20for%20Nama%20Holdings%20Building%20-%20Unit%20A1."
               style="background:#25D366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;display:inline-block;font-size:14px;">
              Reply via WhatsApp
            </a>
          </p>
          <p style="font-size:12px;color:#94a3b8;line-height:1.6;">If you have already made payment, please disregard this notice. For any questions, contact <a href="mailto:support@habico.ug" style="color:#2563eb;">support@habico.ug</a> or call 0702 239 607 / 0756 742 220.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Best regards,<br/><strong style="color:#475569;">The Habico Team</strong></p>
        </td></tr>
      </table>
    </td></tr></table>`,
  });
  console.log(r4.error ? "  ❌ Reminder FAILED: " + r4.error.message : "  ✅ Reminder SENT " + r4.data?.id);

  console.log("\nAll done!");
}

main().catch(console.error);
