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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileSignature, TrendingUp, TrendingDown, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/commitment-log")({
  head: () => ({ meta: [{ title: "Commitment Log — Habico Portal" }] }),
  component: CommitmentLogPage,
});

const typeOptions = ["subcontract", "purchase_order", "change_order", "other"];

const statusOptions = ["pending", "approved", "executed", "completed"];

function CommitmentLogPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", vendor: "", type: "subcontract", description: "",
    amount: "0", budget_line: "", status: "pending",
    executed_date: "", notes: "",
  });

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ["commitment_log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commitment_log").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", vendor: "", type: "subcontract", description: "",
    amount: "0", budget_line: "", status: "pending",
    executed_date: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", vendor: p.vendor ?? "", type: p.type ?? "subcontract",
      description: p.description ?? "", amount: String(p.amount ?? "0"),
      budget_line: p.budget_line ?? "", status: p.status ?? "pending",
      executed_date: p.executed_date ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("commitment_log").insert({
        project_id: form.project_id, vendor: form.vendor, type: form.type,
        description: form.description || null, amount: Number(form.amount),
        budget_line: form.budget_line || null, status: form.status,
        executed_date: form.executed_date || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Commitment created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["commitment_log"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("commitment_log").update({
        project_id: form.project_id, vendor: form.vendor, type: form.type,
        description: form.description || null, amount: Number(form.amount),
        budget_line: form.budget_line || null, status: form.status,
        executed_date: form.executed_date || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Commitment updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["commitment_log"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteCommitment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commitment_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Commitment deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["commitment_log"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalCommitments = commitments.length;
  const executedValue = commitments
    .filter((c: any) => c.status === "executed" || c.status === "completed")
    .reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const pendingCount = commitments.filter((c: any) => c.status === "pending").length;
  const totalBudget = commitments.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

  const cfg = workflowConfigs["commitment-log"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/commitment-log" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Control</div>
          <h1 className="display text-3xl font-bold">Commitment Log</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Commitments</CardTitle><FileSignature className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalCommitments}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Executed Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {executedValue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Budget</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalBudget.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={commitments}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["vendor", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="description"
        subtitleField="vendor"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Commitment"
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
                <AlertDialogHeader><AlertDialogTitle>Delete commitment?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the commitment with "{item.vendor}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteCommitment.mutate(item.id)} disabled={deleteCommitment.isPending}>
                    {deleteCommitment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit commitment" : "Record a commitment"}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required Information</span></div>
              <div><Label>Project ID <span className="text-destructive">*</span></Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="e.g. a1b2c3d4-..." /></div>
              <div className="mt-3"><Label>Vendor / Contractor <span className="text-destructive">*</span></Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. ABC Construction Ltd" /></div>
              <div className="mt-3"><Label>Type <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                  placeholder="Select type"
                  options={typeOptions.map((s) => ({ value: s, label: s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) }))}
                />
              </div>
              <div className="mt-3"><Label>Amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000000" /></div>
            </div>
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Terms & Status</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Status</Label>
                  <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
                </div>
                <div><Label>Budget line</Label><Input value={form.budget_line} onChange={(e) => setForm({ ...form, budget_line: e.target.value })} placeholder="e.g. 01-100-STRUCT" /></div>
              </div>
              <div className="mt-3"><Label>Executed date</Label><Input type="date" value={form.executed_date} onChange={(e) => setForm({ ...form, executed_date: e.target.value })} /></div>
            </div>
            <div>
              <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description & Notes</span></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope of work, deliverables, and key terms..." /></div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes or comments..." /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.project_id || !form.vendor || !form.type || !form.amount || Number(form.amount) <= 0 || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
