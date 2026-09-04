// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Building2, Target, Download, FileText } from "lucide-react";
import { PageTour } from "@/components/page-tour";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/_authenticated/habico-finance")({
  head: () => ({ meta: [{ title: "Habico Finance — Habico Portal" }] }),
  component: HabicoFinancePage,
});

function formatUGX(amount: number) {
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(1)}K`;
  return `UGX ${amount.toLocaleString()}`;
}

const PIE_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function HabicoFinancePage() {
  const role = useHighestRole();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const dashboardRef = useRef<HTMLDivElement>(null);

  const { data: payments = [] } = useQuery({
    queryKey: ["habico-finance-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, payment_date, payment_type")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["habico-finance-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("total_amount, amount_paid, status, payment_date")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["habico-finance-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount, expense_date, category")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vendorPayments = [] } = useQuery({
    queryKey: ["habico-finance-vendor-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_payments")
        .select("amount, payment_date, category")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: bills = [] } = useQuery({
    queryKey: ["habico-finance-bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("amount, due_date, status")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["habico-finance-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, budget")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const years = useMemo(() => {
    const set = new Set<number>();
    payments.forEach((p: any) => set.add(new Date(p.payment_date).getFullYear()));
    invoices.forEach((i: any) => { if (i.payment_date) set.add(new Date(i.payment_date).getFullYear()); });
    expenses.forEach((e: any) => set.add(new Date(e.expense_date).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [payments, invoices, expenses]);

  const filterByYear = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    return new Date(dateStr).getFullYear() === selectedYear;
  };

  const yearPayments = payments.filter((p: any) => filterByYear(p.payment_date));
  const yearInvoices = invoices.filter((i: any) => filterByYear(i.payment_date) || filterByYear(i.created_at));
  const yearExpenses = expenses.filter((e: any) => filterByYear(e.expense_date));
  const yearVendorPayments = vendorPayments.filter((vp: any) => filterByYear(vp.payment_date));
  const yearBills = bills.filter((b: any) => filterByYear(b.due_date));

  const totalRentalRevenue = yearPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalConstructionRevenue = yearInvoices.reduce((s: number, i: any) => s + Number(i.amount_paid ?? 0), 0);
  const totalRevenue = totalRentalRevenue + totalConstructionRevenue;

  const totalExpensesAmount =
    yearExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0) +
    yearVendorPayments.reduce((s: number, vp: any) => s + Number(vp.amount), 0) +
    yearBills.filter((b: any) => b.status === "paid").reduce((s: number, b: any) => s + Number(b.amount), 0);

  const netProfit = totalRevenue - totalExpensesAmount;

  const totalInvoicedAmount = yearInvoices.reduce((s: number, i: any) => s + Number(i.total_amount), 0);
  const totalInvoicedPaid = yearInvoices.reduce((s: number, i: any) => s + Number(i.amount_paid ?? 0), 0);
  const collectionRate = totalInvoicedAmount > 0 ? Math.min(100, Math.round((totalInvoicedPaid / totalInvoicedAmount) * 100)) : 0;

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, { rental: number; construction: number }>();
    yearPayments.forEach((p: any) => {
      const d = new Date(p.payment_date);
      const k = `${selectedYear}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = map.get(k) ?? { rental: 0, construction: 0 };
      entry.rental += Number(p.amount);
      map.set(k, entry);
    });
    yearInvoices.forEach((i: any) => {
      const dateStr = i.payment_date || i.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const k = `${selectedYear}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = map.get(k) ?? { rental: 0, construction: 0 };
      entry.construction += Number(i.amount_paid ?? 0);
      map.set(k, entry);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleString("default", { month: "short" }),
        Rental: Math.round(data.rental),
        Construction: Math.round(data.construction),
      }));
  }, [yearPayments, yearInvoices, selectedYear]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    yearExpenses.forEach((e: any) => {
      const cat = e.category || "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + Number(e.amount));
    });
    yearVendorPayments.forEach((vp: any) => {
      const cat = vp.category || "Vendor Payments";
      map.set(cat, (map.get(cat) ?? 0) + Number(vp.amount));
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [yearExpenses, yearVendorPayments]);

  const projectProfitability = useMemo(() => {
    return projects.map((proj: any) => {
      const projInvoices = yearInvoices.filter((i: any) => i.project_id === proj.id);
      const invoicesSent = projInvoices.reduce((s: number, i: any) => s + Number(i.total_amount), 0);
      const invoicesPaid = projInvoices.reduce((s: number, i: any) => s + Number(i.amount_paid ?? 0), 0);
      const projExpenses = yearExpenses.filter((e: any) => e.project_id === proj.id);
      const projVendorPayments = yearVendorPayments.filter((vp: any) => vp.project_id === proj.id);
      const expensesIncurred = projExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0) +
        projVendorPayments.reduce((s: number, vp: any) => s + Number(vp.amount), 0);
      const profit = invoicesPaid - expensesIncurred;
      const margin = invoicesPaid > 0 ? Math.round((profit / invoicesPaid) * 100) : 0;
      return {
        name: proj.name,
        budget: Number(proj.budget ?? 0),
        invoicesSent,
        invoicesPaid,
        expensesIncurred,
        profit,
        margin,
      };
    }).sort((a: any, b: any) => b.margin - a.margin);
  }, [projects, yearInvoices, yearExpenses, yearVendorPayments]);

  const monthlyPL = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((m) => {
      const monthPayments = yearPayments.filter((p: any) => {
        const d = new Date(p.payment_date);
        return d.getMonth() + 1 === m;
      });
      const monthInvoices = yearInvoices.filter((i: any) => {
        const dateStr = i.payment_date || i.created_at;
        return dateStr && new Date(dateStr).getMonth() + 1 === m;
      });
      const monthExpenses = yearExpenses.filter((e: any) => new Date(e.expense_date).getMonth() + 1 === m);
      const monthVendorPay = yearVendorPayments.filter((vp: any) => new Date(vp.payment_date).getMonth() + 1 === m);

      const rentalIncome = monthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
      const constructionIncome = monthInvoices.reduce((s: number, i: any) => s + Number(i.amount_paid ?? 0), 0);
      const totalRev = rentalIncome + constructionIncome;
      const totalExp = monthExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0) +
        monthVendorPay.reduce((s: number, vp: any) => s + Number(vp.amount), 0);
      return {
        month: new Date(selectedYear, m - 1).toLocaleString("default", { month: "short" }),
        rentalIncome,
        constructionIncome,
        totalRevenue: totalRev,
        expenses: totalExp,
        netProfit: totalRev - totalExp,
      };
    });
  }, [yearPayments, yearInvoices, yearExpenses, yearVendorPayments, selectedYear]);

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

  function exportPLCsv() {
    const headers = ["Month", "Rental Income", "Construction Income", "Total Revenue", "Expenses", "Net Profit"];
    const rows = monthlyPL.map((r) => [
      r.month,
      r.rentalIncome.toLocaleString(),
      r.constructionIncome.toLocaleString(),
      r.totalRevenue.toLocaleString(),
      r.expenses.toLocaleString(),
      r.netProfit.toLocaleString(),
    ]);
    downloadCSV(`habico-pl-${selectedYear}.csv`, headers, rows);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/habico-finance" role={role} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Finance</div>
          <h1 className="display text-3xl font-bold">Habico Finance</h1>
          <p className="text-sm text-muted-foreground">Company-wide financial health — rental &amp; construction combined</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => downloadPdf(dashboardRef.current, `habico-finance-${selectedYear}.pdf`)}>
            <FileText className="mr-2 h-4 w-4" />Export PDF
          </Button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{formatUGX(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Rental + Construction</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-500">{formatUGX(totalExpensesAmount)}</p>
              <p className="text-xs text-muted-foreground">Expenses + Vendor + Bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatUGX(Math.abs(netProfit))}
              </p>
              <p className="text-xs text-muted-foreground">{netProfit >= 0 ? "Profitable" : "Loss"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-xs text-muted-foreground">{formatUGX(projects.reduce((s: number, p: any) => s + Number(p.budget ?? 0), 0))} total budget</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${collectionRate >= 80 ? "text-green-500" : collectionRate >= 50 ? "text-amber-500" : "text-red-500"}`}>
                {collectionRate}%
              </p>
              <p className="text-xs text-muted-foreground">Invoices paid / invoiced</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="display">Monthly Revenue Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">Rental vs Construction — {selectedYear}</p>
            </CardHeader>
            <CardContent className="h-80">
              {monthlyRevenue.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(v: number) => formatUGX(v)} />
                    <Legend />
                    <Bar dataKey="Rental" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Construction" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="display">Expense Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">By category — {selectedYear}</p>
            </CardHeader>
            <CardContent className="h-80">
              {expenseByCategory.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No expense data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      fontSize={11}
                    >
                      {expenseByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatUGX(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="display">Project Profitability</CardTitle>
              <p className="text-xs text-muted-foreground">Construction projects ranked by margin — {selectedYear}</p>
            </div>
          </CardHeader>
          <CardContent>
            {projectProfitability.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No projects found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Invoiced</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectProfitability.map((proj: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{proj.name}</TableCell>
                      <TableCell className="text-right">{formatUGX(proj.budget)}</TableCell>
                      <TableCell className="text-right">{formatUGX(proj.invoicesSent)}</TableCell>
                      <TableCell className="text-right">{formatUGX(proj.invoicesPaid)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatUGX(proj.expensesIncurred)}</TableCell>
                      <TableCell className={`text-right font-semibold ${proj.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatUGX(Math.abs(proj.profit))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          proj.margin >= 20
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : proj.margin >= 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {proj.margin}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="display">Monthly P&amp;L Summary</CardTitle>
              <p className="text-xs text-muted-foreground">Rental &amp; Construction income vs expenses — {selectedYear}</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportPLCsv}>
              <Download className="mr-2 h-4 w-4" />CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Rental Income</TableHead>
                  <TableHead className="text-right">Construction Income</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyPL.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right">{formatUGX(row.rentalIncome)}</TableCell>
                    <TableCell className="text-right">{formatUGX(row.constructionIncome)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatUGX(row.totalRevenue)}</TableCell>
                    <TableCell className="text-right text-red-500">{formatUGX(row.expenses)}</TableCell>
                    <TableCell className={`text-right font-semibold ${row.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatUGX(Math.abs(row.netProfit))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
