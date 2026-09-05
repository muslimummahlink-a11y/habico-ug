import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@tanstack/react-router";
import { Building2, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, CreditCard, Wrench, Home, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/landlord/dashboard")({
  component: LandlordDashboard,
});

function LandlordDashboard() {
  const { user } = useAuth();

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, location, units!inner(id, unit_number, monthly_rent, status, leases!inner(tenant_id, monthly_rent, outstanding_balance, status, tenants(full_name, phone, email)))")
        .eq("owner_id", user?.id);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["landlord-stats", user?.id],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id, units!inner(id, monthly_rent, status, leases!inner(outstanding_balance))").eq("owner_id", user?.id);
      if (!props) return { totalProperties: 0, totalUnits: 0, occupiedUnits: 0, totalOutstanding: 0, monthlyIncome: 0, vacantUnits: 0 };
      
      let totalUnits = 0, occupiedUnits = 0, vacantUnits = 0, totalOutstanding = 0, monthlyIncome = 0;
      
      for (const prop of props) {
        for (const unit of prop.units) {
          totalUnits++;
          if (unit.status === "occupied") occupiedUnits++;
          else if (unit.status === "vacant") vacantUnits++;
          monthlyIncome += Number(unit.monthly_rent ?? 0);
          if (unit.leases) {
            for (const lease of unit.leases) {
              totalOutstanding += Number(lease.outstanding_balance ?? 0);
            }
          }
        }
      }
      
      return { totalProperties: props.length, totalUnits, occupiedUnits, vacantUnits, totalOutstanding, monthlyIncome };
    },
    enabled: !!user,
  });

  const { data: recentPayments = [] } = useQuery({
    queryKey: ["landlord-recent-payments", user?.id],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id, units!inner(id, leases!inner(tenant_id, payments!inner(id, amount, payment_date, method, status, reference, period_label))))").eq("owner_id", user?.id);
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
      return allPayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).slice(0, 10);
    },
    enabled: !!user,
  });

  const { data: pendingMaintenance = [] } = useQuery({
    queryKey: ["landlord-pending-maintenance", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*, units!inner(property_id, unit_number, properties(name))")
        .eq("units.properties.owner_id", user?.id)
        .in("status", ["pending", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's an overview of your portfolio.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/landlord/properties" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-accent/10 p-3"><Building2 className="h-6 w-6 text-accent" /></div>
              <div><p className="text-sm text-muted-foreground">Manage Properties</p><p className="font-semibold">View All Properties</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/landlord/tenants" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3"><Users className="h-6 w-6 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">Tenant Management</p><p className="font-semibold">View Tenants</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/landlord/financial-reports" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-green-100 p-3"><DollarSign className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Financial Reports</p><p className="font-semibold">Bank Statements</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/landlord/maintenance" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-orange-100 p-3"><Wrench className="h-6 w-6 text-orange-600" /></div>
              <div><p className="text-sm text-muted-foreground">Maintenance</p><p className="font-semibold">View Requests</p></div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Portfolio Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Properties</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.totalProperties ?? 0}</p></CardContent></Card>
        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Units</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats?.totalUnits ?? 0}</p></CardContent></Card>
        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Occupied</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{stats?.occupiedUnits ?? 0}/{stats?.totalUnits ?? 0}</p></CardContent></Card>
        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Income</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">UGX {(stats?.monthlyIncome ?? 0).toLocaleString()}</p></CardContent></Card>
        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-500">UGX {(stats?.totalOutstanding ?? 0).toLocaleString()}</p></CardContent></Card>
      </div>

      {/* Properties Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Properties Overview</CardTitle>
            <Link to="/landlord/properties" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Home className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">No properties yet</p>
                <p className="text-sm">Add your first property to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 5).map((prop: any) => {
                  const units = prop.units ?? [];
                  const occupied = units.filter((u: any) => u.status === "occupied").length;
                  const total = units.length;
                  return (
                    <Link key={prop.id} to="/landlord/properties/$propId" params={{ propId: prop.id }} className="block p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{prop.name}</p>
                          <p className="text-sm text-muted-foreground">{prop.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{occupied}/{total} units occupied</p>
                          <p className="text-sm text-muted-foreground">UGX {units.reduce((s: number, u: any) => s + Number(u.monthly_rent ?? 0), 0).toLocaleString()}/mo</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {properties.length > 5 && (
                  <Link to="/landlord/properties" className="text-center text-accent hover:underline">View all {properties.length} properties</Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link to="/landlord/payments" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="mx-auto mb-2 h-8 w-8" />
                <p>No recent payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-100 p-2"><CreditCard className="h-5 w-5 text-green-600" /></div>
                      <div>
                        <p className="font-medium">UGX {Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{p.property} · Unit {p.unit} · {format(new Date(p.payment_date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <Badge variant={p.status === "completed" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Maintenance */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Maintenance</CardTitle>
          <Link to="/landlord/maintenance" className="text-sm text-accent hover:underline">View All</Link>
        </CardHeader>
        <CardContent>
          {pendingMaintenance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="mx-auto mb-2 h-8 w-8" />
              <p>No pending maintenance requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMaintenance.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-100 p-2"><Wrench className="h-5 w-5 text-orange-600" /></div>
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-sm text-muted-foreground">{m.units?.properties?.name} · Unit {m.units?.unit_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.status === "in_progress" ? "default" : "secondary"}>{m.status}</Badge>
                    <Badge variant={m.priority === "urgent" ? "destructive" : m.priority === "high" ? "default" : "secondary"}>{m.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}