// @ts-nocheck
import jsPDF from "jspdf";
import QRCode from "qrcode";

// ─── Color palette ───
const TEAL = [13, 74, 69];
const TEAL_DARK = [8, 49, 45];
const ORANGE = [239, 139, 62];
const ORANGE_DARK = [217, 112, 31];
const BLACK = [20, 22, 26];
const PAPER = [251, 251, 249];
const MUTED = [122, 132, 130];
const MINT = [159, 216, 207];
const WHITE = [255, 255, 255];

// ─── Card dimensions (CR-80 at ~300 DPI) ───
const CARD_W = 101.3; // mm (3.375in × 25.4)
const CARD_H = 63.8;  // mm (2.125in × 25.4)
const CARD_R = 2.2;   // corner radius mm
const MARGIN = 3.4;

// ─── Staff card data type ───
export interface StaffCardData {
  fullName: string;
  jobTitle: string;
  employeeId: string;
  department: string;
  bloodGroup: string;
  accessLevel: string;
  nationalId: string;
  dateJoined: string;
  photoDataUrl?: string | null;
  issueDate: string;
  validUntil: string;
  emergencyContact: string;
  emergencyPhone: string;
  reportingOffice: string;
  companyAddress?: string;
  companyReg?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyEmergencyLine?: string;
}

// ─── QR code generator (canvas → data url) ───
async function generateQrDataUrl(text: string, size = 200): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: { dark: "#14161a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
  } catch {
    return "";
  }
}

// ─── Barcode drawing helper ───
function drawBarcode(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  data: string,
  color: number[] = WHITE
) {
  doc.setFillColor(...color);
  // Generate pseudo-random bar widths from the string
  let cx = x;
  for (let i = 0; i < 50 && cx < x + width; i++) {
    const charCode = data.charCodeAt(i % data.length);
    const barW = 0.3 + (charCode % 3) * 0.25;
    const isBar = i % 2 === 0;
    if (isBar) {
      doc.rect(cx, y, barW, height, "F");
    }
    cx += barW + 0.15;
  }
}

// ─── Rounded rect helper ───
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: string = "S",
  fillColor?: number[],
  lineColor?: number[],
  lineWidth = 0.2
) {
  if (fillColor) doc.setFillColor(...fillColor);
  if (lineColor) doc.setDrawColor(...lineColor);
  doc.setLineWidth(lineWidth);
  doc.roundedRect(x, y, w, h, r, r, style);
}

// ─── Draw wave shape ───
function drawWave(
  doc: jsPDF,
  y: number,
  amplitude: number,
  fillColor: number[],
  cardWidth: number
) {
  doc.setFillColor(...fillColor);
  doc.setDrawColor(...fillColor);
  doc.setLineWidth(0.1);
  // Approximate wave with bezier curves
  doc.lines(
    [
      [0, 0],
      [cardWidth * 0.15, -amplitude * 0.6],
      [cardWidth * 0.3, amplitude * 0.3],
      [cardWidth * 0.5, -amplitude * 0.4],
      [cardWidth * 0.7, amplitude * 0.5],
      [cardWidth * 0.85, -amplitude * 0.3],
      [cardWidth, 0],
      [cardWidth, amplitude * 2],
      [0, amplitude * 2],
    ],
    0,
    y,
    [1, 1],
    "F"
  );
}

// ─── Draw "sun" circle (partially clipped) ───
function drawSun(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setFillColor(...ORANGE);
  doc.circle(cx, cy, r, "F");
}

// ─── Draw house/roof outlines ───
function drawHouseOutline(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.setFillColor(0, 0, 0, 0); // transparent
  // Roof triangle
  doc.lines(
    [
      [0, 0],
      [w / 2, -h * 0.6],
      [w / 2, h * 0.6],
    ],
    x,
    y,
    [1, 1],
    "S"
  );
  // House body
  doc.rect(x - w * 0.35, y, w * 0.7, h * 0.5, "S");
}

