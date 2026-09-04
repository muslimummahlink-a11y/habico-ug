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
import { Plus, FileEdit, TrendingUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/change-orders")({
  head: () => ({ meta: [{ title: "Change Orders — Habico Portal" }] }),
  component: ChangeOrdersPage,
});

const statusOptions = ["draft", "pending", "approved", "rejected"];

function ChangeOrdersPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", change_order_number: "", title: "", description: "",
    status: "draft", amount: "0", reason: "", notes: "",
  });

  const { data: changeOrders = [], isLoading } = useQuery({
    queryKey: ["change-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("change_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", change_order_number: "", title: "", description: "",
    status: "draft", amount: "0", reason: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", change_order_number: p.change_order_number ?? "",
      title: p.title ?? "", description: p.description ?? "", status: p.status ?? "draft",
      amount: String(p.amount ?? "0"), reason: p.reason ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("change_orders").insert({
        project_id: form.project_id || null, change_order_number: form.change_order_number || null,
        title: form.title || null, description: form.description || null, status: form.status,
        amount: Number(form.amount), reason: form.reason || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Change order created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["change-orders"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("change_orders").update({
        project_id: form.project_id || null, change_order_number: form.change_order_number || null,
        title: form.title || null, description: form.description || null, status: form.status,
        amount: Number(form.amount), reason: form.reason || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Change order updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["change-orders"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteChangeOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("change_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Change order deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["change-orders"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalCOs = changeOrders.length;
  const approvedValue = changeOrders.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const pendingValue = changeOrders.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const cfg = workflowConfigs.change_orders;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/change-orders" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Change Orders</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total COs</CardTitle><FileEdit className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalCOs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Approved Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {approvedValue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {pendingValue.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={changeOrders}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["change_order_number", "title", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="change_order_number"
        subtitleField="title"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Change Order"
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
                <AlertDialogHeader><AlertDialogTitle>Delete change order?</AlertDialogTitle><AlertDialogDescription>This will permanently delete change order "{item.change_order_number}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteChangeOrder.mutate(item.id)} disabled={deleteChangeOrder.isPending}>
                    {deleteChangeOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit change order" : "Create a change order"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Change Order Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Change order number <span className="text-destructive">*</span></Label><Input value={form.change_order_number} onChange={(e) => setForm({ ...form, change_order_number: e.target.value })} placeholder="e.g. CO-001" /></div>
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
              </div>
              <div className="mt-3"><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title of the change" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the scope change" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial Impact</h3></div>
              <div><Label>Amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Change order value (positive or negative)" /></div>
              <div className="mt-3"><Label>Reason</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Justification or reason for this change" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status &amp; Approval</h3></div>
              <div><Label>Status</Label>
                <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                />
              </div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Approval notes or additional comments" /></div>
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
