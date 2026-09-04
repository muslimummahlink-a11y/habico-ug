// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { Plus, CreditCard, TrendingUp, TrendingDown, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/progress-payments")({
  head: () => ({ meta: [{ title: "Progress Payments — Habico Portal" }] }),
  component: ProgressPaymentsPage,
});

const statusOptions = ["draft", "submitted", "approved", "paid", "rejected"];

function ProgressPaymentsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", application_number: "", period_label: "",
    period_start: "", period_end: "", amount: "0", retainage: "0",
    net_amount: "0", status: "draft", submit_date: "",
    approved_date: "", paid_date: "", notes: "",
  });

  useEffect(() => {
    const amt = Number(form.amount) || 0;
    const ret = Number(form.retainage) || 0;
    const net = Math.max(amt - ret, 0);
    setForm((prev) => ({ ...prev, net_amount: String(net) }));
  }, [form.amount, form.retainage]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["progress_payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("progress_payments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", application_number: "", period_label: "",
    period_start: "", period_end: "", amount: "0", retainage: "0",
    net_amount: "0", status: "draft", submit_date: "",
    approved_date: "", paid_date: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", application_number: p.application_number ?? "",
      period_label: p.period_label ?? "", period_start: p.period_start ?? "",
      period_end: p.period_end ?? "", amount: String(p.amount ?? "0"),
      retainage: String(p.retainage ?? "0"), net_amount: String(p.net_amount ?? "0"),
      status: p.status ?? "draft", submit_date: p.submit_date ?? "",
      approved_date: p.approved_date ?? "", paid_date: p.paid_date ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const amt = Number(form.amount) || 0;
      const ret = Number(form.retainage) || 0;
      const { error } = await supabase.from("progress_payments").insert({
        project_id: form.project_id, application_number: form.application_number,
        period_label: form.period_label || null, period_start: form.period_start || null,
        period_end: form.period_end || null, amount: amt, retainage: ret,
        net_amount: Math.max(amt - ret, 0), status: form.status,
        submit_date: form.submit_date || null, approved_date: form.approved_date || null,
        paid_date: form.paid_date || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Progress payment created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["progress_payments"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const amt = Number(form.amount) || 0;
      const ret = Number(form.retainage) || 0;
      const { error } = await supabase.from("progress_payments").update({
        project_id: form.project_id, application_number: form.application_number,
        period_label: form.period_label || null, period_start: form.period_start || null,
        period_end: form.period_end || null, amount: amt, retainage: ret,
        net_amount: Math.max(amt - ret, 0), status: form.status,
        submit_date: form.submit_date || null, approved_date: form.approved_date || null,
        paid_date: form.paid_date || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Progress payment updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["progress_payments"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("progress_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Progress payment deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["progress_payments"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalApplications = payments.length;
  const approvedValue = payments
    .filter((p: any) => p.status === "approved" || p.status === "paid")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const paidValue = payments
    .filter((p: any) => p.status === "paid")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const pendingCount = payments.filter((p: any) => p.status === "submitted" || p.status === "draft").length;

  const cfg = workflowConfigs["progress-payments"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/progress-payments" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Progress Payments</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Applications</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalApplications}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Approved Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {approvedValue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Paid</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {paidValue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={payments}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["application_number", "period_label"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="payment_number"
        subtitleField="period"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Payment"
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
                <AlertDialogHeader><AlertDialogTitle>Delete progress payment?</AlertDialogTitle><AlertDialogDescription>This will permanently delete application "{item.application_number}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePayment.mutate(item.id)} disabled={deletePayment.isPending}>
                    {deletePayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit progress payment" : "Create a progress payment"}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required Information</span></div>
              <div><Label>Project ID <span className="text-destructive">*</span></Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="e.g. a1b2c3d4-..." /></div>
              <div className="mt-3"><Label>Application number <span className="text-destructive">*</span></Label><Input value={form.application_number} onChange={(e) => setForm({ ...form, application_number: e.target.value })} placeholder="e.g. APP-2024-001" /></div>
              <div className="mt-3"><Label>Amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 100000000" /></div>
            </div>
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period Details</span></div>
              <div><Label>Period label</Label><Input value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} placeholder="e.g. January 2024, Month 3" /></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><Label>Period start</Label><Input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
                <div><Label>Period end</Label><Input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Breakdown</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Retainage (UGX)</Label><Input type="number" value={form.retainage} onChange={(e) => setForm({ ...form, retainage: e.target.value })} placeholder="e.g. 5000000" /></div>
                <div><Label>Net amount (auto)</Label>
                  <div className="mt-1.5 flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold text-muted-foreground">
                    UGX {Number(form.net_amount).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status & Dates</span></div>
              <div><Label>Status</Label>
                <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div><Label>Submit date</Label><Input type="date" value={form.submit_date} onChange={(e) => setForm({ ...form, submit_date: e.target.value })} /></div>
                <div><Label>Approved date</Label><Input type="date" value={form.approved_date} onChange={(e) => setForm({ ...form, approved_date: e.target.value })} /></div>
                <div><Label>Paid date</Label><Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</span></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional information or comments..." /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.project_id || !form.application_number || !form.amount || Number(form.amount) <= 0 || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
