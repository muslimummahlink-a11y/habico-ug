import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Download, Loader2, Building2, Banknote, Smartphone, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/tenant/payments")({
  component: TenantPayments,
});

function TenantPayments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mobile_money");
  const [payRef, setPayRef] = useState("");

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

  const balanceOwed = (outstanding ?? 0) > 0;
  const balanceCardClass = balanceOwed
    ? "border-red-200 bg-red-50 dark:bg-red-950/20 shadow-card"
    : "shadow-card bg-green-50 dark:bg-green-950/20 border-green-200";

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

  const payMutation = useMutation({
    mutationFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) throw new Error("No active lease");
      const amount = Number(payAmount);
      if (!amount || amount <= 0) throw new Error("Invalid amount");
      const { error } = await supabase.from("payments").insert({
        lease_id: tenant.lease_id,
        amount,
        payment_date: new Date().toISOString().split("T")[0],
        method: payMethod,
        reference: payRef || null,
        payment_type: "rent",
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-payments"] });
      qc.invalidateQueries({ queryKey: ["tenant-outstanding"] });
      toast.success("Payment submitted for verification");
      setPayModalOpen(false);
      setPayAmount("");
      setPayRef("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const methods = [
    { value: "mobile_money", label: "Mobile Money (MTN/Airtel)", icon: Smartphone },
    { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
    { value: "cash", label: "Cash Deposit", icon: Banknote },
    { value: "card", label: "Card Payment", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground">View payment history and make rent payments</p>
      </div>

      {/* Balance Card */}
      <Card className={balanceCardClass}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              <p className={`text-3xl font-bold ${(outstanding ?? 0) > 0 ? "text-red-500" : "text-green-500"}`}>
                UGX {(outstanding ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Monthly rent: UGX {Number(lease?.monthly_rent ?? 0).toLocaleString()} · Due every {lease?.payment_due_day ? `${lease.payment_due_day}th` : "month"}</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={(outstanding ?? 0) <= 0}>
                    <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make a Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold text-red-500">UGX {(outstanding ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (UGX) *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={outstanding ?? 999999999}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method *</Label>
                      <Select value={payMethod} onValueChange={setPayMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {methods.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              <div className="flex items-center gap-2">
                                <m.icon className="h-4 w-4" /> {m.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference (Optional)</Label>
                      <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. MTN ref: ABC123" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPayModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => payMutation.mutate()} disabled={payMutation.isPending || !payAmount || Number(payAmount) <= 0}>
                      {payMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                <Download className="mr-2 h-4 w-4" /> Download Statement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="mx-auto mb-3 h-10 w-10" />
              <p className="font-medium">No payments yet</p>
              <p className="text-sm">Your first payment will appear here</p>
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
                    <TableHead>Actions</TableHead>
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
                        <Badge variant={
                          p.status === "completed" ? "default" :
                          p.status === "pending" ? "secondary" :
                          "destructive"
                        }>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {p.status ?? "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const receipt = `Payment Receipt\nDate: ${format(new Date(p.payment_date), "MMM d, yyyy")}\nAmount: UGX ${Number(p.amount).toLocaleString()}\nMethod: ${p.method}\nRef: ${p.reference ?? "—"}\nStatus: ${p.status}`;
                          navigator.clipboard.writeText(receipt);
                          toast.success("Receipt copied to clipboard");
                        }}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Accepted Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {methods.map((m) => (
              <div key={m.value} className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors">
                <div className="rounded-lg bg-accent/10 p-3"><m.icon className="h-5 w-5 text-accent" /></div>
                <div>
                  <p className="font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">Secure & instant</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}