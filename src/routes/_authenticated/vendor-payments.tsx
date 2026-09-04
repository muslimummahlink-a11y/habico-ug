// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { downloadVendorPaymentReceiptPdf, generateVendorPaymentReceiptPdf } from "@/lib/generate-vendor-receipt-pdf";
import { sendVendorPaymentReceiptEmail } from "@/lib/email.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, DollarSign, Loader2, Pencil, Trash2, FileDown, Receipt, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/vendor-payments")({
  head: () => ({ meta: [{ title: "Vendor Payments — Habico Portal" }] }),
  component: VendorPaymentsPage,
});

const categoryOptions = ["contractor", "supplier", "consultant", "service", "labor", "other"];
const methodOptions = ["cash", "bank_transfer", "mobile_money", "cheque", "card", "other"];

function VendorPaymentsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    payee_name: "", payee_phone: "", payee_email: "", payee_address: "",
    description: "", category: "contractor", amount: "", payment_method: "bank_transfer",
    reference_number: "", payment_date: new Date().toISOString().split("T")[0],
    project_id: "", notes: "",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["vendor-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_payments").select("*, projects(name)").order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    payee_name: "", payee_phone: "", payee_email: "", payee_address: "",
    description: "", category: "contractor", amount: "", payment_method: "bank_transfer",
    reference_number: "", payment_date: new Date().toISOString().split("T")[0],
    project_id: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      payee_name: p.payee_name ?? "", payee_phone: p.payee_phone ?? "",
      payee_email: p.payee_email ?? "", payee_address: p.payee_address ?? "",
      description: p.description ?? "", category: p.category ?? "contractor",
      amount: p.amount != null ? String(p.amount) : "",
      payment_method: p.payment_method ?? "bank_transfer",
      reference_number: p.reference_number ?? "",
      payment_date: p.payment_date ?? new Date().toISOString().split("T")[0],
      project_id: p.project_id ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const generateReceiptNumber = () => {
    const now = new Date();
    const yr = now.getFullYear().toString().slice(-2);
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const seq = String(payments.length + 1).padStart(4, "0");
    return `VR-${yr}${mo}-${seq}`;
  };

  const create = useMutation({
    mutationFn: async () => {
      const receipt_number = editing ? editing.receipt_number : generateReceiptNumber();
      const payload = {
        payee_name: form.payee_name, payee_phone: form.payee_phone || null,
        payee_email: form.payee_email || null, payee_address: form.payee_address || null,
        description: form.description, category: form.category,
        amount: Number(form.amount) || 0, payment_method: form.payment_method,
        reference_number: form.reference_number || null,
        payment_date: form.payment_date, project_id: form.project_id || null,
        notes: form.notes || null, receipt_number: receipt_number,
      };
      if (editing) {
        const { error } = await supabase.from("vendor_payments").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendor_payments").insert(payload);
        if (error) throw error;
      }

      // Send email receipt if payee has email (new payments only)
      if (!editing && form.payee_email) {
        try {
          const pdf = await generateVendorPaymentReceiptPdf({
            ...payload,
            payment_date: form.payment_date,
            project_name: null,
          } as any);
          const pdfBase64 = pdf.output("dataurlstring").split(",")[1];
          await sendVendorPaymentReceiptEmail({
            to: form.payee_email,
            payeeName: form.payee_name,
            receiptNumber: receipt_number,
            amount: Number(form.amount) || 0,
            description: form.description,
            category: form.category,
            paymentMethod: form.payment_method,
            paymentDate: form.payment_date,
            referenceNumber: form.reference_number,
            pdfBase64,
            pdfFilename: `receipt-${receipt_number}.pdf`,
          });
          toast.success(`Receipt emailed to ${form.payee_email}`);
        } catch (emailErr) {
          console.error("Failed to send receipt email:", emailErr);
          toast.warning("Payment saved but email could not be sent");
        }
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Payment updated" : "Payment recorded");
      setOpen(false); setEditing(null); resetForm();
      qc.invalidateQueries({ queryKey: ["vendor-payments"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["vendor-payments"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleReceipt = (p: any) => {
    downloadVendorPaymentReceiptPdf({
      receipt_number: p.receipt_number, payee_name: p.payee_name,
      payee_phone: p.payee_phone, payee_email: p.payee_email, payee_address: p.payee_address,
      description: p.description, category: p.category, amount: Number(p.amount),
      payment_method: p.payment_method, reference_number: p.reference_number,
      payment_date: p.payment_date, project_name: p.projects?.name ?? null, notes: p.notes,
    });
  };

  const totalPaid = useMemo(() => payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0), [payments]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    return payments.filter((p: any) => {
      const d = new Date(p.payment_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  }, [payments]);
  const uniquePayees = useMemo(() => new Set(payments.map((p: any) => p.payee_name)).size, [payments]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/vendor-payments" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Administration</div>
          <h1 className="display text-3xl font-bold">Vendor Payments</h1>
          <p className="text-sm text-muted-foreground">Track payments made to contractors, suppliers, and service providers</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Paid</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalPaid.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">This Month</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {thisMonth.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Unique Payees</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{uniquePayees}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={payments}
        isLoading={isLoading}
        searchFields={["payee_name", "description", "reference_number", "receipt_number"]}
        filterField="category"
        filterOptions={categoryOptions.map((c) => ({ label: c.replace("_", " "), value: c }))}
        keyExtractor={(item) => item.id}
        titleField="payee_name"
        subtitleField="description"
        metricFields={[
          { key: "amount", label: "Amount", format: "currency" },
          { key: "payment_date", label: "Date", format: "date" },
          { key: "receipt_number", label: "Receipt #" },
        ]}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Record Payment"
        workflowButtons={() => []}
        cardActions={(item) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleReceipt(item)}>
              <FileDown className="mr-1 h-3 w-3" /> Receipt
            </Button>
            {isStaff && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <AlertDialog open={deleteId === item.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="mr-1 h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>Permanently delete this payment record.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePayment.mutate(item.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </>
        )}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Payment" : "Record Vendor Payment"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Payee Details</legend>
              <div className="space-y-3">
                <div><Label>Payee Name <span className="text-destructive">*</span></Label><Input placeholder="e.g. Abdul technical services" value={form.payee_name} onChange={(e) => setForm({ ...form, payee_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input placeholder="+256..." value={form.payee_phone} onChange={(e) => setForm({ ...form, payee_phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" placeholder="email@example.com" value={form.payee_email} onChange={(e) => setForm({ ...form, payee_email: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Input placeholder="Physical address" value={form.payee_address} onChange={(e) => setForm({ ...form, payee_address: e.target.value })} /></div>
              </div>
            </fieldset>

            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Payment Details</legend>
              <div className="space-y-3">
                <div><Label>Description <span className="text-destructive">*</span></Label><Input placeholder="e.g. Website development - Phase 1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Category</Label>
                    <SearchableSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} placeholder="Category" options={categoryOptions.map((c) => ({ value: c, label: c.replace("_", " ") }))} />
                  </div>
                  <div><Label>Project</Label>
                    <SearchableSelect value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })} placeholder="Optional" options={[{ value: "", label: "No project" }, ...projects.map((p: any) => ({ value: p.id, label: p.name }))]} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                  <div><Label>Payment Method</Label>
                    <SearchableSelect value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })} placeholder="Method" options={methodOptions.map((m) => ({ value: m, label: m.replace("_", " ") }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Payment Date</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
                  <div><Label>Reference Number</Label><Input placeholder="Cheque/MoMo ref" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            </fieldset>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => create.mutate()} disabled={!form.payee_name || !form.description || !form.amount || create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
