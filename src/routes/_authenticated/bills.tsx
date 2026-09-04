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
import { Plus, Receipt, TrendingUp, TrendingDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/bills")({
  head: () => ({ meta: [{ title: "Bills — Habico Portal" }] }),
  component: BillsPage,
});

const statusOptions = ["unpaid", "paid", "overdue", "cancelled"];

function BillsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", supplier_id: "", bill_number: "", description: "",
    amount: "0", due_date: "", status: "unpaid", paid_date: "", notes: "",
  });

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bills").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", supplier_id: "", bill_number: "", description: "",
    amount: "0", due_date: "", status: "unpaid", paid_date: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", supplier_id: p.supplier_id ?? "", bill_number: p.bill_number ?? "",
      description: p.description ?? "", amount: String(p.amount ?? "0"),
      due_date: p.due_date ?? "", status: p.status ?? "unpaid",
      paid_date: p.paid_date ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bills").insert({
        project_id: form.project_id || null, supplier_id: form.supplier_id || null,
        bill_number: form.bill_number || null, description: form.description || null,
        amount: Number(form.amount), due_date: form.due_date || null,
        status: form.status, paid_date: form.paid_date || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bill created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["bills"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bills").update({
        project_id: form.project_id || null, supplier_id: form.supplier_id || null,
        bill_number: form.bill_number || null, description: form.description || null,
        amount: Number(form.amount), due_date: form.due_date || null,
        status: form.status, paid_date: form.paid_date || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bill updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["bills"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bill deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["bills"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalBills = bills.length;
  const unpaidCount = bills.filter((p: any) => p.status === "unpaid").length;
  const overdueCount = bills.filter((p: any) => p.status === "overdue").length;
  const paidCount = bills.filter((p: any) => p.status === "paid").length;

  const cfg = workflowConfigs.bills;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/bills" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Bills</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Bills</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalBills}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Unpaid</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{unpaidCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overdueCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Paid</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{paidCount}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={bills}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["bill_number", "description", "supplier_id"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="bill_number"
        subtitleField="description"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Bill"
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
                <AlertDialogHeader><AlertDialogTitle>Delete bill?</AlertDialogTitle><AlertDialogDescription>This will permanently delete bill "{item.bill_number}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteBill.mutate(item.id)} disabled={deleteBill.isPending}>
                    {deleteBill.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit bill" : "Create a bill"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Bill Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Bill number <span className="text-destructive">*</span></Label><Input value={form.bill_number} onChange={(e) => setForm({ ...form, bill_number: e.target.value })} placeholder="e.g. BILL-001" /></div>
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Supplier ID</Label><Input value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} placeholder="Vendor or supplier reference" /></div>
              </div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description of goods or services billed" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Total bill amount" /></div>
                <div><Label>Due date <span className="text-destructive">*</span></Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Payment</h3></div>
              <div><Label>Status</Label>
                <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                />
              </div>
              <div className="mt-3"><Label>Paid date</Label><Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Payment reference, terms, or notes" /></div>
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
