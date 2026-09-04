// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, TrendingUp, TrendingDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/construction-invoices")({
  head: () => ({ meta: [{ title: "Construction Invoices — Habico Portal" }] }),
  component: ConstructionInvoicesPage,
});

const statusOptions = ["draft", "sent", "paid", "overdue", "cancelled"];

function ConstructionInvoicesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", client_name: "", invoice_number: "", issue_date: "", due_date: "",
    status: "draft", subtotal: "0", tax_rate: "0", tax_amount: "0", total_amount: "0",
    amount_paid: "0", notes: "",
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["construction-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", client_name: "", invoice_number: "", issue_date: "", due_date: "",
    status: "draft", subtotal: "0", tax_rate: "0", tax_amount: "0", total_amount: "0",
    amount_paid: "0", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", client_name: p.client_name ?? "", invoice_number: p.invoice_number ?? "",
      issue_date: p.issue_date ?? "", due_date: p.due_date ?? "", status: p.status ?? "draft",
      subtotal: String(p.subtotal ?? "0"), tax_rate: String(p.tax_rate ?? "0"),
      tax_amount: String(p.tax_amount ?? "0"), total_amount: String(p.total_amount ?? "0"),
      amount_paid: String(p.amount_paid ?? "0"), notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        project_id: form.project_id || null, client_name: form.client_name || null,
        invoice_number: form.invoice_number || null, issue_date: form.issue_date || null,
        due_date: form.due_date || null, status: form.status,
        subtotal: Number(form.subtotal), tax_rate: Number(form.tax_rate),
        tax_amount: Number(form.tax_amount), total_amount: Number(form.total_amount),
        amount_paid: Number(form.amount_paid), notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invoice created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["construction-invoices"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").update({
        project_id: form.project_id || null, client_name: form.client_name || null,
        invoice_number: form.invoice_number || null, issue_date: form.issue_date || null,
        due_date: form.due_date || null, status: form.status,
        subtotal: Number(form.subtotal), tax_rate: Number(form.tax_rate),
        tax_amount: Number(form.tax_amount), total_amount: Number(form.total_amount),
        amount_paid: Number(form.amount_paid), notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invoice updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["construction-invoices"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invoice deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["construction-invoices"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalInvoiced = invoices.reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);
  const collected = invoices.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);
  const outstanding = invoices.filter((p: any) => p.status !== "paid" && p.status !== "cancelled").reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);
  const overdue = invoices.filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);

  const cfg = workflowConfigs["construction-invoices"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/construction-invoices" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Construction Invoices</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Invoiced</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalInvoiced.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Collected</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {collected.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Outstanding</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {outstanding.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {overdue.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={invoices}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["invoice_number", "client_name"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="invoice_number"
        subtitleField="client_name"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Invoice"
        workflowButtons={(item) => {
          const actions = cfg.actions.filter((a) => !a.precondition || a.precondition(item));
          return actions.map((a) => ({
            label: a.label,
            icon: a.icon,
            to: a.paramKey ? `${a.to}?${a.paramKey}=${item.id}` : a.to,
            variant: "outline" as const,
          }));
        }}
        cardActions={(item) => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
            <AlertDialog open={deleteId === item.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete invoice?</AlertDialogTitle><AlertDialogDescription>This will permanently delete invoice "{item.invoice_number}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteInvoice.mutate(item.id)} disabled={deleteInvoice.isPending}>
                    {deleteInvoice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit invoice" : "Create an invoice"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Invoice Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Invoice number <span className="text-destructive">*</span></Label><Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="e.g. INV-001" /></div>
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
              </div>
              <div className="mt-3"><Label>Client name <span className="text-destructive">*</span></Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Client or company being invoiced" /></div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Issue date <span className="text-destructive">*</span></Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
                <div><Label>Due date <span className="text-destructive">*</span></Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial Details</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subtotal (UGX)</Label><Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} placeholder="Amount before tax" /></div>
                <div><Label>Tax rate (%)</Label><Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} placeholder="e.g. 18" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Tax amount (UGX)</Label><Input type="number" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} placeholder="Calculated tax" /></div>
                <div><Label>Total amount (UGX)</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="Grand total" /></div>
              </div>
              <div className="mt-3"><Label>Amount paid (UGX)</Label><Input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} placeholder="Amount received from client" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status &amp; Notes</h3></div>
              <div><Label>Status</Label>
                <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                />
              </div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Payment terms, remittance details, or notes" /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
