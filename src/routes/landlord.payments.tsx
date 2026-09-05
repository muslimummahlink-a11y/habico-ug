import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, Building2, DollarSign, Users, Calendar, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export const Route = createFileRoute("/landlord/payments")({
  component: LandlordPayments,
});

function LandlordPayments() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [propertyFilter, setPropertyFilter] = useState("");

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", user?.id).order("name");
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["landlord-payments", user?.id, selectedYear, selectedMonth, propertyFilter],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("*, leases!inner(unit_id, units!inner(unit_number, properties(name, owner_id)), tenant_id, tenants(full_name, phone, email))")
        .eq("leases.units.properties.owner_id", user?.id)
        .order("payment_date", { ascending: false });
      if (propertyFilter) q = q.eq("leases.units.properties.id", propertyFilter);
      const { data } = await q;
      let allPayments = (data ?? []) as any[];
      return allPayments.filter((p: any) => {
        const d = new Date(p.payment_date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      });
    },
    enabled: !!user,
  });

  const totalAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
  const completedAmount = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">Payments</h1>
          <p className="text-sm text-muted-foreground">View and manage all payments across your properties</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-md border border-input bg-background p-2 text-sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="rounded-md border border-input bg-background p-2 text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("default", { month: "long" })}</option>)}
          </select>
          <select className="rounded-md border border-input bg-background p-2 text-sm w-64" value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Collected</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{totalAmount.toLocaleString()}</p><p className="text-xs text-muted-foreground">This period</p></CardContent></Card>
        <Card className="shadow-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><p className="text-2xl font-bold text-green-500">{completedAmount.toLocaleString()}</p></CardContent></Card>
        <Card className="shadow-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><AlertTriangle className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><p className="text-2xl font-bold text-amber-500">{pendingAmount.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Building2 className="mx-auto mb-2 h-8 w-8" /><p>No payments for this period</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Property / Unit</TableHead><TableHead>Tenant</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.payment_date), "MMM d, yyyy")}</TableCell>
                      <TableCell><p className="font-medium">{p.leases?.units?.properties?.name}</p><p className="text-sm text-muted-foreground">Unit {p.leases?.units?.unit_number}</p></TableCell>
                      <TableCell><p className="font-medium">{p.leases?.tenants?.full_name}</p><p className="text-sm text-muted-foreground">{p.leases?.tenants?.phone}</p></TableCell>
                      <TableCell className="text-right font-semibold">UGX {Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{p.method ?? "—"}</TableCell>
                      <TableCell>{p.reference ?? "—"}</TableCell>
                      <TableCell><Badge variant={p.status === "completed" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>{p.status}</Badge></TableCell>
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