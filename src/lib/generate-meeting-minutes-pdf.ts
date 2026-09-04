import jsPDF from "jspdf";
import { BRAND, hexToRgb, PDF_MARGIN, CONTENT_WIDTH, loadLogo, drawWatermark } from "@/lib/pdf-brand";

export interface MinuteDiscussion {
  topic: string;
  discussion: string;
  decisions: string;
  follow_ups: string;
}

export interface MinuteMatterArising {
  description: string;
  reference_meeting: string;
  status: string;
}

export interface MinuteResolution {
  number: number;
  text: string;
  proposed_by: string;
  seconded_by: string;
}

export interface MinuteAOB {
  topic: string;
  discussion: string;
}

export interface MinuteActionItem {
  action: string;
  assignee: string;
  due_date: string;
  status: string;
}

export interface MeetingMinutesPdfData {
  title: string;
  meeting_type: string;
  meeting_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  project_name: string;
  secretary_name?: string | null;
  chairperson_name?: string | null;
  attendees: string;
  confirmed_by?: string | null;
  agenda?: string | null;
  discussions: MinuteDiscussion[];
  matters_arising: MinuteMatterArising[];
  resolutions: MinuteResolution[];
  aob: MinuteAOB[];
  action_items: MinuteActionItem[];
  next_meeting?: { date?: string; time?: string; location?: string; proposed_agenda?: string } | null;
  distribution_list?: string | null;
}

function drawHeader(pdf: jsPDF, pageW: number, logoDataUrl?: string | null) {
  const h = 32;
  pdf.setFillColor(...hexToRgb(BRAND.headerBg));
  pdf.rect(0, 0, pageW, h, "F");

  if (logoDataUrl) {
    try { pdf.addImage(logoDataUrl, "PNG", PDF_MARGIN, 3, 26, 26); } catch {}
  }

  const textX = logoDataUrl ? PDF_MARGIN + 32 : PDF_MARGIN;
  pdf.setFontSize(14);
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.setFont("helvetica", "bold");
  pdf.text("HABICO PROPERTY MANAGERS", textX, 14);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.muted));
  pdf.text("MEETING MINUTES", textX, 22);
  pdf.setDrawColor(...hexToRgb(BRAND.accent));
  pdf.setLineWidth(1.5);
  pdf.line(0, h, pageW, h);
  return h;
}

function drawFooter(pdf: jsPDF, pageW: number, pageH: number, pageNum: number) {
  const y = pageH - 15;
  pdf.setDrawColor(...hexToRgb(BRAND.border));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, pageW - PDF_MARGIN, y);
  pdf.setFontSize(6);
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.setFont("helvetica", "normal");
  pdf.text("Habico Property Managers Ltd.", PDF_MARGIN, y + 4);
  pdf.text(`Page ${pageNum}`, pageW - PDF_MARGIN, y + 4, { align: "right" });
}

function sectionHeading(pdf: jsPDF, text: string, y: number, pageW: number): number {
  pdf.setFillColor(...hexToRgb(BRAND.accent));
  pdf.rect(PDF_MARGIN, y, CONTENT_WIDTH, 7, "F");
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text(text.toUpperCase(), PDF_MARGIN + 3, y + 5);
  return y + 10;
}

