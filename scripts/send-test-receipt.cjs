require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");
const jsPDF = require("jspdf").jsPDF || require("jspdf").default || require("jspdf");

const resend = new Resend(process.env.RESEND_API_KEY);
const logoBase64 = fs.readFileSync(path.join(__dirname, "logo-email-base64.txt"), "utf8").trim();
const logoDataUrl = `data:image/png;base64,${logoBase64}`;

const HABICO_ADDRESS = "Basiima Buildings, 2nd Floor Room C03, Kampala";
const HABICO_PHONE = "0702 239 607 / 0756 742 220";
const HABICO_TAX_ID = "URA-TIN-123456789";

function brandedWrapper(title, body) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><img src="${logoDataUrl}" alt="Habico" width="160" height="90" style="display:block;border:0;outline:none;border-radius:4px;" /></td>
            <td align="right" style="font-size:11px;color:#94a3b8;vertical-align:middle;">PROPERTY<br/>MANAGERS</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 40px;background:#f8fafc;border-bottom:1px solid #e2e8f0;"><p style="margin:0;padding:14px 0;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1px;">${title}</p></td></tr>
        <tr><td style="padding:36px 40px 24px;">${body}</td></tr>
        <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:11px;color:#94a3b8;line-height:1.6;"><strong style="color:#64748b;">Habico Property Managers</strong><br/>${HABICO_ADDRESS}<br/>${HABICO_PHONE} · Tax ID: ${HABICO_TAX_ID}</td>
            <td align="right" style="font-size:10px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Habico<br/>All rights reserved.</td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Generate PDF receipt using jsPDF
function generateReceiptPdf() {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const MARGIN = 15;
  const CONTENT_W = 180;

  // Watermark
  try {
    pdf.setGState(new pdf.GState({ opacity: 0.05 }));
    pdf.addImage(logoDataUrl, "PNG", (pageW - 70) / 2, (pageH - 70) / 2, 70, 70);
    pdf.setGState(new pdf.GState({ opacity: 1 }));
  } catch (e) {}

  // Header band
  const h = 36;
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageW, h, "F");
  try { pdf.addImage(logoDataUrl, "PNG", MARGIN, 4, 28, 28); } catch {}

  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("HABICO PROPERTY MANAGERS", MARGIN + 34, 14);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(148, 163, 184);
  pdf.text("PAYMENT RECEIPT", MARGIN + 34, 22);
  pdf.setFontSize(7);
  pdf.text("Basiima Building, 2nd Floor Room C03, Kampala", MARGIN + 34, 28);
  pdf.text("0756742220 | 0702239607 | habicopropertymanagers@gmail.com", MARGIN + 34, 32);
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(1.5);
  pdf.line(0, h, pageW, h);

  let y = h + 10;

  // Receipt number and date
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);
  pdf.text("RECEIPT NO.", pageW - MARGIN, y, { align: "right" });
  y += 4;
  pdf.setFontSize(10);
  pdf.setTextColor(30, 41, 59);
  pdf.text("VR-2607-0001", pageW - MARGIN, y, { align: "right" });
  y += 5;
  pdf.setFontSize(7);
  pdf.text("DATE", pageW - MARGIN, y, { align: "right" });
  y += 4;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("21 July 2026", pageW - MARGIN - 20, y, { align: "right" });
  y += 10;

  // PAY TO box
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 36, 2, 2, "FD");
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);
  pdf.text("PAID TO", MARGIN + 5, y + 6);
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Abdullah", MARGIN + 5, y + 14);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text("Phone: +256745368426", MARGIN + 5, y + 20);
  pdf.text("Address: NTINDA", MARGIN + 5, y + 26);
  y += 42;

  // Amount box
  pdf.setFillColor(245, 158, 11);
  pdf.roundedRect(MARGIN, y, CONTENT_W, 20, 3, 3, "F");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text("AMOUNT PAID", MARGIN + 8, y + 8);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("UGX 600,000", MARGIN + 8, y + 16);
  y += 26;

  // Payment details
  const drawDetail = (label, value, x, rowY) => {
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, x, rowY);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 41, 59);
    pdf.text(value || "\u2014", x + 30, rowY);
  };
  drawDetail("Description:", "system development phase 1", MARGIN, y);
  drawDetail("Category:", "contractor", MARGIN + CONTENT_W / 2 + 5, y);
  y += 6;
  drawDetail("Payment Method:", "Cash Payment", MARGIN, y);
  drawDetail("Reference:", "\u2014", MARGIN + CONTENT_W / 2 + 5, y);
  y += 10;

  // Divider
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, y, pageW - MARGIN, y);
  y += 8;

  // Signatures
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);
  pdf.text("AUTHORIZED BY", MARGIN, y);
  y += 18;
  const sigW = 50;
  const col2X = MARGIN + CONTENT_W / 3 + 5;
  const col3X = MARGIN + (CONTENT_W / 3) * 2 + 10;
  pdf.setDrawColor(30, 41, 59);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, y, MARGIN + sigW, y);
  pdf.line(col2X, y, col2X + sigW, y);
  pdf.line(col3X, y, col3X + sigW, y);
  y += 4;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.text("Director's Signature & Date", MARGIN, y);
  pdf.text("Finance Officer's Signature & Date", col2X, y);
  pdf.text("Received By (Signature & Date)", col3X, y);

  // Footer
  const footerY = pageH - 18;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(MARGIN, footerY, pageW - MARGIN, footerY);
  pdf.setFontSize(6);
  pdf.setTextColor(100, 116, 139);
  pdf.text("This is a computer-generated receipt. No signature required unless above.", MARGIN, footerY + 5);
  pdf.text(`\u00a9 ${new Date().getFullYear()} Habico Property Managers Ltd.`, MARGIN, footerY + 9);

  return pdf;
}

