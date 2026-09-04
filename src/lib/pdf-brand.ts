import logoPng from "@/assets/habico-logo.png";

export const BRAND = {
  primary: "#1e293b",
  primaryLight: "#334155",
  accent: "#f59e0b",
  accentLight: "#fbbf24",
  success: "#059669",
  danger: "#dc2626",
  muted: "#94a3b8",
  bg: "#f8fafc",
  border: "#e2e8f0",
  text: "#1e293b",
  textMuted: "#64748b",
  white: "#ffffff",
  headerBg: "#0f172a",
  tableAlt: "#f1f5f9",
} as const;

export const PDF_MARGIN = 15;
export const CONTENT_WIDTH = 180;

let _logoDataUrl: string | null = null;

export async function loadLogo(): Promise<string> {
  if (_logoDataUrl) return _logoDataUrl;
  try {
    const resp = await fetch(logoPng);
    const blob = await resp.blob();
    const reader = new FileReader();
    _logoDataUrl = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    _logoDataUrl = "";
  }
  return _logoDataUrl;
}

export function headerBand(pdf: any, pageW: number, logoDataUrl?: string | null) {
  const h = 36;
  pdf.setFillColor(...hexToRgb(BRAND.headerBg));
  pdf.rect(0, 0, pageW, h, "F");

  const logoX = PDF_MARGIN;
  const logoY = 4;
  const logoSize = 26;

  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, "PNG", logoX, logoY, logoSize, logoSize);
    } catch {}
  }

  const textX = logoX + logoSize + 5;
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
}

export function drawWatermark(pdf: any, pageW: number, pageH: number, logoDataUrl?: string | null) {
  if (!logoDataUrl) return;
  try {
    const wmSize = 70;
    const wmX = (pageW - wmSize) / 2;
    const wmY = (pageH - wmSize) / 2;
    // Try GState opacity; if it fails, draw at full opacity (still visible)
    try {
      pdf.setGState(new pdf.GState({ opacity: 0.08 }));
    } catch {}
    pdf.addImage(logoDataUrl, "PNG", wmX, wmY, wmSize, wmSize);
    try {
      pdf.setGState(new pdf.GState({ opacity: 1 }));
    } catch {}
  } catch {}
}

export function footerBand(pdf: any, pageW: number, pageH: number) {
  const y = pageH - 20;
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, pageW - PDF_MARGIN, y);
  pdf.setFontSize(6);
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.setFont("helvetica", "normal");
  pdf.text("Basiima Building, 2nd Floor Room C03, Kampala", PDF_MARGIN, y + 5);
  pdf.text("0756742220 | 0702239607 · habicopropertymanagers@gmail.com", PDF_MARGIN, y + 9);
  pdf.text("Tax ID: URA-TIN-123456789", PDF_MARGIN, y + 13);
  pdf.setFontSize(5);
  pdf.setTextColor(...hexToRgb(BRAND.muted));
  pdf.text(`© ${new Date().getFullYear()} Habico Property Managers Ltd. All rights reserved.`, PDF_MARGIN, y + 17);
}

export function sectionTitle(pdf: any, text: string, y: number, pageW: number) {
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  const tw = pdf.getTextWidth(text);
  const cx = pageW / 2;
  pdf.text(text, cx, y, { align: "center" });
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(0.5);
  pdf.line(cx - tw / 2 - 4, y + 2, cx + tw / 2 + 4, y + 2);
  return y + 10;
}

export function detailRow(pdf: any, label: string, value: string, x: number, y: number, opts?: { valueColor?: string; labelWidth?: number }) {
  const lw = opts?.labelWidth ?? 50;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  if (opts?.valueColor) {
    pdf.setTextColor(...hexToRgb(opts.valueColor));
  } else {
    pdf.setTextColor(...hexToRgb(BRAND.text));
  }
  pdf.text(value, x + lw, y);
  return y + 6;
}

export function detailGrid(pdf: any, rows: [string, string][], x: number, startY: number, opts?: { labelWidth?: number; valueColor?: string }) {
  let y = startY;
  const half = Math.ceil(rows.length / 2);
  const colW = 85;
  for (let i = 0; i < half; i++) {
    if (i < rows.length) {
      const lw = opts?.labelWidth ?? 40;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text(rows[i][0], x, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(opts?.valueColor ?? BRAND.text));
      pdf.text(rows[i][1], x + lw, y);
    }
    if (i + half < rows.length) {
      const ri = i + half;
      const lw = opts?.labelWidth ?? 40;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text(rows[ri][0], x + colW, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(opts?.valueColor ?? BRAND.text));
      pdf.text(rows[ri][1], x + colW + lw, y);
    }
    y += 6;
  }
  return y;
}

export function brandedCard(pdf: any, x: number, y: number, w: number, h: number) {
  pdf.setFillColor(...hexToRgb(BRAND.white));
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, w, h, 2, 2, "FD");
}

export function amountBox(pdf: any, label: string, amount: string, x: number, y: number, w: number, color?: string) {
  const bg = color ?? BRAND.accent;
  pdf.setFillColor(...hexToRgb(bg));
  const h = 16;
  pdf.roundedRect(x, y - 12, w, h, 3, 3, "F");
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text(label, x + 6, y - 3);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(amount, x + 6, y + 4);
}

export function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
