// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Plus, Pencil, Trash2, Receipt, Printer, AlertTriangle, CreditCard, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/create-notification";
import { StripePaymentForm } from "@/components/ui/stripe-payment-form";
import { createPaymentIntent } from "@/lib/createPaymentIntent.functions";
import { recordStripePayment } from "@/lib/recordStripePayment.functions";
import { sendReceipt } from "@/lib/sendEmails.functions";
import { generateReceiptPdfBase64 } from "@/lib/generate-receipt-pdf";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payments — Habico Portal" }] }),
  component: PaymentsPage,
});

const PAYMENT_TYPE_OPTIONS = [
  { value: "rent", label: "Rent" },
  { value: "deposit", label: "Deposit" },
  { value: "late_fee", label: "Late Fee" },
  { value: "utility", label: "Utility" },
  { value: "other", label: "Other" },
];
const METHOD_OPTIONS = ["cash", "bank", "mobile_money", "cheque", "stripe"].map((m) => ({ value: m, label: m === "mobile_money" ? "Mobile Money" : m === "stripe" ? "Card (Stripe)" : m.charAt(0).toUpperCase() + m.slice(1) }));
const MONTHS_OPTIONS = [1, 2, 3, 4, 6, 12] as const;

function addMonths(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function PaymentsPage() {
  const role = useHighestRole();
  const { user } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<any>(null);
  const [voidId, setVoidId] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [stripeProcessing, setStripeProcessing] = useState(false);

  const [form, setForm] = useState({
    lease_id: "",
    amount: "",
    method: "cash",
    reference: "",
    period_label: "",
    notes: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_type: "rent",
    months_covered: "1",
    period_start: "",
  });

  const [editForm, setEditForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
    payment_date: "",
    notes: "",
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, leases(monthly_rent, units(unit_number, properties(name)), tenant_id)")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((p: any) => p.leases?.tenant_id).filter(Boolean)));
      const { data: tenantList } = ids.length
        ? await supabase.from("tenants").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const map = new Map((tenantList ?? []).map((t: any) => [t.id, t]));
      return (data ?? []).map((p: any) => ({ ...p, tenant: map.get(p.leases?.tenant_id) }));
    },
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases-pick"],
    enabled: isStaff,
    queryFn: async () => {
      const { data } = await supabase
        .from("leases")
        .select("id, monthly_rent, outstanding_balance, tenant_id, units(unit_number, properties(name))")
        .eq("status", "active");
      const ids = Array.from(new Set((data ?? []).map((l: any) => l.tenant_id)));
      const { data: tenantList } = ids.length
        ? await supabase.from("tenants").select("id, full_name, email").in("id", ids)
        : { data: [] };
      const map = new Map((tenantList ?? []).map((t: any) => [t.id, t]));
      return (data ?? []).map((l: any) => ({ ...l, profile: map.get(l.tenant_id) }));
    },
  });

  const { data: leasePaymentTotals } = useQuery({
    queryKey: ["lease-payment-totals", form.lease_id],
    enabled: !!form.lease_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("amount, payment_type")
        .eq("lease_id", form.lease_id)
        .eq("payment_type", "rent");
      const totalPaid = (data ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      return totalPaid;
    },
  });

  const { data: leaseStats } = useQuery({
    queryKey: ["leases-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leases")
        .select("id, monthly_rent, outstanding_balance, payment_due_day")
        .eq("status", "active");
      const active = data ?? [];
      const totalExpected = active.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);
      const totalOutstanding = active.reduce((s: number, l: any) => s + Number(l.outstanding_balance ?? 0), 0);
      return { count: active.length, totalExpected, totalOutstanding };
    },
  });

  const collectionRate = leaseStats?.totalExpected
    ? Math.min(100, Math.round(((leaseStats.totalExpected - leaseStats.totalOutstanding) / leaseStats.totalExpected) * 100))
    : 0;

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        lease_id: form.lease_id,
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || null,
        period_label: form.period_label || null,
        notes: form.notes || null,
        payment_date: form.payment_date,
        payment_type: form.payment_type,
        recorded_by: user?.id,
      };
      if (form.payment_type === "rent") {
        payload.months_covered = Number(form.months_covered);
        payload.period_start = form.period_start || null;
        payload.period_end = form.period_start ? addMonths(form.period_start, Number(form.months_covered)) : null;
      }
      const { error } = await supabase.from("payments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["payments"] });
      if (user) {
        const label = form.payment_type === "rent" ? "Rent" : form.payment_type;
        const amt = Number(form.amount).toLocaleString();
        createNotification(user.id, `Payment received: UGX ${amt}`,
          `${label} payment for ${form.period_label || selectedLease?.profile?.full_name || "tenant"}`,
          "/payments", "success");
      }
      setForm({
        lease_id: "", amount: "", method: "cash", reference: "", period_label: "",
        notes: "", payment_date: new Date().toISOString().slice(0, 10),
        payment_type: "rent", months_covered: "1", period_start: "",
      });
      setStripeClientSecret(null);
      setStripePaymentIntentId(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("payments")
        .update({
          amount: Number(editForm.amount),
          method: editForm.method,
          reference: editForm.reference || null,
          payment_date: editForm.payment_date,
          notes: editForm.notes || null,
        })
        .eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment updated");
      setEditOpen(false);
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const makeStripePayment = useMutation({
    mutationFn: async () => {
      const result = await createPaymentIntent({
        amount: Number(form.amount),
        lease_id: form.lease_id,
        payment_type: form.payment_type,
        period_label: form.period_label || undefined,
        months_covered: form.payment_type === "rent" ? Number(form.months_covered) : undefined,
        period_start: form.period_start || undefined,
        period_end: form.payment_type === "rent" && form.period_start
          ? addMonths(form.period_start, Number(form.months_covered))
          : undefined,
      });
      setStripeClientSecret(result.clientSecret);
      setStripePaymentIntentId(result.paymentIntentId);
      setStripeProcessing(true);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment voided");
      setVoidId(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const now = new Date();
  const thisMonthPayments = payments.filter(
    (p: any) =>
      new Date(p.payment_date).getMonth() === now.getMonth() &&
      new Date(p.payment_date).getFullYear() === now.getFullYear(),
  );
  const thisMonthTotal = thisMonthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const rentCollected = thisMonthPayments
    .filter((p: any) => p.payment_type === "rent" || !p.payment_type)
    .reduce((s: number, p: any) => s + Number(p.amount), 0);
  const rentCount = thisMonthPayments.filter(
    (p: any) => p.payment_type === "rent" || !p.payment_type,
  ).length;

  function openEdit(p: any) {
    setEditId(p.id);
    setEditForm({
      amount: String(p.amount),
      method: p.method,
      reference: p.reference || "",
      payment_date: p.payment_date,
      notes: p.notes || "",
    });
    setEditOpen(true);
  }

  function openReceipt(p: any) {
    setReceiptPayment(p);
    setReceiptOpen(true);
  }

  const selectedLease = leases.find((l: any) => l.id === form.lease_id) as any;
  const monthsCovered = Number(form.months_covered);
  const periodEnd = form.payment_type === "rent" && form.period_start
    ? addMonths(form.period_start, monthsCovered)
    : "";
  const selectedLeaseMonthlyRent = selectedLease?.monthly_rent ?? 0;
  const selectedLeaseBalance = Math.max(0, selectedLeaseMonthlyRent - (leasePaymentTotals ?? 0) + Number(selectedLease?.outstanding_balance ?? 0));

  function handleLeaseChange(id: string) {
    setForm((f) => ({ ...f, lease_id: id }));
  }

  function handleMonthsChange(val: string) {
    setForm((f) => ({ ...f, months_covered: val }));
  }

  function handlePaymentTypeChange(val: string) {
    setForm((f) => ({
      ...f,
      payment_type: val,
      amount: val === "rent" && selectedLease?.monthly_rent
        ? String(selectedLease.monthly_rent * Number(f.months_covered))
        : f.amount,
      months_covered: "1",
      period_start: "",
    }));
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/payments" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Finance</div>
          <h1 className="display text-3xl font-bold">Payments</h1>
        </div>
        {isStaff && (
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setStripeClientSecret(null); setStripePaymentIntentId(null); setStripeProcessing(false); } }}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />Record payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>Record a payment</DialogTitle></DialogHeader>
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 mb-4">
                <AlertTriangle className="mr-1 inline-block h-3 w-3" />
                Rent due by the <strong>25th</strong> per agreement. Late payments incur a <strong>5% penalty</strong> (clause 3).
              </div>
              <div className="space-y-5">
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Lease &amp; Type</h3></div>
                  <div className="space-y-3">
                    <div>
                      <Label>Lease *</Label>
                      <select
                        className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-sm"
                        value={form.lease_id}
                        onChange={(e) => handleLeaseChange(e.target.value)}
                      >
                        <option value="">Select lease…</option>
                        {leases.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            {l.profile?.full_name ?? l.profile?.email} — {l.units?.properties?.name} · {l.units?.unit_number}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">Select the active lease this payment applies to.</p>
                    </div>
                    <div>
                      <Label>Payment Type *</Label>
                      <SearchableSelect
                        value={form.payment_type}
                        onValueChange={handlePaymentTypeChange}
                        placeholder="Select type"
                        options={PAYMENT_TYPE_OPTIONS}
                      />
                    </div>
                  </div>
                </div>
                {form.payment_type === "rent" && (
                  <div>
                    <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Period</h3></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Period Start *</Label>
                        <Input
                          type="date"
                          className="mt-1.5"
                          value={form.period_start}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, period_start: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label>Months Covered</Label>
                        <SearchableSelect
                          value={form.months_covered}
                          onValueChange={handleMonthsChange}
                          placeholder="Select months"
                          options={MONTHS_OPTIONS.map((m) => ({ value: String(m), label: String(m) }))}
                        />
                      </div>
                      <div>
                        <Label>Period End</Label>
                        <Input
                          type="date"
                          className="mt-1.5"
                          value={periodEnd}
                          readOnly
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Auto-calculated</p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Amount &amp; Date</h3></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Amount (UGX) *</Label>
                      <Input
                        type="number"
                        className="mt-1.5"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="e.g. 1500000"
                      />
                      {form.lease_id && form.payment_type === "rent" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Monthly rent: UGX {selectedLeaseMonthlyRent.toLocaleString()} &middot;
                          Outstanding: UGX {(Number(selectedLease?.outstanding_balance ?? 0)).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Payment Date *</Label>
                      <Input
                        type="date"
                        className="mt-1.5"
                        value={form.payment_date}
                        onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Payment Details</h3></div>
                  <div className="space-y-3">
                    <div>
                      <Label>Payment Method *</Label>
                      <SearchableSelect
                        value={form.method}
                        onValueChange={(v) => {
                          setForm((f) => ({ ...f, method: v }));
                          setStripeClientSecret(null);
                          setStripeProcessing(false);
                        }}
                        placeholder="Select method"
                        options={METHOD_OPTIONS}
                      />
                    </div>
                    <div>
                      <Label>Period Label</Label>
                      <Input
                        className="mt-1.5"
                        value={form.period_label}
                        onChange={(e) => setForm((f) => ({ ...f, period_label: e.target.value }))}
                        placeholder="e.g. Jan 2026"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Human-readable period description for receipts.</p>
                    </div>
                    <div>
                      <Label>Reference / Receipt #</Label>
                      <Input
                        className="mt-1.5"
                        value={form.reference}
                        onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                        placeholder="e.g. TXN-001234"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
                  <div>
                    <Label>Internal Notes</Label>
                    <Textarea
                      className="mt-1.5"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Any additional information about this payment…"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                {form.method === "stripe" ? (
                  stripeClientSecret ? (
                    <div className="w-full space-y-4">
                      <StripePaymentForm
                        clientSecret={stripeClientSecret}
                        onSuccess={async () => {
                          const result = await recordStripePayment({
                            paymentIntentId: stripePaymentIntentId ?? "",
                            amount: Number(form.amount),
                            lease_id: form.lease_id,
                            payment_type: form.payment_type,
                            method: "stripe",
                            period_label: form.period_label || undefined,
                            months_covered: form.payment_type === "rent" ? Number(form.months_covered) : undefined,
                            period_start: form.period_start || undefined,
                            period_end: form.payment_type === "rent" && form.period_start
                              ? addMonths(form.period_start, Number(form.months_covered))
                              : undefined,
                            recorded_by: user?.id ?? "",
                          });
                          if (result.success) {
                            toast.success("Payment recorded");
                            setCreateOpen(false);
                            qc.invalidateQueries({ queryKey: ["payments"] });
                            setForm({
                              lease_id: "", amount: "", method: "cash", reference: "", period_label: "",
                              notes: "", payment_date: new Date().toISOString().slice(0, 10),
                              payment_type: "rent", months_covered: "1", period_start: "",
                            });
                            setStripeClientSecret(null);
                            setStripeProcessing(false);
                          } else {
                            toast.error(result.error ?? "Failed to record payment");
                          }
                        }}
                        onCancel={() => {
                          setStripeClientSecret(null);
                          setStripePaymentIntentId(null);
                          setStripeProcessing(false);
                        }}
                      />
                    </div>
                  ) : (
                    <Button
                      onClick={() => makeStripePayment.mutate()}
                      disabled={!form.lease_id || !form.amount || makeStripePayment.isPending}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {makeStripePayment.isPending ? "Preparing..." : "Pay with Card"}
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => create.mutate()}
                    disabled={!form.lease_id || !form.amount || create.isPending}
                  >
                    Record
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">This Month Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">UGX {thisMonthTotal.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rent Collected</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">UGX {rentCollected.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{rentCount} payment{rentCount !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Arrears</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">UGX {(leaseStats?.totalOutstanding ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{leaseStats?.count ?? 0} active leases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Collection Rate</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${collectionRate >= 80 ? "text-green-500" : collectionRate >= 50 ? "text-amber-500" : "text-red-500"}`}>
              {collectionRate}%
            </p>
            <p className="text-xs text-muted-foreground">Due by 25th per agreement</p>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={payments}
        isLoading={false}
        searchFields={["tenant", "property", "unit", "reference"]}
        keyExtractor={(item) => item.id}
        titleField="tenant"
        subtitleField="property"
        metricFields={[
          { key: "amount", label: "Amount", format: "currency" },
          { key: "payment_date", label: "Date", format: "date" },
          { key: "method", label: "Method" },
        ]}
        emptyMessage="No payments yet."
        cardActions={(p) => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(p)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openReceipt(p)}>
              <Receipt className="h-3 w-3" />
            </Button>
            <AlertDialog open={voidId === p.id} onOpenChange={(o) => !o && setVoidId(null)}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setVoidId(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Void payment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this payment record. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => remove.mutate(p.id)}
                  >
                    Void
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Payment Details</h3></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount (UGX) *</Label><Input type="number" className="mt-1.5" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 1500000" /></div>
              <div><Label>Date *</Label><Input type="date" className="mt-1.5" value={editForm.payment_date} onChange={(e) => setEditForm((f) => ({ ...f, payment_date: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Method</Label>
              <SearchableSelect
                value={editForm.method}
                onValueChange={(v) => setEditForm((f) => ({ ...f, method: v }))}
                placeholder="Select method"
                options={METHOD_OPTIONS}
              />
            </div>
            <div><Label>Reference / Receipt #</Label><Input className="mt-1.5" value={editForm.reference} onChange={(e) => setEditForm((f) => ({ ...f, reference: e.target.value }))} placeholder="e.g. TXN-001234" /></div>
            <div><Label>Notes</Label><Textarea className="mt-1.5" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional information…" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => update.mutate()} disabled={!editForm.amount || update.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <Printer className="mr-2 inline-block h-5 w-5" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptPayment && (
            <div id="receipt-content" className="space-y-3 text-sm">
              <div className="border-b pb-2 text-center">
                <p className="text-lg font-bold">Habico Portal</p>
                <p className="text-xs text-muted-foreground">Payment Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted-foreground">Receipt #</span>
                <span className="font-medium">{receiptPayment.reference ?? "—"}</span>
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{receiptPayment.payment_date}</span>
                <span className="text-muted-foreground">Tenant</span>
                <span className="font-medium">{receiptPayment.tenant?.full_name ?? receiptPayment.tenant?.email ?? "—"}</span>
                <span className="text-muted-foreground">Property</span>
                <span className="font-medium">{receiptPayment.leases?.units?.properties?.name ?? "—"}</span>
                <span className="text-muted-foreground">Unit</span>
                <span className="font-medium">{receiptPayment.leases?.units?.unit_number ?? "—"}</span>
                <span className="text-muted-foreground">Period</span>
                <span className="font-medium">{receiptPayment.period_label ?? "—"}</span>
                <span className="text-muted-foreground">Payment type</span>
                <span className="font-medium">{{ rent: "Rent", deposit: "Deposit", late_fee: "Late Fee", utility: "Utility", other: "Other" }[receiptPayment.payment_type] ?? "Rent"}</span>
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{receiptPayment.method.replace("_", " ")}</span>
              </div>
              <div className="border-t pt-2 text-right">
                <span className="text-lg font-bold">UGX {Number(receiptPayment.amount).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Print
            </Button>
            {isStaff && receiptPayment?.tenant?.email && (
              <Button variant="outline" size="sm" onClick={async () => {
                if (!receiptPayment) return;
                try {
                  const pdfBase64 = await generateReceiptPdfBase64({
                    receiptNo: receiptPayment.reference ?? `PAY-${receiptPayment.id?.slice(0, 8)}`,
                    date: receiptPayment.payment_date,
                    tenantName: receiptPayment.tenant?.full_name ?? receiptPayment.tenant?.email ?? "Tenant",
                    propertyName: receiptPayment.leases?.units?.properties?.name ?? "Property",
                    unitNumber: receiptPayment.leases?.units?.unit_number ?? "",
                    periodLabel: receiptPayment.period_label ?? "",
                    paymentType: receiptPayment.payment_type ?? "rent",
                    method: receiptPayment.method ?? "cash",
                    amount: Number(receiptPayment.amount),
                  });
                  const result = await sendReceipt({
                    to: receiptPayment.tenant.email,
                    tenantName: receiptPayment.tenant?.full_name ?? "Tenant",
                    receiptNo: receiptPayment.reference ?? `PAY-${receiptPayment.id?.slice(0, 8)}`,
                    date: receiptPayment.payment_date,
                    amount: Number(receiptPayment.amount),
                    propertyName: receiptPayment.leases?.units?.properties?.name ?? "Property",
                    unitNumber: receiptPayment.leases?.units?.unit_number ?? "",
                    periodLabel: receiptPayment.period_label ?? "",
                    paymentType: receiptPayment.payment_type ?? "rent",
                    method: receiptPayment.method ?? "cash",
                    pdfBase64,
                    pdfFilename: `habico-receipt-${receiptPayment.id?.slice(0, 8) ?? "payment"}.pdf`,
                  });
                  if (result.success) {
                    toast.success("Receipt emailed to tenant");
                  } else {
                    toast.error(result.error ?? "Failed to send receipt");
                  }
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}>
                <Mail className="mr-2 h-4 w-4" />Email Receipt
              </Button>
            )}
            {isStaff && receiptPayment?.tenant?.phone && (
              <Button variant="outline" size="sm" onClick={() => {
                const p = receiptPayment;
                const msg = `Habico Receipt\nReceipt #: ${p.reference ?? "—"}\nDate: ${p.payment_date}\nAmount: UGX ${Number(p.amount).toLocaleString()}\n${p.leases?.units?.properties?.name ?? ""} · ${p.leases?.units?.unit_number ?? ""}\nThank you for your payment!`;
                window.open(`https://wa.me/${p.tenant?.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
              }}>
                <MessageSquare className="mr-2 h-4 w-4" />WhatsApp
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setReceiptOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
