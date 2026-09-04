import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Building2, AlertTriangle } from "lucide-react";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — Habico Portal" }] }),
  component: ReportsPage,
});

function formatUGX(amount: number) {
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(1)}K`;
  return `UGX ${amount.toLocaleString()}`;
}

function ReportsPage() {
  const role = useHighestRole();
  const { data: payments = [] } = useQuery({
    queryKey: ["report-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, payment_date, payment_type, method, leases(monthly_rent, units(unit_number, properties(id, name))))")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: leaseStats } = useQuery({
    queryKey: ["report-lease-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leases")
        .select("id, monthly_rent, outstanding_balance")
        .eq("status", "active");
      const active = data ?? [];
      const totalExpected = active.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);
      const totalOutstanding = active.reduce((s: number, l: any) => s + Number(l.outstanding_balance ?? 0), 0);
      return { count: active.length, totalExpected, totalOutstanding };
    },
  });

  const now = new Date();
  const lifetimeTotal = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  const thisMonthPayments = payments.filter(
    (p: any) =>
      new Date(p.payment_date).getMonth() === now.getMonth() &&
      new Date(p.payment_date).getFullYear() === now.getFullYear(),
  );
  const thisMonthTotal = thisMonthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  const collectionRate = leaseStats?.totalExpected
    ? Math.min(100, Math.round(((leaseStats.totalExpected - leaseStats.totalOutstanding) / leaseStats.totalExpected) * 100))
    : 0;

  const monthlyTrend = (() => {
    const map = new Map<string, number>();
    payments.forEach((p: any) => {
      const d = new Date(p.payment_date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(k, (map.get(k) ?? 0) + Number(p.amount));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => ({ month, total }));
  })();

  const byProperty = (() => {
    const map = new Map<string, number>();
    payments.forEach((p: any) => {
      const name = p.leases?.units?.properties?.name ?? "Other";
      map.set(name, (map.get(name) ?? 0) + Number(p.amount));
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, total]) => ({ name, total }));
  })();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/reports" role={role} />
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-accent">Reports</div>
        <h1 className="display text-3xl font-bold">Financial overview</h1>
        <p className="text-sm text-muted-foreground">
          Lifetime collected: <span className="font-semibold text-foreground">{formatUGX(lifetimeTotal)}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUGX(lifetimeTotal)}</p>
            <p className="text-xs text-muted-foreground">All time revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUGX(thisMonthTotal)}</p>
            <p className="text-xs text-muted-foreground">
              {now.toLocaleString("default", { month: "long" })} {now.getFullYear()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{formatUGX(leaseStats?.totalOutstanding ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{leaseStats?.count ?? 0} active leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${collectionRate >= 80 ? "text-green-500" : collectionRate >= 50 ? "text-amber-500" : "text-red-500"}`}>
              {collectionRate}%
            </p>
            <p className="text-xs text-muted-foreground">Due by 25th per agreement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="display">Monthly collections</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {monthlyTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No payment data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: number) => formatUGX(v)} />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="display">By property</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byProperty.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No payment data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProperty} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={140} />
                  <Tooltip formatter={(v: number) => formatUGX(v)} />
                  <Bar dataKey="total" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="display">Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 20).map((p: any) => (
                    <TableRow key={p.id ?? Math.random()}>
                      <TableCell className="text-muted-foreground">{p.payment_date}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                          {({ rent: "Rent", deposit: "Deposit", late_fee: "Late Fee", utility: "Utility", other: "Other" } as Record<string, string>)[p.payment_type] ?? "Rent"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{p.leases?.units?.properties?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">Unit {p.leases?.units?.unit_number ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.method}</TableCell>
                      <TableCell className="text-right font-bold">{formatUGX(Number(p.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