async function main() {
  // Generate PDF
  const pdf = generateReceiptPdf();
  const pdfBase64 = pdf.output("dataurlstring").split(",")[1];

  const body = `
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="font-size:14px;color:#475569;line-height:1.7;">
    <p style="margin:0 0 16px;">Dear <strong style="color:#1e293b;">Abdullah</strong>,</p>
    <p style="margin:0 0 16px;">Thank you for your service. A payment of <strong style="color:#059669;">UGX 600,000</strong> has been processed by Habico Property Managers.</p>
    <p style="margin:0 0 16px;">Your receipt is attached to this email for your records.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin:16px 0;">
      <tr><td style="padding:16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
          <tr><td style="padding:4px 0;color:#64748b;">Receipt #</td><td style="padding:4px 0;font-weight:600;text-align:right;">VR-2607-0001</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">Date</td><td style="padding:4px 0;font-weight:600;text-align:right;">21 July 2026</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">Description</td><td style="padding:4px 0;font-weight:600;text-align:right;">system development phase 1</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">Category</td><td style="padding:4px 0;font-weight:600;text-align:right;">contractor</td></tr>
          <tr><td style="padding:4px 0;color:#64748b;">Payment Method</td><td style="padding:4px 0;font-weight:600;text-align:right;">cash</td></tr>
          <tr><td style="padding:8px 0 4px;border-top:1px solid #e2e8f0;font-weight:700;font-size:15px;">Amount Paid</td><td style="padding:8px 0 4px;border-top:1px solid #e2e8f0;font-weight:700;font-size:15px;text-align:right;color:#059669;">UGX 600,000</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">For questions, contact us at <a href="mailto:support@habico.ug" style="color:#2563eb;">support@habico.ug</a> or call ${HABICO_PHONE}.</p>
    <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Best regards,<br/><strong style="color:#475569;">The Habico Team</strong></p>
  </td></tr>
</table>`;

  const result = await resend.emails.send({
    from: "Habico Payments <payments@habico.ug>",
    to: ["info.clickandlearnict@gmail.com"],
    subject: "Payment Receipt #VR-2607-0001 \u2014 Habico Property Managers",
    html: brandedWrapper("Payment Receipt", body),
    attachments: [
      { filename: "receipt-VR-2607-0001-abdullah.pdf", content: pdfBase64 }
    ],
  });

  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  }
  console.log("Email sent with PDF attachment! ID:", result.data?.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
