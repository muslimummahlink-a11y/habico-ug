import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Download, FileText, TrendingUp, Clock, ExternalLink, Wrench } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";

export const Route = createFileRoute("/tenant/dashboard")({
  component: TenantDashboard,
});

function TenantDashboard() {
  const { user } = useAuth();

  const { data: tenant } = useQuery({
    queryKey: ["tenant-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").eq("auth_user_id", user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: lease } = useQuery({
    queryKey: ["tenant-lease", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return null;
      const { data } = await supabase
        .from("leases")
        .select("*, units!inner(unit_number, floor_number, monthly_rent, properties(name, location, owner_id))")
        .eq("id", tenant.lease_id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["tenant-payments", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return [];
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("lease_id", tenant.lease_id)
        .order("payment_date", { ascending: false })
        .limit(10);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ["tenant-maintenance", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return [];
      const { data: leaseData } = await supabase.from("leases").select("unit_id").eq("id", tenant.lease_id).single();
      if (!leaseData) return [];
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("unit_id", leaseData.unit_id)
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: outstanding } = useQuery({
    queryKey: ["tenant-outstanding", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return 0;
      const { data } = await supabase.from("leases").select("outstanding_balance").eq("id", tenant.lease_id).single();
      return Number(data?.outstanding_balance ?? 0);
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's an overview of your tenancy.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/tenant/payments" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-accent/10 p-3"><CreditCard className="h-6 w-6 text-accent" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Make a Payment</p>
                <p className="font-semibold">Pay Rent Now</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/maintenance" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3"><Wrench className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Report Issue</p>
                <p className="font-semibold">Maintenance Request</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/documents" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-green-100 p-3"><FileText className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">My Files</p>
                <p className="font-semibold">Documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tenant/id-card" className="block">
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="rounded-xl bg-purple-100 p-3"><CreditCard className="h-6 w-6 text-purple-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Digital ID</p>
                <p className="font-semibold">My ID Card</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Outstanding Balance Alert */}
      <Card className={(outstanding ?? 0) > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20 shadow-card" : "shadow-card"}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-red-100"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="font-semibold">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-500">UGX {(outstanding ?? 0).toLocaleString()}</p>
              </div>
            </div>
            {(outstanding ?? 0) > 0 && (
              <Link to="/tenant/payments">
                <Button className="bg-red-500 hover:bg-red-600 whitespace-nowrap">Pay Now</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link to="/tenant/payments" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="mx-auto mb-2 h-8 w-8" />
                <p>No payments yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 5).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.payment_date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-semibold">UGX {Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{p.method ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "completed" ? "default" : "outline"}>
                          <CheckCircle className="mr-1 h-3 w-3" /> {p.status ?? "pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Maintenance</CardTitle>
            <Link to="/tenant/maintenance" className="text-sm text-accent hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            {maintenance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="mx-auto mb-2 h-8 w-8" />
                <p>No maintenance requests</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.slice(0, 5).map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.title}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === "completed" ? "default" : m.status === "in_progress" ? "secondary" : "outline"}>
                          {m.status?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.priority === "urgent" ? "destructive" : m.priority === "high" ? "default" : "outline"}>
                          {m.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(m.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lease Info */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Current Lease</CardTitle>
        </CardHeader>
        <CardContent>
          {lease ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <h4 className="font-semibold">Property Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-medium">{lease?.units?.properties?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{lease?.units?.properties?.location}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span className="font-medium">Unit {lease?.units?.unit_number}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Floor</span><span>{lease?.units?.floor_number ?? "—"}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Lease Terms</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span className="font-medium">UGX {Number(lease?.monthly_rent ?? 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span>{lease?.start_date ? format(new Date(lease.start_date), "MMM d, yyyy") : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">End Date</span><span>{lease?.end_date ? format(new Date(lease.end_date), "MMM d, yyyy") : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment Due</span><span>{lease?.payment_due_day ? `${lease.payment_due_day}th of each month` : "—"}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Financial Status</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-bold text-red-500">UGX {(outstanding ?? 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deposit Paid</span><span>UGX {Number(lease?.deposit ?? 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Late Fee</span><span>UGX {Number(lease?.late_fee_amount ?? 0).toLocaleString()} (after {lease?.late_fee_grace_days ?? 5} days)</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
              <p>No active lease found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}