// ─── Draw silhouette placeholder ───
function drawSilhouette(doc: jsPDF, x: number, y: number, w: number, h: number) {
  // Background
  roundedRect(doc, x, y, w, h, 1.2, "F", [230, 237, 235], TEAL, 0.3);
  // Head circle
  doc.setFillColor(170, 182, 180);
  const headR = w * 0.16;
  doc.circle(x + w / 2, y + h * 0.3, headR, "F");
  // Shoulders arc
  doc.setFillColor(170, 182, 180);
  doc.ellipse(x + w / 2, y + h * 0.75, w * 0.3, h * 0.2, "F");
}

// ─── Draw "STAFF" ribbon on photo ───
function drawStaffRibbon(doc: jsPDF, x: number, y: number, w: number) {
  const ribbonH = 4;
  doc.setFillColor(...ORANGE);
  doc.rect(x, y, w, ribbonH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...WHITE);
  doc.text("STAFF", x + w / 2, y + ribbonH - 1.2, { align: "center" });
}

// ══════════════════════════════════════════════════════════════
//  FRONT OF CARD
// ══════════════════════════════════════════════════════════════
async function drawFront(doc: jsPDF, data: StaffCardData) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ox = (pw - CARD_W) / 2;
  const oy = (ph - CARD_H) / 2;

  // ── Card background ──
  roundedRect(doc, ox, oy, CARD_W, CARD_H, CARD_R, "F", PAPER);

  // ── 1. Top band (y: 0–15mm) ──
  const bandH = 15;

  // Sun circle (partially clipped at top)
  drawSun(doc, ox + 15, oy + 1, 6);

  // House outlines (two overlapping)
  drawHouseOutline(doc, ox + 6, oy + 8, 8, 5);
  drawHouseOutline(doc, ox + 12, oy + 7, 7, 4.5);

  // Dark wave swoosh across bottom of band
  doc.setFillColor(16, 20, 24);
  doc.lines(
    [
      [0, 0],
      [CARD_W * 0.2, -1.5],
      [CARD_W * 0.4, 1],
      [CARD_W * 0.6, -1.2],
      [CARD_W * 0.8, 0.8],
      [CARD_W, -0.5],
      [CARD_W, 3],
      [0, 3],
    ],
    ox,
    oy + bandH - 3,
    [1, 1],
    "F"
  );

  // Teal wave line above dark swoosh
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.lines(
    [
      [0, 0],
      [CARD_W * 0.15, -0.8],
      [CARD_W * 0.35, 0.5],
      [CARD_W * 0.55, -0.6],
      [CARD_W * 0.75, 0.4],
      [CARD_W, -0.3],
    ],
    ox,
    oy + bandH - 4.5,
    [1, 1],
    "S"
  );

  // Logo text
  doc.setFont("helvetica", "black");
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.text("HABICO", ox + MARGIN, oy + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(...ORANGE_DARK);
  doc.text("PROPERTY MANAGERS", ox + MARGIN, oy + 9.5, { characterSpacing: 1.5 });

  // "STAFF ID" pill tag (top-right)
  const tagW = 20;
  const tagH = 5;
  const tagX = ox + CARD_W - MARGIN - tagW;
  const tagY = oy + 4;
  roundedRect(doc, tagX, tagY, tagW, tagH, 2.5, "F", BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5);
  doc.setTextColor(...WHITE);
  doc.text("STAFF ID", tagX + tagW / 2, tagY + tagH - 1.6, {
    align: "center",
    characterSpacing: 1.2,
  });

  // Chip icon (gold rectangle)
  const chipX = tagX + tagW / 2 - 3;
  const chipY = tagY - 5;
  const chipW = 6;
  const chipH = 4.5;
  // Gold gradient approximation
  doc.setFillColor(224, 192, 96);
  roundedRect(doc, chipX, chipY, chipW, chipH, 0.8, "F");
  doc.setFillColor(169, 121, 31);
  doc.setDrawColor(169, 121, 31);
  doc.setLineWidth(0.15);
  // Chip lines
  doc.line(chipX + 1, chipY + 1.5, chipX + chipW - 1, chipY + 1.5);
  doc.line(chipX + 1, chipY + 3, chipX + chipW - 1, chipY + 3);
  doc.line(chipX + chipW / 2, chipY + 0.8, chipX + chipW / 2, chipY + chipH - 0.8);

  // ── 2. Main body ──
  const bodyY = oy + bandH + 1;

  // Photo box
  const photoW = 18;
  const photoH = 22;
  const photoX = ox + MARGIN;
  const photoY = bodyY + 2;

  if (data.photoDataUrl) {
    try {
      doc.addImage(data.photoDataUrl, "JPEG", photoX, photoY, photoW, photoH);
      // Border
      doc.setDrawColor(...TEAL);
      doc.setLineWidth(0.3);
      doc.roundedRect(photoX, photoY, photoW, photoH, 1.2, 1.2, "S");
    } catch {
      drawSilhouette(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    drawSilhouette(doc, photoX, photoY, photoW, photoH);
  }
  // Staff ribbon
  drawStaffRibbon(doc, photoX, photoY + photoH - 4, photoW);

  // ── Info column ──
  const infoX = photoX + photoW + 4;
  let infoY = bodyY + 3;

  // Full name
  doc.setFont("helvetica", "black");
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(data.fullName.toUpperCase(), infoX, infoY);
  infoY += 5;

  // Job title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(...ORANGE_DARK);
  doc.text(data.jobTitle.toUpperCase(), infoX, infoY, { characterSpacing: 0.5 });
  infoY += 6;

  // Data grid (2 columns)
  const col1X = infoX;
  const col2X = infoX + 32;
  const labelSize = 3.5;
  const valueSize = 5;
  const rowH = 6.5;

  function drawField(x: number, y: number, label: string, value: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(labelSize);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, y, { characterSpacing: 1 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(valueSize);
    doc.setTextColor(...BLACK);
    doc.text(value || "—", x, y + 3.5);
  }

  drawField(col1X, infoY, "Employee ID", data.employeeId);
  drawField(col2X, infoY, "Department", data.department);
  infoY += rowH;
  drawField(col1X, infoY, "Blood Group", data.bloodGroup);
  drawField(col2X, infoY, "Access Level", data.accessLevel);
  infoY += rowH;
  drawField(col1X, infoY, "National ID No.", data.nationalId);
  drawField(col2X, infoY, "Date Joined", data.dateJoined);

  // Hologram watermark (faint circle)
  doc.setFillColor(200, 220, 215, 0.15);
  doc.circle(ox + CARD_W - 20, bodyY + 10, 12, "F");

  // Security pattern (diagonal lines at ~3.5% opacity)
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.05);
  for (let i = 0; i < 80; i++) {
    const lx = ox + i * 1.5;
    doc.line(lx, oy, lx + 10, oy + CARD_H);
  }

  // ── 3. Footer band ──
  const footerH = 16.8;
  const footerY = oy + CARD_H - footerH;
  doc.setFillColor(...TEAL_DARK);
  doc.rect(ox, footerY, CARD_W, footerH, "F");

  // Subtle wave at top of footer
  doc.setFillColor(8, 49, 45);
  doc.lines(
    [
      [0, 0],
      [CARD_W * 0.3, 1.5],
      [CARD_W * 0.6, -1],
      [CARD_W, 0.8],
      [CARD_W, -1.5],
      [0, -1.5],
    ],
    ox,
    footerY + 1.5,
    [1, 1],
    "F"
  );

  // Employee number
  const footLeftX = ox + MARGIN;
  let footY = footerY + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.setTextColor(...MINT);
  doc.text("EMPLOYEE No.", footLeftX, footY);
  footY += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(data.employeeId, footLeftX, footY);

  // Barcode
  drawBarcode(doc, footLeftX, footY + 2, 35, 5, data.employeeId, WHITE);

  // QR code
  const qrUrl = await generateQrDataUrl(
    `https://verify.habicoproperty.co.ug/${data.employeeId}`,
    200
  );
  if (qrUrl) {
    const qrX = footLeftX + 40;
    const qrSize = 8.5;
    doc.addImage(qrUrl, "PNG", qrX, footerY + 2.5, qrSize, qrSize);
  }

  // Issue / Valid dates
  const dateX = footLeftX + 52;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.setTextColor(...MINT);
  doc.text("ISSUED:", dateX, footerY + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
  doc.text(data.issueDate.toUpperCase(), dateX + 9, footerY + 4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...MINT);
  doc.text("VALID UNTIL:", dateX, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
  doc.text(data.validUntil.toUpperCase(), dateX + 15, footerY + 8);

  // Signature block (far right)
  const sigLineW = 19;
  const sigX = ox + CARD_W - MARGIN - sigLineW;
  const sigY = footerY + 9;
  doc.setDrawColor(...MINT);
  doc.setLineWidth(0.25);
  doc.line(sigX, sigY, sigX + sigLineW, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3);
  doc.setTextColor(...MINT);
  doc.text("AUTHORIZED SIGNATURE", sigX + sigLineW / 2, sigY + 3.5, {
    align: "center",
    characterSpacing: 0.8,
  });
}

// ══════════════════════════════════════════════════════════════
//  BACK OF CARD
// ══════════════════════════════════════════════════════════════
async function drawBack(doc: jsPDF, data: StaffCardData) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ox = (pw - CARD_W) / 2;
  const oy = (ph - CARD_H) / 2;

  // ── Card background ──
  roundedRect(doc, ox, oy, CARD_W, CARD_H, CARD_R, "F", PAPER);

  // ── 1. Top band (shorter, teal-dark) ──
  const bandH = 9.2;
  doc.setFillColor(...TEAL_DARK);
  doc.rect(ox, oy, CARD_W, bandH, "F");

  // Subtle wave at bottom of band
  doc.setFillColor(6, 38, 35);
  doc.lines(
    [
      [0, 0],
      [CARD_W * 0.25, 1],
      [CARD_W * 0.5, -0.8],
      [CARD_W * 0.75, 0.6],
      [CARD_W, -0.4],
      [CARD_W, 1.5],
      [0, 1.5],
    ],
    ox,
    oy + bandH - 1.5,
    [1, 1],
    "F"
  );

  // Logo (white version)
  doc.setFont("helvetica", "black");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  doc.text("HABICO", ox + MARGIN, oy + 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.8);
  doc.setTextColor(...ORANGE);
  doc.text("PROPERTY MANAGERS", ox + MARGIN, oy + 7, { characterSpacing: 1.2 });

  // Tagline (right-aligned)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.setTextColor(...MINT);
  doc.text("PROPERTY MANAGEMENT & CONSTRUCTION SERVICES", ox + CARD_W - MARGIN, oy + 5.5, {
    align: "right",
    characterSpacing: 0.5,
  });

  // ── 2. Body ──
  let bodyY = oy + bandH + 3;

  // Terms of Use (orange left border)
  const termsX = ox + MARGIN;
  const termsW = CARD_W - MARGIN * 2;
  doc.setFillColor(...ORANGE);
  doc.rect(termsX, bodyY - 5, 0.8, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4);
  doc.setTextColor(...TEAL);
  doc.text("Terms of Use:", termsX + 2, bodyY - 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.8);
  doc.setTextColor(60, 70, 68);
  const terms =
    "This card is the property of Habico Property Managers Ltd. It is non-transferable and must be surrendered upon termination of employment or tenancy. Unauthorized duplication is punishable under company policy. If found, please return to: Habico Property Managers Ltd, Plot 44, Kampala Road, or call +256 700 123 456.";
  const termLines = doc.splitTextToSize(terms, termsW - 3);
  doc.text(termLines, termsX + 2, bodyY + 1.5);

  bodyY += 16;

  // Contact/registration grid
  const gCol1X = ox + MARGIN;
  const gCol2X = ox + CARD_W / 2 + 2;
  const gLabel = 3.2;
  const gValue = 4;
  const gRowH = 6.5;

  function drawGridField(x: number, y: number, label: string, value: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(gLabel);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, y, { characterSpacing: 0.8 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(gValue);
    doc.setTextColor(...BLACK);
    doc.text(value || "—", x, y + 3);
  }

  drawGridField(gCol1X, bodyY, "Registered Office", data.companyAddress || "Plot 44, Kampala Road, Uganda");
  drawGridField(gCol2X, bodyY, "Company Reg. / TIN", data.companyReg || "1007892564 / 1012345678");
  bodyY += gRowH;
  drawGridField(gCol1X, bodyY, "Telephone", data.companyPhone || "+256 700 123 456");
  drawGridField(gCol2X, bodyY, "Email", data.companyEmail || "info@habicoproperty.co.ug");
  bodyY += gRowH;
  drawGridField(gCol1X, bodyY, "Website", data.companyWebsite || "www.habicoproperty.co.ug");
  drawGridField(gCol2X, bodyY, "Emergency Line", data.companyEmergencyLine || "+256 700 654 321");

  bodyY += gRowH + 2;

  // Magnetic stripe
  const stripeH = 4.8;
  doc.setFillColor(30, 32, 36);
  doc.rect(ox + MARGIN, bodyY, CARD_W - MARGIN * 2, stripeH, "F");
  // Texture lines
  doc.setDrawColor(50, 52, 56);
  doc.setLineWidth(0.08);
  for (let i = 0; i < 120; i++) {
    const lx = ox + MARGIN + i * 0.7;
    doc.line(lx, bodyY, lx, bodyY + stripeH);
  }

  bodyY += stripeH + 3;

  // Emergency Contact & Reporting Office boxes
  const boxW = (CARD_W - MARGIN * 2 - 3) / 2;
  const boxH = 8;

  // Emergency Contact box
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 0.5], 0);
  doc.roundedRect(ox + MARGIN, bodyY, boxW, boxH, 1, 1, "S");
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.2);
  doc.setTextColor(...MUTED);
  doc.text("EMERGENCY CONTACT", ox + MARGIN + 1.5, bodyY + 2.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(...BLACK);
  doc.text(data.emergencyContact || "—", ox + MARGIN + 1.5, bodyY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(3.8);
  doc.text(data.emergencyPhone || "—", ox + MARGIN + 1.5, bodyY + 7.2);

  // Reporting Office box
  const rBoxX = ox + MARGIN + boxW + 3;
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 0.5], 0);
  doc.roundedRect(rBoxX, bodyY, boxW, boxH, 1, 1, "S");
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.2);
  doc.setTextColor(...MUTED);
  doc.text("REPORTING OFFICE", rBoxX + 1.5, bodyY + 2.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.5);
  doc.setTextColor(...BLACK);
  doc.text(data.reportingOffice || "—", rBoxX + 1.5, bodyY + 5.5);

  // ── 3. Bottom footer strip ──
  const footH = 9.6;
  const footY = oy + CARD_H - footH;
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.15);
  doc.line(ox + MARGIN, footY, ox + CARD_W - MARGIN, footY);

  // QR code (smaller)
  const qrUrl = await generateQrDataUrl(
    `https://verify.habicoproperty.co.ug/${data.employeeId}`,
    160
  );
  if (qrUrl) {
    const qrSize = 6.4;
    doc.addImage(qrUrl, "PNG", ox + MARGIN, footY + 1, qrSize, qrSize);
  }

  // Verification text next to QR
  const vTextX = ox + MARGIN + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3);
  doc.setTextColor(...MUTED);
  doc.text("Scan to verify employee status", vTextX, footY + 2.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.2);
  doc.setTextColor(...TEAL);
  doc.text(
    `verify.habicoproperty.co.ug/${data.employeeId}`,
    vTextX,
    footY + 5
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(2.8);
  doc.setTextColor(...MUTED);
  doc.text("Report suspicious use to security@habicoproperty.co.ug", vTextX, footY + 7.5);

  // Barcode (smaller, far right)
  const smBarcodeW = 25;
  const smBarcodeX = ox + CARD_W - MARGIN - smBarcodeW;
  drawBarcode(doc, smBarcodeX, footY + 1.5, smBarcodeW, 4, data.employeeId, BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(3.5);
  doc.setTextColor(...BLACK);
  doc.text(data.employeeId, smBarcodeX + smBarcodeW / 2, footY + 8, { align: "center" });
}

// ══════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════
export async function generateStaffIdCardPdf(
  data: StaffCardData
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [CARD_W + 10, CARD_H + 10],
  });

  // Front side
  await drawFront(doc, data);

  // Add new page for back side
  doc.addPage([CARD_W + 10, CARD_H + 10], "landscape");
  await drawBack(doc, data);

  return doc;
}

export async function downloadStaffIdCardPdf(data: StaffCardData) {
  const doc = await generateStaffIdCardPdf(data);
  const safeName = (data.fullName || "staff")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
  doc.save(`habico-staff-id-${data.employeeId}-${safeName}.pdf`);
}
