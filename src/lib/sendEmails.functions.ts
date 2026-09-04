import {
  generateReceiptPdfBase64,
  type ReceiptPdfInput,
} from "@/lib/generate-receipt-pdf";
import {
  generateFinancialReportPdfBase64,
  type FinancialReportPdfInput,
} from "@/lib/generate-financial-report-pdf";
import { createServerFn } from "@tanstack/react-start";

export const sendFinancialReport = createServerFn({ method: "POST" })
  .inputValidator((input: {
    to: string;
    landlordName: string;
    propertyName: string;
    pdfBase64: string;
    pdfFilename: string;
  }) => input)
  .handler(async ({ data }) => {
    const { sendFinancialReportEmail } = await import("@/lib/email.server");
    try {
      const result = await sendFinancialReportEmail({
        to: data.to,
        landlordName: data.landlordName,
        propertyName: data.propertyName,
        pdfBase64: data.pdfBase64,
        pdfFilename: data.pdfFilename,
      });
      return { success: true as const, id: result?.id };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

export const sendReceipt = createServerFn({ method: "POST" })
  .inputValidator((input: {
    to: string;
    tenantName: string;
    receiptNo: string;
    date: string;
    amount: number;
    propertyName: string;
    unitNumber: string;
    periodLabel: string;
    paymentType: string;
    method: string;
    pdfBase64: string;
    pdfFilename: string;
  }) => input)
  .handler(async ({ data }) => {
    const { sendReceiptEmail } = await import("@/lib/email.server");
    try {
      const result = await sendReceiptEmail({
        to: data.to,
        tenantName: data.tenantName,
        receiptNo: data.receiptNo,
        date: data.date,
        amount: data.amount,
        propertyName: data.propertyName,
        unitNumber: data.unitNumber,
        periodLabel: data.periodLabel,
        paymentType: data.paymentType,
        method: data.method,
        pdfBase64: data.pdfBase64,
        pdfFilename: data.pdfFilename,
      });
      return { success: true as const, id: result?.id };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

export const sendReminder = createServerFn({ method: "POST" })
  .inputValidator((input: {
    to: string;
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    monthlyRent: number;
    dueDate: string;
    balance: number;
    whatsappLink: string;
  }) => input)
  .handler(async ({ data }) => {
    const { sendTenantReminderEmail } = await import("@/lib/email.server");
    try {
      const result = await sendTenantReminderEmail({
        to: data.to,
        tenantName: data.tenantName,
        propertyName: data.propertyName,
        unitNumber: data.unitNumber,
        monthlyRent: data.monthlyRent,
        dueDate: data.dueDate,
        balance: data.balance,
        whatsappLink: data.whatsappLink,
      });
      return { success: true as const, id: result?.id };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

export const sendSampleAll = createServerFn({ method: "POST" })
  .inputValidator((input: { to: string }) => input)
  .handler(async ({ data }) => {
    const { sendLicenseKeyEmail, sendFinancialReportEmail, sendReceiptEmail, sendTenantReminderEmail } = await import("@/lib/email.server");
    const results: { type: string; id?: string; error?: string }[] = [];

    try {
      const r1 = await sendLicenseKeyEmail({
        to: data.to, companyName: "Nama Holdings Ltd.", licenseKey: "XK7M2AB9Q3",
        adminName: "Nama Safari", adminEmail: "habicopropertymanagers@gmail.com",
        planName: "Full Suite", amount: 150000, paymentDate: "10 July 2026",
      });
      results.push({ type: "license", id: r1?.id });
    } catch (e: any) { results.push({ type: "license", error: e.message }); }

    try {
      const reportData: FinancialReportPdfInput = {
        date: new Date().toISOString().slice(0, 10),
        landlordName: "NAMA SAFARI",
        landlordTel: "0702239607",
        propertyName: "Nama Holdings Building",
        propertyLocation: "KAMPALA, UGANDA",
        tenantContext: "The property is occupied by 3 tenants with active lease agreements.",
        totalRentCollected: 4500000,
        totalRentDue: 6000000,
        balance: 1500000,
        companyFee: 405000,
        landlordShare: 2970000,
        pendingToLandlord: 1500000,
        paymentPeriods: [
          {
            title: "July 2026",
            totalPaid: 2500000,
            balance: 500000,
            payments: [
              { date: "2026-07-05", amount: 1000000, status: "Paid" },
              { date: "2026-07-12", amount: 1500000, status: "Paid" },
            ],
          },
          {
            title: "June 2026",
            totalPaid: 2000000,
            balance: 1000000,
            payments: [
              { date: "2026-06-03", amount: 1000000, status: "Paid" },
              { date: "2026-06-15", amount: 1000000, status: "Paid" },
            ],
          },
        ],
      };
      const pdfBase64 = generateFinancialReportPdfBase64(reportData);

      const r2 = await sendFinancialReportEmail({
        to: data.to, landlordName: "Nama Safari", propertyName: "Nama Holdings Building",
        pdfBase64, pdfFilename: "habico-financial-report-sample.pdf",
      });
      results.push({ type: "report", id: r2?.id });
    } catch (e: any) { results.push({ type: "report", error: e.message }); }

    try {
      const receiptInput: ReceiptPdfInput = {
        receiptNo: "SAMPLE-001",
        date: new Date().toISOString().slice(0, 10),
        tenantName: "Nama Safari",
        propertyName: "Nama Holdings Building",
        unitNumber: "A1",
        periodLabel: "July 2026",
        paymentType: "rent",
        method: "mobile_money",
        amount: 1500000,
      };
      const pdfBase64 = generateReceiptPdfBase64(receiptInput);

      const r3 = await sendReceiptEmail({
        to: data.to, tenantName: "Nama Safari", receiptNo: "SAMPLE-001",
        date: new Date().toISOString().slice(0, 10), amount: 1500000,
        propertyName: "Nama Holdings Building", unitNumber: "A1",
        periodLabel: "July 2026", paymentType: "rent", method: "mobile_money",
        pdfBase64, pdfFilename: "habico-receipt-sample.pdf",
      });
      results.push({ type: "receipt", id: r3?.id });
    } catch (e: any) { results.push({ type: "receipt", error: e.message }); }

    try {
      const r4 = await sendTenantReminderEmail({
        to: data.to, tenantName: "Nama Safari",
        propertyName: "Nama Holdings Building", unitNumber: "A1",
        monthlyRent: 1500000, dueDate: "25 July 2026", balance: 1500000,
        whatsappLink: "https://wa.me/256702239607?text=" + encodeURIComponent("Hi Habico, I'm checking on my rent payment for Nama Holdings Building - Unit A1."),
      });
      results.push({ type: "reminder", id: r4?.id });
    } catch (e: any) { results.push({ type: "reminder", error: e.message }); }

    return { success: true, results };
  });