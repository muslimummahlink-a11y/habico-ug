import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isValid, startOfMonth, subMonths } from "date-fns";
import {
  Building2,
  CreditCard,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Home,
  CircleDollarSign,
  CalendarClock,
  Landmark,
  ArrowUpRight,
  ReceiptText,
  Wallet,
  KanbanSquare,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export const Route = createFileRoute("/landlord/dashboard")({
  component: LandlordDashboard,
});

function toDate(v: any): Date | null {
  if (!v) return null;
  const d = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + "T00:00:00") : new Date(v);
  return isValid(d) ? d : null;
}

function formatUGX(n: number) {
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `UGX ${(n / 1_000).toFixed(0)}K`;
  return `UGX ${n.toLocaleString()}`;
}

function statusBadge(status: string) {
  if (status === "in_progress") return "default";
  if (status === "urgent" || status === "high" || status === "overdue") return "destructive";
  return "secondary";
}

function LandlordDashboard() {
  const { user } = useAuth();
  const ownerId = user?.id;

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", ownerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, location, units(id, unit_number, status, monthly_rent, bedrooms)")
        .eq("owner_id", ownerId);
      return (data ?? []) as any[];
    },
    enabled: !!ownerId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["landlord-leases", ownerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("leases")
        .select("id, unit_id, tenant_id, monthly_rent, outstanding_balance, start_date, end_date, status, units(unit_number, property_id, properties(name)), tenants(full_name, phone, email)")
        .eq("units.properties.owner_id", ownerId);
      return (data ?? []) as any[];
    },
    enabled: !!ownerId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["landlord-payments", ownerId],
    queryFn: async () => {
      const cutoff = format(subMonths(new Date(), 12), "yyyy-MM-dd");
      const { data } = await supabase
        .from("payments")
        .select("id, amount, payment_date, method, reference, period_label, lease_id, leases(unit_id, units(unit_number, property_id, properties(name)))")
        .eq("leases.units.properties.owner_id", ownerId)
        .gte("payment_date", cutoff)
        .order("payment_date", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!ownerId,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["landlord-maintenance", ownerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_requests")
        .select("id, title, status, priority, estimated_cost, scheduled_date, unit_id, units(unit_number, property_id, properties(name))")
        .eq("units.properties.owner_id", ownerId)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as any[];
    },
    enabled: !!ownerId,
  });

  const stats = useMemo(() => {
    let totalUnits = 0;
    let occupiedUnits = 0;
    let vacantUnits = 0;
    let potentialIncome = 0;

    const propertyRows = (properties as any[]).map((prop: any) => {
      const units = prop.units ?? [];
      const occupied = units.filter((u: any) => u.status === "occupied").length;
      const vacant = units.filter((u: any) => u.status === "vacant").length;
      const potential = units
        .filter((u: any) => u.status === "occupied")
        .reduce((s: number, u: any) => s + Number(u.monthly_rent ?? 0), 0);
      totalUnits += units.length;
      occupiedUnits += occupied;
      vacantUnits += vacant;
      potentialIncome += potential;
      return {
        id: prop.id,
        name: prop.name,
        location: prop.location,
        units,
        occupied,
        vacant,
        total: units.length,
        occupancyRate: units.length ? Math.round((occupied / units.length) * 100) : 0,
        potential,
      };
    });

    const activeLeases = (leases as any[]).filter((l: any) => l.status === "active");
    const totalOutstanding = activeLeases.reduce((s: number, l: any) => s + Number(l.outstanding_balance ?? 0), 0);

    return {
      totalProperties: properties.length,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      potentialIncome,
      occupancyRate: totalUnits ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      totalOutstanding,
      propertyRows,
    };
  }, [properties, leases]);

  const income = useMemo(() => {
    const monthStarts = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), i))).reverse();
    const series = monthStarts.map((m) => ({
      key: format(m, "yyyy-MM"),
      label: format(m, "MMM yy"),
      collected: 0,
    }));
    const index = new Map(series.map((s, i) => [s.key, i]));
    for (const p of payments as any[]) {
      const d = toDate(p.payment_date);
      if (!d) continue;
      const key = format(d, "yyyy-MM");
      const i = index.get(key);
      if (i !== undefined) series[i].collected += Number(p.amount ?? 0);
    }
    const thisKey = format(new Date(), "yyyy-MM");
    const lastKey = format(subMonths(new Date(), 1), "yyyy-MM");
    const collectedThisMonth = series.find((s) => s.key === thisKey)?.collected ?? 0;
    const collectedLastMonth = series.find((s) => s.key === lastKey)?.collected ?? 0;
    const delta = collectedLastMonth > 0 ? ((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100 : collectedThisMonth > 0 ? 100 : 0;
    return { series, collectedThisMonth, collectedLastMonth, delta };
  }, [payments]);

  const overdueTenants = useMemo(() => {
    return (leases as any[])
      .filter((l: any) => Number(l.outstanding_balance ?? 0) > 0)
      .sort((a: any, b: any) => Number(b.outstanding_balance) - Number(a.outstanding_balance))
      .slice(0, 6);
  }, [leases]);

  const expiringLeases = useMemo(() => {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 90);
    return (leases as any[])
      .filter((l: any) => {
        const d = toDate(l.end_date);
        return d && d >= now && d <= horizon;
      })
      .sort((a: any, b: any) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
      .slice(0, 6);
  }, [leases]);

  const recentPayments = (payments as any[]).slice(0, 8);
  const expiringSoonCount = expiringLeases.filter((l: any) => {
    const d = toDate(l.end_date);
    if (!d) return false;
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    return diff <= 30;
  }).length;
  const urgentMaintenance = (maintenance as any[]).filter((m: any) => m.priority === "urgent" || m.priority === "high").length;

  const hasIncomeData = income.series.some((s) => s.collected > 0);

  const kpiCards = [
    { label: "Properties", value: String(stats.totalProperties), icon: Building2, tone: "bg-accent/10 text-accent", to: "/landlord/properties" },
    { label: "Units", value: String(stats.totalUnits), icon: Landmark, tone: "bg-blue-100 text-blue-600", to: "/landlord/properties" },
    { label: "Occupancy", value: `${stats.occupiedUnits}/${stats.totalUnits} (${stats.occupancyRate}%)`, icon: Home, tone: "bg-green-100 text-green-600", to: "/landlord/properties" },
    { label: "Monthly Income", value: formatUGX(stats.potentialIncome), icon: CircleDollarSign, tone: "bg-purple-100 text-purple-600", to: "/landlord/payments" },
    { label: "Collected (30d)", value: formatUGX(income.collectedThisMonth), delta: income.delta, icon: Wallet, tone: "bg-teal-100 text-teal-600", to: "/landlord/payments" },
    { label: "Outstanding", value: formatUGX(stats.totalOutstanding), icon: AlertTriangle, tone: "bg-red-100 text-red-600", to: "/landlord/tenants" },
  ];

  const attention = [
    { label: "Outstanding balances", count: overdueTenants.length, icon: AlertTriangle, tone: "bg-red-100 text-red-600", to: "/landlord/tenants" },
    { label: "Leases expiring ≤30 days", count: expiringSoonCount, icon: CalendarClock, tone: "bg-amber-100 text-amber-600", to: "/landlord/tenants" },
    { label: "Open maintenance", count: maintenance.length, icon: Wrench, tone: "bg-orange-100 text-orange-600", to: "/landlord/maintenance" },
    { label: "Urgent priority", count: urgentMaintenance, icon: AlertTriangle, tone: "bg-red-100 text-red-600", to: "/landlord/maintenance" },
  ];

  const trendIconClass = income.delta >= 0 ? "h-4 w-4 text-green-600" : "h-4 w-4 text-red-600";
  const trendClass = income.delta >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's an overview of your portfolio.</p>
        </div>
        <Link to="/landlord/properties">
          <Button size="sm">
            Add Property <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <Link key={card.label} to={card.to} className="block">
            <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className={`mb-2 inline-flex rounded-xl p-2.5 ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="truncate text-lg font-bold">{card.value}</p>
                {"delta" in card && (
                  <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${trendClass}`}>
                    {income.delta >= 0 ? <TrendingUp className={trendIconClass} /> : <TrendingDown className={trendIconClass} />}
                    {Math.abs(income.delta).toFixed(1)}% vs last month
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Attention strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {attention.map((item) => (
          <Link key={item.label} to={item.to} className="block">
            <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
                <p className="text-2xl font-bold">{item.count}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Income chart + occupancy */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Income Trend</CardTitle>
              <p className="text-xs text-muted-foreground">Rent collected over the last 6 months</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Expected (occupied rent)</p>
              <p className="text-sm font-semibold text-accent">{formatUGX(stats.potentialIncome)}/mo</p>
            </div>
          </CardHeader>
          <CardContent>
            {hasIncomeData ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={income.series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}K` : String(v))} tickLine={false} axisLine={false} fontSize={12} width={48} />
                    <Tooltip formatter={(value: any) => formatUGX(Number(value ?? 0))} cursor={{ fill: "var(--muted)" }} />
                    <ReferenceLine y={stats.potentialIncome} stroke="var(--accent)" strokeDasharray="4 4" />
                    <Bar dataKey="collected" name="Collected" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-muted-foreground">
                <ReceiptText className="mb-2 h-8 w-8" />
                <p className="font-medium">No payments recorded yet</p>
                <p className="text-sm">Payments will appear here once tenants make them</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Occupancy by Property</CardTitle>
            <Link to="/landlord/properties" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {stats.propertyRows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Home className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">No properties yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {stats.propertyRows.map((prop: any) => (
                  <div key={prop.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{prop.name}</p>
                        <p className="text-xs text-muted-foreground">{prop.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{prop.occupancyRate}%</p>
                        <p className="text-xs text-muted-foreground">{formatUGX(prop.potential)}/mo</p>
                      </div>
                    </div>
                    <Progress value={prop.occupancyRate} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {prop.occupied}/{prop.total} units leased · {prop.vacant} vacant
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outstanding + expiring */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outstanding Balances</CardTitle>
            <Link to="/landlord/tenants" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {overdueTenants.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CircleDollarSign className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">No outstanding balances</p>
                <p className="text-sm">All leases are up to date</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueTenants.map((l: any) => {
                    const tenantName = l.tenants?.full_name ?? "Unknown";
                    const unitLabel = `${l.units?.properties?.name ?? ""} · ${l.units?.unit_number ?? ""}`;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{tenantName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{unitLabel}</TableCell>
                        <TableCell className="text-right">{formatUGX(Number(l.monthly_rent ?? 0))}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{formatUGX(Number(l.outstanding_balance ?? 0))}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lease Expirations (90 days)</CardTitle>
            <Link to="/landlord/tenants" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {expiringLeases.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CalendarClock className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">No lease expirations in the next 90 days</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringLeases.map((l: any) => {
                  const d = toDate(l.end_date);
                  const daysLeft = d ? Math.ceil((d.getTime() - Date.now()) / 86400000) : 0;
                  return (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{l.tenants?.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{l.units?.properties?.name} · Unit {l.units?.unit_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{d ? format(d, "MMM d, yyyy") : "—"}</p>
                        <p className="text-xs text-amber-600">{daysLeft} days left</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent payments + maintenance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link to="/landlord/payments" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CreditCard className="mx-auto mb-2 h-8 w-8" />
                <p>No recent payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p: any) => {
                  const d = toDate(p.payment_date);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-100 p-2">
                          <CreditCard className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{formatUGX(Number(p.amount ?? 0))}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.leases?.units?.properties?.name} · Unit {p.leases?.units?.unit_number} · {d ? format(d, "MMM d, yyyy") : "—"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{p.method || p.payment_type || "Paid"}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Maintenance</CardTitle>
            <Link to="/landlord/maintenance" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {maintenance.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <KanbanSquare className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">No pending maintenance requests</p>
                <p className="text-sm">Requests reported by tenants will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {maintenance.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-100 p-2">
                        <Wrench className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{m.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {m.units?.properties?.name} · Unit {m.units?.unit_number}
                          {m.estimated_cost ? ` · est ${formatUGX(Number(m.estimated_cost))}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.status === "in_progress" ? "default" : "secondary"}>{m.status}</Badge>
                      <Badge variant={statusBadge(m.priority)}>{m.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}