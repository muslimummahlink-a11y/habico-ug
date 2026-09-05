import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Calendar, CreditCard, Key, Shield, MapPin, Download, FileText, Home, Layers, DollarSign, Clock, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/tenant/lease")({
  component: TenantLease,
});

function TenantLease() {
  const { user } = useAuth();

  const { data: lease } = useQuery({
    queryKey: ["tenant-lease", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id, access_pin").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return null;
      const { data } = await supabase
        .from("leases")
        .select("*, units!inner(unit_number, floor_number, monthly_rent, bedrooms, bathrooms, size_sqm, properties(name, location, owner_id, amenities, utilities, images))")
        .eq("id", tenant.lease_id)
        .single();
      return { ...data, access_pin: tenant.access_pin };
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
        .order("payment_date", { ascending: false });
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

  if (!lease) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="display text-3xl font-bold">My Lease</h1>
          <p className="text-sm text-muted-foreground">Your current lease information</p>
        </div>
        <Card className="shadow-card">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No active lease found</p>
            <p className="mt-1 text-sm text-muted-foreground">Contact your property manager for lease details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const property = lease?.units?.properties;
  const unit = lease?.units;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">My Lease</h1>
        <p className="text-sm text-muted-foreground">Your current lease agreement details</p>
      </div>

      {/* Property Header */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-accent/10 p-4">
                <Building2 className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{property?.name}</h2>
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {property?.location}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Unit {unit?.unit_number}</span>
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Floor {unit?.floor_number ?? "—"}</span>
                  <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> UGX {Number(lease?.monthly_rent ?? 0).toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
            <Badge variant={(outstanding ?? 0) > 0 ? "destructive" : "default"} className="text-lg px-4 py-2 whitespace-nowrap">
              {(outstanding ?? 0) > 0 ? `Outstanding: UGX {(outstanding ?? 0).toLocaleString()}` : "All Clear"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lease Details Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Lease Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Lease Status</span><Badge variant={lease?.status === "active" ? "default" : "secondary"}>{lease?.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span>{lease?.start_date ? format(new Date(lease.start_date), "MMM d, yyyy") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">End Date</span><span>{lease?.end_date ? format(new Date(lease.end_date), "MMM d, yyyy") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span className="font-semibold">UGX {Number(lease?.monthly_rent ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Security Deposit</span><span>UGX {Number(lease?.deposit ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Due</span><span>{lease?.payment_due_day ? `${lease.payment_due_day}th of each month` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Late Fee</span><span>UGX {Number(lease?.late_fee_amount ?? 0).toLocaleString()} (after {lease?.late_fee_grace_days ?? 5} days grace)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Billing Period</span><span className="capitalize">{lease?.billing_period ?? "monthly"}</span></div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Home className="h-4 w-4" /> Unit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Unit Number</span><span className="font-medium">Unit {unit?.unit_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Floor</span><span>{unit?.floor_number ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bedrooms</span><span>{unit?.bedrooms ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Bathrooms</span><span>{unit?.bathrooms ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{unit?.size_sqm ? `${unit.size_sqm} m²` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span className="font-semibold">UGX {Number(unit?.monthly_rent ?? 0).toLocaleString()}</span></div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Outstanding Balance</span><span className={`font-bold ${(outstanding ?? 0) > 0 ? "text-red-500" : "text-green-500"}`}>UGX {(outstanding ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Paid (This Year)</span><span>UGX {payments.filter(p => new Date(p.payment_date).getFullYear() === new Date().getFullYear()).reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Paid (All Time)</span><span>UGX {payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deposit Held</span><span>UGX {Number(lease?.deposit ?? 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Late Fee Rate</span><span>UGX {Number(lease?.late_fee_amount ?? 0).toLocaleString()} / {lease?.late_fee_grace_days ?? 5} days</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="capitalize">{lease?.payment_method ?? "mobile_money"}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Property Amenities */}
      {property?.amenities && property.amenities.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Property Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a: string) => (
                <Badge key={a} variant="outline" className="text-sm">{a}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Utilities */}
      {property?.utilities && property.utilities.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Included Utilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.utilities.map((u: string) => (
                <Badge key={u} variant="secondary" className="text-sm">{u}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Schedule */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Upcoming Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() + i);
                const dueDate = new Date(date.getFullYear(), date.getMonth(), lease?.payment_due_day ?? 1);
                const paid = payments.some((p: any) => {
                  const pd = new Date(p.payment_date);
                  return pd.getFullYear() === dueDate.getFullYear() && pd.getMonth() === dueDate.getMonth();
                });
                return (
                  <TableRow key={i}>
                    <TableCell>{format(dueDate, "MMMM yyyy")}</TableCell>
                    <TableCell>{format(dueDate, "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right font-semibold">UGX {Number(lease?.monthly_rent ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={paid ? "default" : date < new Date() && !paid ? "destructive" : "secondary"}>
                        {paid ? <><CheckCircle className="mr-1 h-3 w-3" /> Paid</> : date < new Date() && !paid ? "Overdue" : "Upcoming"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto mb-2 h-8 w-8" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.payment_date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{p.period_label ?? format(new Date(p.payment_date), "MMMM yyyy")}</TableCell>
                      <TableCell className="text-right font-semibold">UGX {Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{p.method ?? "—"}</TableCell>
                      <TableCell>{p.reference ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                          {p.status ?? "pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access PIN */}
      {lease?.access_pin && (
        <Card className="shadow-card border-accent/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Tenant Portal Access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Your 4-digit PIN for tenant portal login</p>
              <div className="font-mono text-3xl font-bold tracking-widest mt-1">{lease.access_pin}</div>
            </div>
            <Button variant="outline" onClick={() => {
              navigator.clipboard.writeText(lease.access_pin ?? "");
              toast.success("PIN copied to clipboard");
            }}>
              <Copy className="mr-2 h-4 w-4" /> Copy PIN
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}