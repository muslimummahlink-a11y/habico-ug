import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Download, TrendingUp, TrendingDown, DollarSign, Building2, Landmark, ScrollText, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/landlord/financial-reports")({
  component: LandlordFinancialReports,
});

function formatUGX(amount: number) {
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(1)}K`;
  return `UGX ${amount.toLocaleString()}`;
}

function LandlordFinancialReports() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [reportFromMonth, setReportFromMonth] = useState(1);
  const [reportFromYear, setReportFromYear] = useState(now.getFullYear());
  const [reportToMonth, setReportToMonth] = useState(now.getMonth() + 1);
  const [reportToYear, setReportToYear] = useState(now.getFullYear());
  const pnlRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name, location").eq("owner_id", user?.id).order("name");
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["landlord-payments", user?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id, units!inner(id, leases!inner(tenant_id, payments!inner(*, tenant:tenants!inner(full_name, email, phone))))").eq("owner_id", user?.id);
      if (!props) return [];
      let allPayments: any[] = [];
      for (const prop of props) {
        for (const unit of prop.units) {
          if (unit.leases) {
            for (const lease of unit.leases) {
              if (lease.payments) {
                allPayments.push(...lease.payments.map((p: any) => ({ ...p, property: prop.name, unit: unit.unit_number })));
              }
            }
          }
        }
      }
      return allPayments.filter((p: any) => {
        const d = new Date(p.payment_date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });
    },
    enabled: !!user,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["landlord-expenses", user?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      const { data } = await supabase.from("expenses").select("*, expense_categories(name)").eq("company_id", user?.id).order("expense_date", { ascending: false });
      return (data ?? []).filter((e: any) => {
        const d = new Date(e.expense_date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });
    },
    enabled: !!user,
  });

  const { data: activeLeases = [] } = useQuery({
    queryKey: ["landlord-active-leases", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("leases").select("*, units!inner(unit_number, properties(name)), tenants!inner(full_name, email)").eq("units.properties.owner_id", user?.id).eq("status", "active");
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: totalUnits = 0 } = useQuery({
    queryKey: ["landlord-total-units", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("units").select("*", { count: "exact", head: true }).eq("properties.owner_id", user?.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const filteredPayments = payments;
  const filteredExpenses = expenses;

  const totalRentalIncome = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalRentalExpenses = expenses.filter((e: any) => e.expense_categories?.name?.toLowerCase().includes("rental")).reduce((s: number, e: any) => s + Number(e.amount), 0);
  const lifetimeNetIncome = totalRentalIncome - totalRentalExpenses;
  const occupancyRate = totalUnits > 0 ? Math.round(((totalUnits - 0) / totalUnits) * 100) : 0;

  const incomeBreakdown = {
    Rent: filteredPayments.filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type)).reduce((s: number, p: any) => s + Number(p.amount), 0),
    "Late Fees": filteredPayments.filter((p: any) => ["late_fee", "Late Fee"].includes(p.payment_type)).reduce((s: number, p: any) => s + Number(p.amount), 0),
    Deposits: filteredPayments.filter((p: any) => ["deposit", "Deposit"].includes(p.payment_type)).reduce((s: number, p: any) => s + Number(p.amount), 0),
    Other: filteredPayments.filter((p: any) => p.payment_type && !["rent", "Rent", "late_fee", "Late Fee", "deposit", "Deposit"].includes(p.payment_type)).reduce((s: number, p: any) => s + Number(p.amount), 0),
  };

  const totalIncome = Object.values(incomeBreakdown).reduce((s, v) => s + v, 0);
  const totalExpenses = filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netPL = totalIncome - totalExpenses;

  const expectedRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);
  const collected = filteredPayments.filter((p: any) => !p.payment_type || ["rent", "Rent"].includes(p.payment_type)).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const outstanding = Math.max(0, expectedRent - collected);
  const collectionRate = expectedRent > 0 ? Math.round((collected / expectedRent) * 100) : 0;

  const tenantBreakdown = activeLeases.map((l: any) => {
    const paid = filteredPayments.filter((p: any) => p.lease_id === l.id && (!p.payment_type || ["rent", "Rent"].includes(p.payment_type))).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const balance = Math.max(0, Number(l.monthly_rent) - paid);
    let status: string;
    if (paid >= Number(l.monthly_rent)) status = "Paid";
    else if (paid > 0) status = "Partial";
    else status = "Unpaid";
    return { tenantName: l.tenants?.full_name ?? "Unknown", unit: `${l.units?.properties?.name ?? ""} · ${l.units?.unit_number ?? ""}`, monthlyRent: Number(l.monthly_rent), paid, balance, status };
  });

  const years = Array.from(new Set([...payments.map((p: any) => new Date(p.payment_date).getFullYear()), ...expenses.map((e: any) => new Date(e.expense_date).getFullYear()), now.getFullYear()])).sort((a, b) => b - a);

  function downloadPdf(el: HTMLDivElement | null, filename: string) {
    if (!el) return;
    toPng(el, { backgroundColor: "#fff" }).then(imgData => {
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
      while (left > 0) { pdf.addPage(); pos = margin - (imgH - left); pdf.addImage(imgData, "PNG", margin, pos, imgW, imgH); left -= pageH - margin * 2; }
      pdf.save(filename);
    }).catch(err => console.error("PDF export failed", err));
  }

  function downloadPLStatement() {
    const headers = ["Category", "Amount (UGX)"];
    const rows = Object.entries(incomeBreakdown).map(([cat, amt]) => [cat, amt.toLocaleString()]);
    rows.push(["Total Income", totalIncome.toLocaleString()], ["Total Expenses", totalExpenses.toLocaleString()], ["Net Profit/Loss", netPL.toLocaleString()]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `pnl-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function downloadCollectionReport() {
    const headers = ["Tenant", "Unit", "Monthly Rent", "Amount Paid", "Balance", "Status"];
    const rows = tenantBreakdown.map(t => [t.tenantName, t.unit, t.monthlyRent.toLocaleString(), t.paid.toLocaleString(), t.balance.toLocaleString(), t.status]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `collection-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/landlord/financial-reports" role="owner" />
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-accent">Finance</div>
        <h1 className="display text-3xl font-bold">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Rental income, expenses, and collection performance</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select className="rounded-md border border-input bg-background p-2 text-sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="rounded-md border border-input bg-background p-2 text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("default", { month: "long" })}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Rental Income</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatUGX(totalRentalIncome)}</p><p className="text-xs text-muted-foreground">Lifetime collections</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold text-red-500">{formatUGX(totalRentalExpenses)}</p><p className="text-xs text-muted-foreground">Rental-related expenses</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Net Income</CardTitle>{lifetimeNetIncome >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}</CardHeader><CardContent><p className={`text-2xl font-bold ${lifetimeNetIncome >= 0 ? "text-green-500" : "text-red-500"}`}>{formatUGX(Math.abs(lifetimeNetIncome))}</p><p className="text-xs text-muted-foreground">{lifetimeNetIncome >= 0 ? "Positive" : "Negative"}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{occupancyRate}%</p><p className="text-xs text-muted-foreground">Units occupied</p></CardContent></Card>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList><TabsTrigger value="pnl">P&L Statement</TabsTrigger><TabsTrigger value="collection">Collection Report</TabsTrigger></TabsList>

        <TabsContent value="pnl" className="space-y-4">
          <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="display">Profit & Loss Statement</CardTitle><CardDescription>{new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear}</CardDescription></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => downloadPdf(pnlRef.current, `pnl-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`)}><FileText className="mr-2 h-4 w-4" />PDF</Button><Button variant="outline" size="sm" onClick={downloadPLStatement}><Download className="mr-2 h-4 w-4" />CSV</Button></div></CardHeader><CardContent><div ref={pnlRef}><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount (UGX)</TableHead></TableRow></TableHeader><TableBody>{Object.entries(incomeBreakdown).map(([cat, amt]) => (<TableRow key={cat}><TableCell>{cat}</TableCell><TableCell className="text-right font-semibold">{formatUGX(amt)}</TableCell></TableRow>))}<TableRow><TableCell className="font-bold">Total Income</TableCell><TableCell className="text-right font-bold">{formatUGX(totalIncome)}</TableCell></TableRow><TableRow><TableCell>Expenses</TableCell><TableCell className="text-right font-semibold text-red-500">{formatUGX(totalExpenses)}</TableCell></TableRow><TableRow><TableCell className="font-bold text-lg">Net {netPL >= 0 ? "Profit" : "Loss"}</TableCell><TableCell className={`text-right font-bold text-lg ${netPL >= 0 ? "text-green-500" : "text-red-500"}`}>{formatUGX(Math.abs(netPL))}</TableCell></TableRow></TableBody></Table></div></CardContent></Card></TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="display">Collection Summary</CardTitle><CardDescription>{new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear}</CardDescription></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => downloadPdf(collectionRef.current, `collection-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.pdf`)}><FileText className="mr-2 h-4 w-4" />PDF</Button><Button variant="outline" size="sm" onClick={downloadCollectionReport}><Download className="mr-2 h-4 w-4" />CSV</Button></div></CardHeader><CardContent className="space-y-6"><div ref={collectionRef}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-sm text-muted-foreground">Expected Rent</p><p className="text-2xl font-bold">{formatUGX(expectedRent)}</p></div><div><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold text-green-500">{formatUGX(collected)}</p></div><div><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-2xl font-bold text-red-500">{formatUGX(outstanding)}</p></div><div><p className="text-sm text-muted-foreground">Collection Rate</p><p className={`text-2xl font-bold ${collectionRate >= 80 ? "text-green-500" : collectionRate >= 50 ? "text-amber-500" : "text-red-500"}`}>{collectionRate}%</p></div></div><div className="space-y-2"><div className="flex items-center justify-between text-sm"><span>Progress</span><span className="font-semibold">{formatUGX(collected)} / {formatUGX(expectedRent)}</span></div><Progress value={collectionRate} className={`h-3 ${collectionRate >= 80 ? "[&>div]:bg-green-500" : collectionRate >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`} /></div><div><h3 className="mb-3 text-sm font-medium">Tenant Collection Breakdown</h3><Table><TableHeader><TableRow><TableHead>Tenant</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Monthly Rent</TableHead><TableHead className="text-right">Amount Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{tenantBreakdown.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No active leases</TableCell></TableRow> : tenantBreakdown.map((t, i) => (<TableRow key={i}><TableCell className="font-medium">{t.tenantName}</TableCell><TableCell className="text-sm text-muted-foreground">{t.unit}</TableCell><TableCell className="text-right font-semibold">{formatUGX(t.monthlyRent)}</TableCell><TableCell className="text-right">{formatUGX(t.paid)}</TableCell><TableCell className="text-right text-red-500">{formatUGX(t.balance)}</TableCell><TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "Paid" ? "bg-green-100 text-green-800" : t.status === "Partial" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{t.status}</span></TableCell></TableRow>))}</TableBody></Table></div></div></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}