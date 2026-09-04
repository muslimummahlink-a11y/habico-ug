import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { sendFinancialReport } from "@/lib/sendEmails.functions";
import { toast } from "sonner";

interface TenantAccount {
  name: string;
  phone: string;
  monthlyRent: number;
  arrearsAtHandover: number;
  rentIncrement?: { amount: number; from: string };
  payments: { date: string; amount: number; period: string }[];
  totalPaid: number;
  arrears: number;
  remarks: string;
}

interface Challenge {
  author: string;
  items: string[];
}

export interface FinancialReportData {
  date: string;
  clientName: string;
  clientTitle: string;
  clientLocation: string;
  clientPhone: string;
  propertyDescription: string;
  introParagraph: string;
  tenants: TenantAccount[];
  challenges: Challenge[];
  totalRentPaid: number;
  totalArrears: number;
  companyFeePercent: number;
  companyFeeAmount: number;
  amountToDeposit: number;
  signatoryName: string;
  signatoryPhone: string;
}

function formatNum(n: number) {
  return n.toLocaleString("en-UG");
}

function formatDate(d: string) {
  const parts = d.split("-");
  if (parts.length === 3) {
    const [y, m, day] = parts;
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    return `${parseInt(day)}.${m}.${y}`;
  }
  return d;
}

function numberToWords(n: number): string {
  const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (n === 0) return "zero";
  const num = Math.floor(Math.abs(n));
  function convert(m: number): string {
    if (m < 20) return ONES[m];
    if (m < 100) return TENS[Math.floor(m / 10)] + (m % 10 ? " " + ONES[m % 10] : "");
    if (m < 1000) return ONES[Math.floor(m / 100)] + " hundred" + (m % 100 ? " " + convert(m % 100) : "");
    if (m < 1_000_000) return convert(Math.floor(m / 1000)) + " thousand" + (m % 1000 ? " " + convert(m % 1000) : "");
    if (m < 1_000_000_000) return convert(Math.floor(m / 1_000_000)) + " million" + (m % 1_000_000 ? " " + convert(m % 1_000_000) : "");
    return convert(Math.floor(m / 1_000_000_000)) + " billion" + (m % 1_000_000_000 ? " " + convert(m % 1_000_000_000) : "");
  }
  return convert(num);
}

