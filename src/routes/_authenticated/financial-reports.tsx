import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { useCompanyId } from "@/hooks/use-company-id";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Landmark,
  ScrollText,
  FileText,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CalendarDays,
  Users,
  BarChart3,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { HabicoFinancialReport, buildPropertyReportData } from "@/components/habico-financial-report";
import type { FinancialReportData } from "@/components/habico-financial-report";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/financial-reports")({
  head: () => ({ meta: [{ title: "Financial Reports — Habico Portal" }] }),
  component: FinancialReportsPage,
});

function formatUGX(amount: number) {
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(1)}K`;
  return `UGX ${amount.toLocaleString()}`;
}

function FinancialReportsPage() {
  const role = useHighestRole();
  const { data: companyId } = useCompanyId();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { data: payments = [] } = useQuery({
    queryKey: ["financial-reports-payments", companyId],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("*, leases!inner(monthly_rent, units!inner(unit_number, properties!inner(name)), tenant_id)");
      if (companyId) q = q.eq("leases.units.company_id", companyId);
      const { data, error } = await q.order("payment_date", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((p: any) => p.leases?.tenant_id).filter(Boolean)));
      const { data: tenantList } = ids.length
        ? await supabase.from("tenants").select("id, full_name, email, phone").in("id", ids)
        : { data: [] };
      const map = new Map((tenantList ?? []).map((t: any) => [t.id, t]));
      return (data ?? []).map((p: any) => ({ ...p, tenant: map.get(p.leases?.tenant_id) }));
    },
  });

  const { data: activeLeases = [] } = useQuery({
    queryKey: ["financial-reports-active-leases", companyId],
    queryFn: async () => {
      let q = supabase
        .from("leases")
        .select("*, units!inner(unit_number, properties!inner(name))")
        .eq("status", "active");
      if (companyId) q = q.eq("units.company_id", companyId);
      const { data, error } = await q;
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((l: any) => l.tenant_id).filter(Boolean)));
      const { data: tenantList } = ids.length
        ? await supabase.from("tenants").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const map = new Map((tenantList ?? []).map((t: any) => [t.id, t]));
      return (data ?? []).map((l: any) => ({ ...l, profile: map.get(l.tenant_id) }));
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["financial-reports-expenses", companyId],
    queryFn: async () => {
      let q = supabase
        .from("expenses")
        .select("*, expense_categories(name)");
      if (companyId) q = q.eq("company_id", companyId);
      const { data, error } = await q.order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: totalUnits = 0 } = useQuery({
    queryKey: ["financial-reports-total-units", companyId],
    queryFn: async () => {
      let q = supabase.from("units").select("*", { count: "exact", head: true });
      if (companyId) q = q.eq("company_id", companyId);
      const { count } = await q;
      return count ?? 0;
    },
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["financial-reports-properties", companyId],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("id, name, location, owner_id, landlord_share_percent");
      if (companyId) q = q.eq("company_id", companyId);
      const { data, error } = await q.order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

const { data: ownerProfiles = [] } = useQuery({
    queryKey: ["financial-reports-owners", properties],
    queryFn: async () => {
      const ids = properties.map((p: any) => p.owner_id).filter(Boolean);
      const unique = [...new Set(ids)];
      if (unique.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", unique);
      return (data ?? []) as any[];
    },
  });

  // Helper to get owner name for a property
  const getOwnerName = (ownerId: string | null) => {
    if (!ownerId) return "";
    const owner = ownerProfiles.find((p: any) => p.id === ownerId);
    return owner ? owner.full_name || "" : "";
  };

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [reportFromMonth, setReportFromMonth] = useState(1);
  const [reportFromYear, setReportFromYear] = useState(now.getFullYear());
  const [reportToMonth, setReportToMonth] = useState(now.getMonth() + 1);
  const [reportToYear, setReportToYear] = useState(now.getFullYear());
  const pnlRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);
  const commissionRef = useRef<HTMLDivElement>(null);

  async function downloadPdf(el: HTMLDivElement | null, filename: string) {
    if (!el) return;
    try {
      const imgData = await toPng(el, { backgroundColor: "#fff" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (el.scrollHeight * imgW) / el.scrollWidth;
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
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed", err);
    }
  }

  const { data: propertyLeases = [] } = useQuery({
    queryKey: ["financial-reports-property-leases", selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      const { data: unitIds } = await supabase
        .from("units")
        .select("id")
        .eq("property_id", selectedPropertyId);
      const uids = (unitIds ?? []).map((u: any) => u.id);
      if (uids.length === 0) return [];
      const { data, error } = await supabase
        .from("leases")
        .select("*, units!inner(unit_number)")
        .in("unit_id", uids)
        .order("start_date", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((l: any) => l.tenant_id).filter(Boolean))];
      const { data: tenantList } = ids.length
        ? await supabase.from("tenants").select("id, full_name, email, phone").in("id", ids)
        : { data: [] };
      const pmap = new Map((tenantList ?? []).map((t: any) => [t.id, t]));
      return (data ?? []).map((l: any) => ({ ...l, profile: pmap.get(l.tenant_id) }));
    },
    enabled: !!selectedPropertyId,
  });

  const { data: propertyPayments = [] } = useQuery({
    queryKey: ["financial-reports-property-payments", selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      const { data: unitIds } = await supabase
        .from("units")
        .select("id")
        .eq("property_id", selectedPropertyId);
      const uids = (unitIds ?? []).map((u: any) => u.id);
      if (uids.length === 0) return [];
      const { data: leaseIds } = await supabase
        .from("leases")
        .select("id")
        .in("unit_id", uids);
      const lids = (leaseIds ?? []).map((l: any) => l.id);
      if (lids.length === 0) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .in("lease_id", lids)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!selectedPropertyId,
  });

  const filteredPropertyPayments = propertyPayments.filter((p: any) => {
    const d = new Date(p.payment_date);
    const from = new Date(reportFromYear, reportFromMonth - 1, 1);
    const to = new Date(reportToYear, reportToMonth, 0);
    return d >= from && d <= to;
  });

  const propertyReportData: FinancialReportData | null = selectedPropertyId && propertyLeases.length > 0
    ? (() => {
        const prop = properties.find((p: any) => p.id === selectedPropertyId);
        if (!prop) return null;
        const owner = ownerProfiles.find((p: any) => p.id === prop.owner_id);
        if (!owner) return null;
        return buildPropertyReportData({
          property: prop,
          ownerProfile: owner,
          leases: propertyLeases,
          payments: filteredPropertyPayments,
        });
      })()
    : null;

  const calendarMonths = (() => {
    const months: { label: string; year: number; month: number }[] = [];
    let y = reportFromYear;
    let m = reportFromMonth;
    while (y < reportToYear || (y === reportToYear && m <= reportToMonth)) {
      const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      months.push({ label: `${names[m - 1]} ${y}`, year: y, month: m });
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return months;
  })();

  function getMonthLabel(year: number, month: number) {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${names[month - 1]} ${year}`;
  }

  function isMonthPaid(payments: any[], year: number, month: number): boolean {
    return payments.some((p: any) => {
      if (p.period_start && p.period_end) {
        const start = new Date(p.period_start);
        const end = new Date(p.period_end);
        const check = new Date(year, month - 1, 15);
        if (check >= start && check <= end) return true;
      }
      if (p.period_label) {
        const target = getMonthLabel(year, month).toLowerCase();
        if (p.period_label.toLowerCase().trim() === target) return true;
        const fullMonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
        if (p.period_label.toLowerCase().trim() === `${fullMonths[month - 1]} ${year}`) return true;
      }
      const pd = new Date(p.payment_date);
      return pd.getFullYear() === year && pd.getMonth() + 1 === month;
    });
  }

  const now2 = new Date();
  const isFutureMonth = (yr: number, m: number) => yr > now2.getFullYear() || (yr === now2.getFullYear() && m > now2.getMonth() + 1);

  const years = Array.from(
    new Set([
      ...payments.map((p: any) => new Date(p.payment_date).getFullYear()),
      ...expenses.map((e: any) => new Date(e.expense_date).getFullYear()),
      now.getFullYear(),
    ]),
  ).sort((a, b) => b - a);

  const filteredPayments = payments.filter((p: any) => {
    const d = new Date(p.payment_date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const filteredExpenses = expenses.filter((e: any) => {
    const d = new Date(e.expense_date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const totalRentalIncome = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalRentalExpenses = expenses
    .filter((e: any) => e.expense_categories?.name?.toLowerCase().includes("rental"))
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const lifetimeNetIncome = totalRentalIncome - totalRentalExpenses;
  const occupancyRate = totalUnits > 0 ? Math.round((activeLeases.length / totalUnits) * 100) : 0;

  const incomeBreakdown = {
    Rent: filteredPayments
      .filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type))
      .reduce((s: number, p: any) => s + Number(p.amount), 0),
    "Late Fees": filteredPayments
      .filter((p: any) => ["late_fee", "Late Fee"].includes(p.payment_type))
      .reduce((s: number, p: any) => s + Number(p.amount), 0),
    Deposits: filteredPayments
      .filter((p: any) => ["deposit", "Deposit"].includes(p.payment_type))
      .reduce((s: number, p: any) => s + Number(p.amount), 0),
    Other: filteredPayments
      .filter((p: any) => p.payment_type && !["rent", "Rent", "late_fee", "Late Fee", "deposit", "Deposit"].includes(p.payment_type))
      .reduce((s: number, p: any) => s + Number(p.amount), 0),
  };

  const totalIncome = Object.values(incomeBreakdown).reduce((s, v) => s + v, 0);
  const totalExpenses = filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netPL = totalIncome - totalExpenses;

  const expectedRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);
  const collected = filteredPayments
    .filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type))
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const outstanding = Math.max(0, expectedRent - collected);
  const collectionRate = expectedRent > 0 ? Math.round((collected / expectedRent) * 100) : 0;

  const tenantBreakdown = activeLeases.map((l: any) => {
    const paid = filteredPayments
      .filter((p: any) => p.lease_id === l.id && (!p.payment_type || ["rent", "Rent"].includes(p.payment_type)))
      .reduce((s: number, p: any) => s + Number(p.amount), 0);
    const balance = Math.max(0, Number(l.monthly_rent) - paid);
    let status: string;
    if (paid >= Number(l.monthly_rent)) status = "Paid";
    else if (paid > 0) status = "Partial";
    else status = "Unpaid";
    return {
      tenantName: l.profile?.full_name ?? l.profile?.email ?? "Unknown",
      unit: `${l.units?.properties?.name ?? ""} · ${l.units?.unit_number ?? ""}`,
      monthlyRent: Number(l.monthly_rent),
      paid,
      balance,
      status,
    };
  });

  function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPLStatement() {
    const headers = ["Category", "Amount (UGX)"];
    const rows = Object.entries(incomeBreakdown).map(([cat, amt]) => [cat, amt.toLocaleString()]);
    rows.push(["Total Income", totalIncome.toLocaleString()]);
    rows.push(["Total Expenses", totalExpenses.toLocaleString()]);
    rows.push(["Net Profit/Loss", netPL.toLocaleString()]);
    downloadCSV(`pnl-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`, headers, rows);
  }

  function downloadCollectionReport() {
    const headers = ["Tenant", "Unit", "Monthly Rent", "Amount Paid", "Balance", "Status"];
    const rows = tenantBreakdown.map((t) => [
      t.tenantName,
      t.unit,
      t.monthlyRent.toLocaleString(),
      t.paid.toLocaleString(),
      t.balance.toLocaleString(),
      t.status,
    ]);
    downloadCSV(`collection-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`, headers, rows);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/financial-reports" role={role} />
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand px-6 py-6 text-primary-foreground shadow-soft">
        <div className="relative z-10">
          <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">Finance</div>
          <h1 className="display text-3xl font-bold">Financial Reports</h1>
          <p className="text-sm text-primary-foreground/80">Rental income, expenses, and collection performance</p>
        </div>
        <Landmark className="absolute -right-6 -top-6 h-32 w-32 text-primary-foreground/10" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
        <CalendarDays className="h-5 w-5 text-accent" />
        <div className="text-sm font-semibold">Reporting period</div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rental Income</CardTitle>
            <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUGX(totalRentalIncome)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" /> Lifetime collections
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-l-4 border-l-rose-500 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <span className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <Wallet className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-500">{formatUGX(totalRentalExpenses)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" /> Rental-related expenses
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-l-4 border-l-teal-500 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <span className={`rounded-lg p-2 ${lifetimeNetIncome >= 0 ? "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"}`}>
              {lifetimeNetIncome >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </span>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${lifetimeNetIncome >= 0 ? "text-teal-600 dark:text-teal-400" : "text-rose-500"}`}>
              {formatUGX(Math.abs(lifetimeNetIncome))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{lifetimeNetIncome >= 0 ? "Positive cashflow" : "Negative cashflow"}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-l-4 border-l-orange-500 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <span className="rounded-lg bg-orange-50 p-2 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <Building2 className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{occupancyRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">{activeLeases.length} of {totalUnits} units occupied</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pnl">
            <BarChart3 className="mr-1.5 h-4 w-4" />
            P&amp;L Statement
          </TabsTrigger>
          <TabsTrigger value="collection">
            <Users className="mr-1.5 h-4 w-4" />
            Collection Report
          </TabsTrigger>
          <TabsTrigger value="commission">
            <PieChart className="mr-1.5 h-4 w-4" />
            Commission Split (66/9)
          </TabsTrigger>
          <TabsTrigger value="landlord">
            <Landmark className="mr-1.5 h-4 w-4" />
            Landlord Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="display">Profit &amp; Loss Statement</CardTitle>
                <CardDescription>
                  {new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadPdf(pnlRef.current, `pnl-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`)}>
                  <FileText className="mr-2 h-4 w-4" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPLStatement}>
                  <Download className="mr-2 h-4 w-4" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={pnlRef}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (UGX)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(incomeBreakdown).map(([cat, amt]) => (
                    <TableRow key={cat}>
                      <TableCell>{cat}</TableCell>
                      <TableCell className="text-right font-semibold">{formatUGX(amt)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total Income</TableCell>
                    <TableCell className="text-right font-bold">{formatUGX(totalIncome)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Expenses</TableCell>
                    <TableCell className="text-right font-semibold text-red-500">{formatUGX(totalExpenses)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold text-lg">Net {netPL >= 0 ? "Profit" : "Loss"}</TableCell>
                    <TableCell className={`text-right font-bold text-lg ${netPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                      {formatUGX(Math.abs(netPL))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
              <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Income</p>
                  <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{formatUGX(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-lg font-bold text-rose-500">{formatUGX(totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className={`text-lg font-bold ${totalIncome > 0 && netPL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                    {totalIncome > 0 ? `${Math.round((netPL / totalIncome) * 100)}%` : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="display">Collection Summary</CardTitle>
                <CardDescription>
                  {new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadPdf(collectionRef.current, `collection-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`)}>
                  <FileText className="mr-2 h-4 w-4" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCollectionReport}>
                  <Download className="mr-2 h-4 w-4" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div ref={collectionRef}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-lg bg-muted p-1.5"><CalendarDays className="h-4 w-4" /></span>
                    Expected Rent
                  </div>
                  <p className="mt-2 text-2xl font-bold">{formatUGX(expectedRent)}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"><TrendingUp className="h-4 w-4" /></span>
                    Collected
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatUGX(collected)}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-lg bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"><TrendingDown className="h-4 w-4" /></span>
                    Outstanding
                  </div>
                  <p className="mt-2 text-2xl font-bold text-rose-500">{formatUGX(outstanding)}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-lg bg-orange-100 p-1.5 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"><Wallet className="h-4 w-4" /></span>
                    Collection Rate
                  </div>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      collectionRate >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : collectionRate >= 50
                          ? "text-amber-500"
                          : "text-rose-500"
                    }`}
                  >
                    {collectionRate}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold">{formatUGX(collected)} / {formatUGX(expectedRent)}</span>
                </div>
                <Progress
                  value={collectionRate}
                  className={`h-3 ${
                    collectionRate >= 80
                      ? "[&>div]:bg-green-500"
                      : collectionRate >= 50
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                  }`}
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium">Tenant Collection Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Monthly Rent</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          No active leases for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenantBreakdown.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{t.tenantName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{t.unit}</TableCell>
                          <TableCell className="text-right font-semibold">{formatUGX(t.monthlyRent)}</TableCell>
                          <TableCell className="text-right">{formatUGX(t.paid)}</TableCell>
                          <TableCell className="text-right text-red-500">{formatUGX(t.balance)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                t.status === "Paid"
                                  ? "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : t.status === "Partial"
                                    ? "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                    : "border-transparent bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                              }
                            >
                              {t.status === "Paid" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                              {t.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="display">Commission Split</CardTitle>
                <CardDescription>
                  {new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear} — per Habico fee structure
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadPdf(commissionRef.current, `commission-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`)}>
                <FileText className="mr-2 h-4 w-4" />PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div ref={commissionRef}>
              {(() => {
                const collected = filteredPayments
                  .filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type))
                  .reduce((s: number, p: any) => s + Number(p.amount), 0);
                const landlordShare = Math.round(collected * 0.66);
                const companyFee = Math.round(collected * 0.09);
                const opsReserve = collected - landlordShare - companyFee;
                return (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                          <span className="rounded-lg bg-muted p-1.5"><Wallet className="h-4 w-4 text-muted-foreground" /></span>
                        </CardHeader>
                        <CardContent><p className="text-2xl font-bold">{formatUGX(collected)}</p></CardContent>
                      </Card>
                      <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Landlord Payout (66%)</CardTitle>
                          <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"><TrendingUp className="h-4 w-4" /></span>
                        </CardHeader>
                        <CardContent><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatUGX(landlordShare)}</p></CardContent>
                      </Card>
                      <Card className="shadow-card">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Company Fee (9%)</CardTitle>
                          <span className="rounded-lg bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"><PieChart className="h-4 w-4" /></span>
                        </CardHeader>
                        <CardContent><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatUGX(companyFee)}</p></CardContent>
                      </Card>
                    </div>
                    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Landlord</span>
                          <span className="flex items-center gap-2"><Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">66%</Badge>{formatUGX(landlordShare)}</span>
                        </div>
                        <Progress value={66} className="mt-2 h-2.5 [&>div]:bg-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Habico Fee</span>
                          <span className="flex items-center gap-2"><Badge variant="outline" className="border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">9%</Badge>{formatUGX(companyFee)}</span>
                        </div>
                        <Progress value={9} className="mt-2 h-2.5 [&>div]:bg-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Ops / Reserve</span>
                          <span className="flex items-center gap-2"><Badge variant="outline" className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">25%</Badge>{formatUGX(opsReserve)}</span>
                        </div>
                        <Progress value={25} className="mt-2 h-2.5 [&>div]:bg-amber-500" />
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Landlord (66%)</TableHead>
                          <TableHead className="text-right">Habico Fee (9%)</TableHead>
                          <TableHead className="text-right">Ops (25%)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type)).map((p: any) => {
                          const amt = Number(p.amount);
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm">{p.period_label ?? p.payment_date}</TableCell>
                              <TableCell className="text-right">{formatUGX(amt)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatUGX(Math.round(amt * 0.66))}</TableCell>
                              <TableCell className="text-right text-blue-600">{formatUGX(Math.round(amt * 0.09))}</TableCell>
                              <TableCell className="text-right text-amber-600">{formatUGX(amt - Math.round(amt * 0.66) - Math.round(amt * 0.09))}</TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredPayments.filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type)).length === 0 && (
                          <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No rent payments for this period.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landlord" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="display">Property Landlord Report</CardTitle>
                  <CardDescription>
                    Select a property and period to generate the official Habico financial report for the landlord
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedPropertyId && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedPropertyId("")}>
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                {/* Property Selection */}
                <div className="w-full md:w-max">
                  <label className="mb-1.5 block text-sm font-medium">Property</label>
                  {isLoadingProperties ? (
                    <div className="w-80 max-w-full">
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : (
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                      <SelectTrigger className="w-80 max-w-full">
                        <SelectValue placeholder="Select a property…" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.length === 0 ? (
                          <SelectItem value="__none" disabled>No properties found</SelectItem>
                        ) : (
                          properties.map((p: any) => {
                            const label = p.owner_id ? p.name + " \u2014 " + getOwnerName(p.owner_id) : p.name;
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {label}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="w-32">
                  <label className="mb-1.5 block text-sm font-medium">From Month</label>
                  <Select value={String(reportFromMonth)} onValueChange={(v) => setReportFromMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {new Date(0, m - 1).toLocaleString("default", { month: "short" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <label className="mb-1.5 block text-sm font-medium">From Year</label>
                  <Select value={String(reportFromYear)} onValueChange={(v) => setReportFromYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <label className="mb-1.5 block text-sm font-medium">To Month</label>
                  <Select value={String(reportToMonth)} onValueChange={(v) => setReportToMonth(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {new Date(0, m - 1).toLocaleString("default", { month: "short" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <label className="mb-1.5 block text-sm font-medium">To Year</label>
                  <Select value={String(reportToYear)} onValueChange={(v) => setReportToYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* State messages */}
              {!selectedPropertyId && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                  <span className="rounded-full bg-muted p-4"><Landmark className="h-8 w-8 text-muted-foreground" /></span>
                  <p className="font-semibold">Select a property</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Choose a property above to generate the official Habico financial report for the landlord.
                  </p>
                </div>
              )}

              {selectedPropertyId && propertyLeases.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                  <span className="rounded-full bg-muted p-4"><Building2 className="h-8 w-8 text-muted-foreground" /></span>
                  <p className="font-semibold">No leases found</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    This property has no lease records yet for the selected period.
                  </p>
                </div>
              )}

              {/* Payment Calendar */}
              {selectedPropertyId && propertyLeases.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Payment Calendar</h3>
                      <p className="text-xs text-muted-foreground">
                        Monthly payment status from {getMonthLabel(reportFromYear, reportFromMonth)} to {getMonthLabel(reportToYear, reportToMonth)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Paid</Badge>
                      <Badge variant="outline" className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">Unpaid</Badge>
                      <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">Future</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 overflow-x-auto">
                    {propertyLeases
                      .filter((l: any) => l.start_date)
                      .sort((a: any, b: any) => (a.units?.unit_number ?? "").localeCompare(b.units?.unit_number ?? ""))
                      .map((lease: any) => {
                        const leaseStart = new Date(lease.start_date);
                        const firstMonth = Math.max(leaseStart.getFullYear() * 12 + leaseStart.getMonth(), reportFromYear * 12 + (reportFromMonth - 1));
                        const lastMonth = reportToYear * 12 + (reportToMonth - 1);
                        const tenantPayments = propertyPayments.filter((p: any) => p.lease_id === lease.id);
                        return (
                          <div key={lease.id} className="rounded-xl border bg-card p-3 shadow-card">
                            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                              <span className="flex items-center gap-1.5 font-semibold"><Users className="h-4 w-4 text-accent" />{lease.profile?.full_name ?? lease.profile?.email ?? "Tenant"}</span>
                              <span className="text-muted-foreground">Unit {lease.units?.unit_number ?? "—"}</span>
                              <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">UGX {Number(lease.monthly_rent).toLocaleString()}/mo</Badge>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {calendarMonths
                                .filter((cm) => {
                                  const cmIdx = cm.year * 12 + (cm.month - 1);
                                  return cmIdx >= firstMonth;
                                })
                                .map((cm) => {
                                  const paid = isMonthPaid(tenantPayments, cm.year, cm.month);
                                  const future = isFutureMonth(cm.year, cm.month);
                                  let bg: string;
                                  let statusLabel: string;
                                  if (future) { bg = "bg-muted text-muted-foreground"; statusLabel = "Future"; }
                                  else if (paid) { bg = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"; statusLabel = "Paid"; }
                                  else { bg = "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"; statusLabel = "Unpaid"; }
                                  return (
                                    <div
                                      key={cm.label}
                                      className={`flex min-w-[60px] flex-col items-center rounded-lg px-2 py-1.5 text-xs font-medium ${bg}`}
                                      title={`${cm.label}: ${statusLabel}`}
                                    >
                                      <span>{cm.label}</span>
                                      <span className="mt-0.5 text-[10px]">{future ? "•" : paid ? "✓" : "✗"}</span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Show Report Data */}
              {selectedPropertyId && propertyLeases.length > 0 && propertyReportData && (
                <HabicoFinancialReport data={propertyReportData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