function labelValue(pdf: jsPDF, label: string, value: string, x: number, y: number, labelW = 40): number {
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text(label, x, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  const lines = pdf.splitTextToSize(value, CONTENT_WIDTH - labelW - 5);
  pdf.text(lines, x + labelW, y);
  return y + lines.length * 4 + 2;
}

export async function generateMeetingMinutesPdf(data: MeetingMinutesPdfData): Promise<jsPDF> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  let pageNum = 1;

  const logoDataUrl = await loadLogo();
  drawWatermark(pdf, pageW, pageH, logoDataUrl);
  let y = drawHeader(pdf, pageW, logoDataUrl) + 6;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - 25) {
      drawFooter(pdf, pageW, pageH, pageNum);
      pdf.addPage();
      pageNum++;
      y = 12;
    }
  };

  // Meeting type badge
  const typeLabel = (data.meeting_type || "regular").replace("_", " ").toUpperCase();
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  const tw = pdf.getTextWidth(typeLabel);
  pdf.setFillColor(...hexToRgb(BRAND.primary));
  pdf.roundedRect(PDF_MARGIN, y - 4, tw + 8, 6, 1, 1, "F");
  pdf.setTextColor(...hexToRgb(BRAND.white));
  pdf.text(typeLabel, PDF_MARGIN + 4, y);
  y += 8;

  // Title
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...hexToRgb(BRAND.primary));
  pdf.text(data.title, PDF_MARGIN, y);
  y += 8;

  // Meeting info grid
  const infoStartY = y;
  y = labelValue(pdf, "Date:", data.meeting_date ? new Date(data.meeting_date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—", PDF_MARGIN, y);
  if (data.start_time || data.end_time) {
    const timeStr = [data.start_time, data.end_time].filter(Boolean).join(" – ");
    y = labelValue(pdf, "Time:", timeStr, PDF_MARGIN, y);
  }
  y = labelValue(pdf, "Location:", data.location || "—", PDF_MARGIN, y);
  y = labelValue(pdf, "Project:", data.project_name, PDF_MARGIN, y);
  y = infoStartY;

  const rightX = PDF_MARGIN + 95;
  y = labelValue(pdf, "Secretary:", data.secretary_name || "—", rightX, y, 35);
  y = labelValue(pdf, "Chairperson:", data.chairperson_name || "—", rightX, y, 35);
  y = labelValue(pdf, "Confirmed by:", data.confirmed_by || "—", rightX, y, 35);

  y = Math.max(y, infoStartY + 32);

  // Attendees
  checkPage(30);
  y = sectionHeading(pdf, "Attendees", y, pageW);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.text));
  const attendeeLines = pdf.splitTextToSize(data.attendees || "No attendees listed", CONTENT_WIDTH);
  pdf.text(attendeeLines, PDF_MARGIN, y);
  y += attendeeLines.length * 4 + 4;

  // Agenda
  if (data.agenda) {
    checkPage(20);
    y = sectionHeading(pdf, "Agenda", y, pageW);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    const agendaLines = pdf.splitTextToSize(data.agenda, CONTENT_WIDTH);
    pdf.text(agendaLines, PDF_MARGIN, y);
    y += agendaLines.length * 4 + 4;
  }

  // Matters Arising
  if (data.matters_arising.length > 0) {
    checkPage(20);
    y = sectionHeading(pdf, "Matters Arising from Previous Minutes", y, pageW);
    data.matters_arising.forEach((ma, i) => {
      checkPage(12);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.primary));
      pdf.text(`${i + 1}. ${ma.description}`, PDF_MARGIN, y);
      y += 4;
      if (ma.reference_meeting) {
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text(`Ref: ${ma.reference_meeting}`, PDF_MARGIN + 5, y);
        y += 4;
      }
      if (ma.status) {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text(`Status: ${ma.status}`, PDF_MARGIN + 5, y);
        y += 5;
      }
    });
    y += 2;
  }

  // Discussions
  if (data.discussions.length > 0) {
    data.discussions.forEach((disc, i) => {
      checkPage(25);
      y = sectionHeading(pdf, `Discussion ${i + 1}: ${disc.topic}`, y, pageW);

      if (disc.discussion) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.text));
        const dLines = pdf.splitTextToSize(disc.discussion, CONTENT_WIDTH - 5);
        pdf.text(dLines, PDF_MARGIN + 3, y);
        y += dLines.length * 4 + 3;
      }
      if (disc.decisions) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...hexToRgb(BRAND.success));
        pdf.text("Decision:", PDF_MARGIN + 3, y);
        y += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.text));
        const decLines = pdf.splitTextToSize(disc.decisions, CONTENT_WIDTH - 8);
        pdf.text(decLines, PDF_MARGIN + 6, y);
        y += decLines.length * 4 + 3;
      }
      if (disc.follow_ups) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...hexToRgb(BRAND.accent));
        pdf.text("Follow-up:", PDF_MARGIN + 3, y);
        y += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.text));
        const fuLines = pdf.splitTextToSize(disc.follow_ups, CONTENT_WIDTH - 8);
        pdf.text(fuLines, PDF_MARGIN + 6, y);
        y += fuLines.length * 4 + 3;
      }
    });
  }

  // Resolutions
  if (data.resolutions.length > 0) {
    checkPage(20);
    y = sectionHeading(pdf, "Resolutions", y, pageW);
    data.resolutions.forEach((res) => {
      checkPage(12);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.primary));
      pdf.text(`Resolution ${res.number}:`, PDF_MARGIN, y);
      y += 4;
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.text));
      const resLines = pdf.splitTextToSize(res.text, CONTENT_WIDTH - 5);
      pdf.text(resLines, PDF_MARGIN + 3, y);
      y += resLines.length * 4 + 2;
      if (res.proposed_by || res.seconded_by) {
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        const propText = [res.proposed_by ? `Proposed by: ${res.proposed_by}` : "", res.seconded_by ? `Seconded by: ${res.seconded_by}` : ""].filter(Boolean).join("  |  ");
        pdf.text(propText, PDF_MARGIN + 3, y);
        y += 5;
      }
    });
    y += 2;
  }

  // AOB
  if (data.aob.length > 0) {
    checkPage(15);
    y = sectionHeading(pdf, "Any Other Business", y, pageW);
    data.aob.forEach((item, i) => {
      checkPage(10);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.text));
      pdf.text(`${i + 1}. ${item.topic}`, PDF_MARGIN, y);
      y += 4;
      if (item.discussion) {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        const aobLines = pdf.splitTextToSize(item.discussion, CONTENT_WIDTH - 5);
        pdf.text(aobLines, PDF_MARGIN + 3, y);
        y += aobLines.length * 4 + 3;
      }
    });
    y += 2;
  }

  // Action Items
  if (data.action_items.length > 0) {
    checkPage(20);
    y = sectionHeading(pdf, "Action Items", y, pageW);
    // Table header
    pdf.setFillColor(...hexToRgb(BRAND.tableAlt));
    pdf.rect(PDF_MARGIN, y, CONTENT_WIDTH, 6, "F");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text("#", PDF_MARGIN + 2, y + 4);
    pdf.text("Action", PDF_MARGIN + 8, y + 4);
    pdf.text("Assignee", PDF_MARGIN + 100, y + 4);
    pdf.text("Due", PDF_MARGIN + 135, y + 4);
    pdf.text("Status", PDF_MARGIN + 158, y + 4);
    y += 6;

    data.action_items.forEach((ai, i) => {
      checkPage(8);
      if (i % 2 === 0) {
        pdf.setFillColor(...hexToRgb(BRAND.bg));
        pdf.rect(PDF_MARGIN, y, CONTENT_WIDTH, 5, "F");
      }
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.text));
      pdf.text(String(i + 1), PDF_MARGIN + 2, y + 3.5);
      pdf.text(ai.action.substring(0, 60), PDF_MARGIN + 8, y + 3.5);
      pdf.text(ai.assignee || "—", PDF_MARGIN + 100, y + 3.5);
      pdf.text(ai.due_date || "—", PDF_MARGIN + 135, y + 3.5);
      pdf.text(ai.status?.replace("_", " ") || "—", PDF_MARGIN + 158, y + 3.5);
      y += 5;
    });
    y += 4;
  }

  // Next Meeting
  if (data.next_meeting?.date) {
    checkPage(15);
    y = sectionHeading(pdf, "Next Meeting", y, pageW);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.text));
    const nm = data.next_meeting;
    const nmDate = new Date(nm.date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    pdf.text(`Date: ${nmDate}${nm.time ? ` at ${nm.time}` : ""}${nm.location ? ` — ${nm.location}` : ""}`, PDF_MARGIN, y);
    y += 5;
    if (nm.proposed_agenda) {
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text(`Proposed Agenda: ${nm.proposed_agenda}`, PDF_MARGIN, y);
      y += 5;
    }
  }

  // Distribution List
  if (data.distribution_list) {
    checkPage(10);
    y = sectionHeading(pdf, "Distribution List", y, pageW);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...hexToRgb(BRAND.textMuted));
    pdf.text(data.distribution_list, PDF_MARGIN, y);
    y += 6;
  }

  // Signature lines
  checkPage(30);
  y += 10;
  const sigW = 60;
  pdf.setDrawColor(...hexToRgb(BRAND.text));
  pdf.setLineWidth(0.3);
  pdf.line(PDF_MARGIN, y, PDF_MARGIN + sigW, y);
  pdf.line(PDF_MARGIN + CONTENT_WIDTH - sigW, y, PDF_MARGIN + CONTENT_WIDTH, y);
  y += 4;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...hexToRgb(BRAND.textMuted));
  pdf.text("Secretary's Signature & Date", PDF_MARGIN, y);
  pdf.text("Chairperson's Signature & Date", PDF_MARGIN + CONTENT_WIDTH - sigW, y);

  drawFooter(pdf, pageW, pageH, pageNum);

  return pdf;
}

export async function downloadMeetingMinutesPdf(data: MeetingMinutesPdfData) {
  const pdf = await generateMeetingMinutesPdf(data);
  const safeName = (data.title || "minutes").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  pdf.save(`minutes-${data.meeting_date || "draft"}-${safeName}.pdf`);
}