export function HabicoFinancialReport({ data }: { data: FinancialReportData }) {
  const printRef = useRef<HTMLDivElement>(null);

  async function handleDownloadPdf() {
    if (!printRef.current) return;
    try {
      const imgData = await toPng(printRef.current, { backgroundColor: "#fff" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (printRef.current.scrollHeight * imgW) / printRef.current.scrollWidth;
      let left = imgH;
      let pos = margin;
      pdf.addImage(imgData, "PNG", margin, pos, imgW, imgH);
      left -= pageH - margin * 2;
      while (left > 0) {
        pdf.addPage();
        pos = margin - (imgH - left);
        pdf.addImage(imgData, "PNG", margin, pos, imgW, imgH);
        left -= pageH - margin * 2;
      }
      const safeName = (data.clientName || "client").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      pdf.save(`habico-financial-report-${safeName}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    }
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    const content = printRef.current?.innerHTML ?? "";
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Financial Report - Habico</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Inter','Segoe UI',system-ui,sans-serif; font-size: 10px; line-height: 1.5; color: #1e293b; padding: 16px; background: #fff; }
        .brand-header { background: linear-gradient(135deg,#0f172a,#1e293b); color: #fff; padding: 16px 20px; border-radius: 8px 8px 0 0; margin: -16px -16px 16px; display: flex; align-items: center; justify-content: space-between; }
        .brand-header h1 { font-size: 18px; font-weight: 800; letter-spacing: 2px; margin: 0; }
        .brand-header .sub { font-size: 8px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin: 2px 0 0; }
        .brand-header .badge { background: #f59e0b; color: #fff; padding: 3px 12px; border-radius: 4px; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .report-title { text-align: center; margin: 16px 0 12px; }
        .report-title h2 { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
        .report-title .line { width: 60px; height: 2px; background: #f59e0b; margin: 4px auto 0; border-radius: 1px; }
        .client-address { margin: 8px 0 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
        .client-address p { margin: 2px 0; font-size: 10px; }
        .client-address .name { font-weight: 700; font-size: 11px; }
        .client-address .label { color: #64748b; }
        h3 { font-size: 11px; font-weight: 700; margin: 14px 0 4px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 1px; }
        h4 { font-size: 10px; font-weight: 700; margin: 10px 0 4px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; border-radius: 4px; overflow: hidden; border: 1px solid #e2e8f0; }
        td, th { padding: 4px 8px; text-align: left; vertical-align: top; font-size: 9px; }
        th { font-weight: 700; background: #1e293b; color: #fff; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .summary-row td { font-weight: 700; background: #1e293b; color: #fff; }
        .free-text { margin: 4px 0; text-align: justify; color: #475569; font-size: 10px; }
        ul { margin: 4px 0; padding-left: 20px; }
        li { font-size: 9px; margin: 2px 0; color: #475569; }
        .signature-area { margin-top: 20px; }
        .signature-line { border-top: 2px solid #1e293b; width: 200px; margin-top: 24px; padding-top: 4px; }
        .scanned-by { text-align: center; font-size: 7px; color: #94a3b8; margin-top: 16px; }
      </style>
      </head>
      <body>${content}
        <div class="scanned-by">Habico Property Managers — Basiima Building, 2nd Floor Room C03, Kampala · 0756742220 | 0702239607</div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  async function handleEmailReport() {
    if (!printRef.current) return;
    try {
      const imgData = await toPng(printRef.current, { backgroundColor: "#fff" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (printRef.current.scrollHeight * imgW) / printRef.current.scrollWidth;
      let left = imgH;
      let pos = margin;
      pdf.addImage(imgData, "PNG", margin, pos, imgW, imgH);
      left -= pageH - margin * 2;
      while (left > 0) {
        pdf.addPage();
        pos = margin - (imgH - left);
        pdf.addImage(imgData, "PNG", margin, pos, imgW, imgH);
        left -= pageH - margin * 2;
      }
      const arr = pdf.output("arraybuffer");
      const bytes = new Uint8Array(arr);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const pdfBase64 = btoa(binary);
      const safeName = data.clientName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const result = await sendFinancialReport({
        to: "",
        landlordName: data.clientName,
        propertyName: data.propertyDescription,
        pdfBase64,
        pdfFilename: `habico-financial-report-${safeName}.pdf`,
      });
      if (result.success) {
        toast.success("Financial report emailed successfully");
      } else {
        toast.error(result.error ?? "Failed to send report");
      }
    } catch (err) {
      toast.error("Failed to generate or send report");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleDownloadPdf} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />PDF
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />Print Report
        </Button>
        <Button onClick={handleEmailReport} variant="outline" size="sm">
          <Mail className="mr-2 h-4 w-4" />Email Report
        </Button>
      </div>

      <div
        ref={printRef}
        className="rounded-lg border bg-white text-xs leading-relaxed text-black shadow-sm"
        style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: "16px" }}
      >
        {/* Brand Header */}
        <div className="brand-header">
          <div>
            <h1>HABICO</h1>
            <p className="sub">Property Managers · Kampala, Uganda</p>
          </div>
          <div className="badge">Financial Report</div>
        </div>

        {/* Date */}
        <p style={{ margin: "6px 0", fontSize: "10px", color: "#64748b" }}>{data.date}</p>

        {/* Client Address Block */}
        <div className="client-address">
          <p className="name">{data.clientName}</p>
          <p>{data.clientTitle}</p>
          <p>{data.clientLocation}</p>
          <p><span className="label">Tel: </span>{data.clientPhone}</p>
        </div>

        {/* Report Title */}
        <div className="report-title">
          <h2>FINANCIAL REPORT FOR {data.propertyDescription.toUpperCase()}</h2>
          <div className="line" />
        </div>

        {/* Intro Paragraph */}
        <p className="free-text">{data.introParagraph}</p>

        {/* Tenant List */}
        <h3>Tenants</h3>
        <ol style={{ margin: "4px 0", paddingLeft: "20px" }}>
          {data.tenants.map((t, i) => (
            <li key={i} style={{ fontSize: "9px", margin: "3px 0", color: "#475569" }}>
              <span className="font-bold">{t.name}</span>, Tel:{t.phone}, Monthly rent payable Ugx {formatNum(t.monthlyRent)}/=
              {t.arrearsAtHandover > 0 && (
                <span> who had arrears of {t.arrearsAtHandover} months at the time of assuming management responsibilities</span>
              )}
              {t.arrearsAtHandover === 0 && (
                <span> who had no arrears at the time of assuming management responsibilities</span>
              )}
              {t.rentIncrement && (
                <span> with a monthly rental increment to Ugx {formatNum(t.rentIncrement.amount)} which was to commence in {t.rentIncrement.from}</span>
              )}
              .
            </li>
          ))}
        </ol>

        {/* Challenges */}
        {data.challenges.length > 0 && (
          <>
            <h3>Challenges</h3>
            {data.challenges.map((c, i) => (
              <div key={i}>
                <h4 style={{ fontSize: "9px", fontWeight: 700, margin: "6px 0 2px" }}>{c.author}</h4>
                <ul>
                  {c.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}

        {/* Individual Tenant Accounts */}
        <h3>Individual Accounts</h3>
        {data.tenants.map((t, i) => (
          <div key={i}>
            <h4 style={{ fontSize: "10px", fontWeight: 700, margin: "8px 0 2px" }}>{i + 1}- {t.name.toUpperCase()}</h4>
            <table>
              <thead>
                <tr>
                  <th>Payment Date</th>
                  <th>Rent Paid</th>
                  <th>Duration Paid For</th>
                </tr>
              </thead>
              <tbody>
                {t.payments.map((p, j) => (
                  <tr key={j}>
                    <td>{p.date}</td>
                    <td className="text-right">{formatNum(p.amount)}</td>
                    <td>{p.period}</td>
                  </tr>
                ))}
                <tr className="summary-row">
                  <td>TOTAL RENT PAID</td>
                  <td className="text-right">{formatNum(t.totalPaid)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Summary Table */}
        <h3>Summary</h3>
        <table>
          <thead>
            <tr>
              <th>ITEM</th>
              <th>Tenant</th>
              <th className="text-right">Rent Paid</th>
              <th className="text-right">Arrears</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: "#f0fdf4" }}>
              <td style={{ fontWeight: 700, color: "#1e293b" }}>HABICO CLIENT</td>
              <td colSpan={4} />
            </tr>
            {data.tenants.map((t, i) => (
              <tr key={i}>
                <td className="text-center">{i + 1}</td>
                <td className="font-bold">{t.name}</td>
                <td className="text-right">{formatNum(t.totalPaid)}</td>
                <td className="text-right">{t.arrears > 0 ? formatNum(t.arrears) : "-"}</td>
                <td style={{ fontSize: "8px", color: t.arrears > 0 ? "#dc2626" : "#059669" }}>{t.remarks}</td>
              </tr>
            ))}
            <tr className="summary-row">
              <td colSpan={2}>TOTAL</td>
              <td className="text-right">{formatNum(data.totalRentPaid)}</td>
              <td className="text-right">{formatNum(data.totalArrears)}</td>
              <td />
            </tr>
          </tbody>
        </table>

        {/* Fees & Deposit */}
        <div style={{ marginTop: "10px" }}>
          <p className="free-text">
            Company fees {data.companyFeePercent}% of total collection UGX. {formatNum(data.companyFeeAmount)}/=
            ({numberToWords(data.companyFeeAmount).charAt(0).toUpperCase() + numberToWords(data.companyFeeAmount).slice(1)})
          </p>
          <p className="free-text">
            Amount to be deposited to client's account: UGX. {formatNum(data.amountToDeposit)}/=
            (Only {numberToWords(data.amountToDeposit).charAt(0).toUpperCase() + numberToWords(data.amountToDeposit).slice(1)} shillings)
          </p>
          <p className="free-text">
            Kindly avail an official Account, Name and Bank through writing on to which the above money is supposed to be deposited.
          </p>
        </div>

        {/* Thank you */}
        <p className="free-text" style={{ fontStyle: "italic", marginTop: "10px" }}>Thank you for your cooperation.</p>

        {/* Signature */}
        <div className="signature-area">
          <p style={{ fontSize: "10px", margin: 0 }}>Yours Sincerely,</p>
          <div className="signature-line">
            <p style={{ fontWeight: 700, margin: 0, fontSize: "11px", color: "#1e293b" }}>
              {data.signatoryName}, {data.signatoryPhone}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#64748b" }}>
              For HABICO PROPERTY MANAGERS LIMITED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BuildReportInput {
  property: {
    id: string;
    name: string;
    location: string | null;
    owner_id: string | null;
    landlord_share_percent?: number | null;
  } | null;
  ownerProfile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  leases: any[];
  payments: any[];
}

export function buildPropertyReportData(input: BuildReportInput): FinancialReportData | null {
  const { property, ownerProfile, leases, payments } = input;
  if (!property) return null;

  const now = new Date();
  const months = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const dateStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const landlordSharePct = Number(property.landlord_share_percent ?? 90);
  const companyFeePercent = 100 - landlordSharePct;
  const signatoryName = "Nabbosa Leila";
  const signatoryPhone = "0756742220";

  const clientName = ownerProfile?.full_name?.toUpperCase() ?? ownerProfile?.email ?? "CLIENT";
  const clientPhone = ownerProfile?.phone ?? "";
  const clientLocation = property.location?.toUpperCase() ?? property.name.toUpperCase();

  const tenants: TenantAccount[] = leases.map((l: any) => {
    const tenantPayments = (payments ?? []).filter(
      (p: any) => p.lease_id === l.id && (p.payment_type === "Rent" || !p.payment_type),
    );
    const totalPaid = tenantPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const arrears = Math.max(0, Number(l.outstanding_balance ?? 0));
    const sortedPayments = [...tenantPayments].sort(
      (a: any, b: any) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime(),
    );
    const arrearsMonths = arrears > 0 && Number(l.monthly_rent) > 0
      ? Math.round(arrears / Number(l.monthly_rent))
      : 0;

    return {
      name: l.profile?.full_name ?? l.profile?.email ?? "Tenant",
      phone: l.profile?.phone ?? "",
      monthlyRent: Number(l.monthly_rent),
      arrearsAtHandover: arrearsMonths,
      payments: sortedPayments.map((p: any) => {
        let periodLabel = p.period_label || "";
        if (!periodLabel && p.period_start && p.period_end) {
          const s = new Date(p.period_start);
          const e = new Date(p.period_end);
          periodLabel = `${months[s.getMonth()]} ${s.getFullYear()} – ${months[e.getMonth()]} ${e.getFullYear()}`;
        }
        if (!periodLabel) {
          const d = new Date(p.payment_date);
          periodLabel = `${months[d.getMonth()]} ${d.getFullYear()}`;
        }
        return {
          date: formatDate(p.payment_date),
          amount: Number(p.amount),
          period: periodLabel,
        };
      }),
      totalPaid,
      arrears,
      remarks: arrears > 0 ? formatDate(now.toISOString().split("T")[0]) : "-",
    };
  });

  const totalRentPaid = tenants.reduce((s, t) => s + t.totalPaid, 0);
  const totalArrears = tenants.reduce((s, t) => s + t.arrears, 0);
  const companyFeeAmount = Math.round(totalRentPaid * (companyFeePercent / 100));
  const amountToDeposit = totalRentPaid - companyFeeAmount;

  const tenantItems = tenants.map((t) => {
    let desc = `${t.name}, Tel:${t.phone}, Monthly rent payable Ugx ${formatNum(t.monthlyRent)}/=`;
    if (t.arrearsAtHandover > 0) {
      desc += ` who had arrears of ${t.arrearsAtHandover} month${t.arrearsAtHandover > 1 ? "s" : ""} at the time of assuming management responsibilities`;
    } else {
      desc += ` who had no arrears at the time of assuming management responsibilities`;
    }
    return desc;
  });

  const introParagraph = `We assumed responsibilities to manage the said property in October 2025. The property has ${tenants.length} tenant(s) namely:\n\u2022 ${tenantItems.join("\n\u2022 ")}.`;

  return {
    date: dateStr,
    clientName,
    clientTitle: `TRUSTEE OF THE ESTATE OF ${clientName}`,
    clientLocation,
    clientPhone,
    propertyDescription: `COMMERCIAL TENEMENTS AT ${property.name.toUpperCase()}`,
    introParagraph,
    tenants,
    challenges: [],
    totalRentPaid,
    totalArrears,
    companyFeePercent,
    companyFeeAmount,
    amountToDeposit,
    signatoryName,
    signatoryPhone,
  };
}
