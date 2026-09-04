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
import { Download, TrendingUp, TrendingDown, DollarSign, Building2, Landmark, ScrollText, FileText, RotateCcw } from "lucide-react";
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
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-accent">Finance</div>
        <h1 className="display text-3xl font-bold">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Rental income, expenses, and collection performance</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select
          className="rounded-md border border-input bg-background p-2 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background p-2 text-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Rental Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUGX(totalRentalIncome)}</p>
            <p className="text-xs text-muted-foreground">Lifetime collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{formatUGX(totalRentalExpenses)}</p>
            <p className="text-xs text-muted-foreground">Rental-related expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            {lifetimeNetIncome >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${lifetimeNetIncome >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatUGX(Math.abs(lifetimeNetIncome))}
            </p>
            <p className="text-xs text-muted-foreground">{lifetimeNetIncome >= 0 ? "Positive" : "Negative"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{occupancyRate}%</p>
            <p className="text-xs text-muted-foreground">{activeLeases.length} of {totalUnits} units occupied</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">P&amp;L Statement</TabsTrigger>
          <TabsTrigger value="collection">Collection Report</TabsTrigger>
          <TabsTrigger value="commission">Commission Split (66/9)</TabsTrigger>
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
                    <TableCell className={`text-right font-bold text-lg ${netPL >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatUGX(Math.abs(netPL))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
                <div>
                  <p className="text-sm text-muted-foreground">Expected Rent</p>
                  <p className="text-2xl font-bold">{formatUGX(expectedRent)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                  <p className="text-2xl font-bold text-green-500">{formatUGX(collected)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-red-500">{formatUGX(outstanding)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p
                    className={`text-2xl font-bold ${
                      collectionRate >= 80
                        ? "text-green-500"
                        : collectionRate >= 50
                          ? "text-amber-500"
                          : "text-red-500"
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
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                t.status === "Paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : t.status === "Partial"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {t.status}
                            </span>
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
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Collected</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{formatUGX(collected)}</p></CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Landlord Payout (66%)</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-green-500">{formatUGX(landlordShare)}</p></CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Company Fee (9%)</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-blue-500">{formatUGX(companyFee)}</p></CardContent>
                      </Card>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Landlord (66%)</span>
                        <span className="font-semibold">{formatUGX(landlordShare)}</span>
                      </div>
                      <Progress value={66} className="h-3 [&>div]:bg-green-500" />
                      <div className="flex items-center justify-between text-sm">
                        <span>Habico Fee (9%)</span>
                        <span className="font-semibold">{formatUGX(companyFee)}</span>
                      </div>
                      <Progress value={9} className="h-3 [&>div]:bg-blue-500" />
                      <div className="flex items-center justify-between text-sm">
                        <span>Ops / Reserve (25%)</span>
                        <span className="font-semibold">{formatUGX(opsReserve)}</span>
                      </div>
                      <Progress value={25} className="h-3 [&>div]:bg-amber-500" />
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
                    <div className="w-full rounded-md border border-input bg-background p-2 text-sm">
                      <Skeleton className="h-6" />
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-input bg-background p-2 text-sm"
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                    >
                      <option value="">Select a property…</option>
                      {properties.length === 0 ? (
                        <option disabled>No properties found</option>
                      ) : (
                        properties.map((p: any) => {
                          const label = p.owner_id ? p.name + " \u2014 " + getOwnerName(p.owner_id) : p.name;
                          return (
                            <option key={p.id} value={p.id}>
                              {label}
                            </option>
                          );
                        })
                      )}
                    </select>
                  )}
                </div>
                <div className="w-32">
                  <label className="mb-1.5 block text-sm font-medium">From Month</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                    value={reportFromMonth}
                    onChange={(e) => setReportFromMonth(Number(e.target.value))}
                  >
                    <option value="">From...</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString("default", { month: "short" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="mb-1.5 block text-sm font-medium">From Year</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                    value={reportFromYear}
                    onChange={(e) => setReportFromYear(Number(e.target.value))}
                  >
                    <option value="">From...</option>
                    {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="mb-1.5 block text-sm font-medium">To Month</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                    value={reportToMonth}
                    onChange={(e) => setReportToMonth(Number(e.target.value))}
                  >
                    <option value="">To...</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(0, m - 1).toLocaleString("default", { month: "short" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="mb-1.5 block text-sm font-medium">To Year</label>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2 text-sm"
                    value={reportToYear}
                    onChange={(e) => setReportToYear(Number(e.target.value))}
                  >
                    <option value="">To...</option>
                    {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* State messages */}
              {!selectedPropertyId && (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <Skeleton className="h-10 w-10" />
                  <p className="font-medium">Select a property</p>
                  <p className="text-sm">
                    Choose a property above to generate the landlord financial report.
                  </p>
                </div>
              )}

              {selectedPropertyId && propertyLeases.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10" />
                  <p className="font-medium">No leases found</p>
                  <p className="text-sm">
                    This property has no lease records yet.
                  </p>
                </div>
              )}

              {/* Payment Calendar */}
              {selectedPropertyId && propertyLeases.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Payment Calendar</h3>
                  <p className="text-xs text-muted-foreground">
                    Monthly payment status from {getMonthLabel(reportFromYear, reportFromMonth)} to {getMonthLabel(reportToYear, reportToMonth)}
                  </p>
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
                          <div key={lease.id} className="rounded-md border p-3">
                            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                              <span className="font-semibold">{lease.profile?.full_name ?? lease.profile?.email ?? "Tenant"}</span>
                              <span className="text-muted-foreground">Unit {lease.units?.unit_number ?? "—"}</span>
                              <span className="text-muted-foreground">UGX {Number(lease.monthly_rent).toLocaleString()}/mo</span>
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
                                  if (future) { bg = "bg-gray-100 text-gray-400 dark:bg-gray-800"; statusLabel = "Future"; }
                                  else if (paid) { bg = "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"; statusLabel = "Paid"; }
                                  else { bg = "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"; statusLabel = "Unpaid"; }
                                  return (
                                    <div
                                      key={cm.label}
                                      className={`flex min-w-[60px] flex-col items-center rounded-md px-2 py-1.5 text-xs font-medium ${bg}`}
                                      title={`${cm.label}: ${statusLabel}`}
                                    >
                                      <span>{cm.label}</span>
                                      <span className="mt-0.5 text-[10px]">{future ? "⬜" : paid ? "✅" : "❌"}</span>
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
