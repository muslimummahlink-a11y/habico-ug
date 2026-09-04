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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, PiggyBank, TrendingUp, TrendingDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/allowances")({
  head: () => ({ meta: [{ title: "Allowances — Habico Portal" }] }),
  component: AllowancesPage,
});

const statusOptions = ["open", "exhausted", "closed"];

function AllowancesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", title: "", description: "", budgeted_amount: "0",
    spent_amount: "0", status: "open", notes: "",
  });

  const { data: allowances = [], isLoading } = useQuery({
    queryKey: ["allowances"],
    queryFn: async () => {
      const { data, error } = await supabase.from("allowances").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", title: "", description: "", budgeted_amount: "0",
    spent_amount: "0", status: "open", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", title: p.title ?? "", description: p.description ?? "",
      budgeted_amount: String(p.budgeted_amount ?? "0"), spent_amount: String(p.spent_amount ?? "0"),
      status: p.status ?? "open", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("allowances").insert({
        project_id: form.project_id || null, title: form.title || null,
        description: form.description || null, budgeted_amount: Number(form.budgeted_amount),
        spent_amount: Number(form.spent_amount), status: form.status, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Allowance created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["allowances"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("allowances").update({
        project_id: form.project_id || null, title: form.title || null,
        description: form.description || null, budgeted_amount: Number(form.budgeted_amount),
        spent_amount: Number(form.spent_amount), status: form.status, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Allowance updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["allowances"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteAllowance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("allowances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Allowance deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["allowances"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalBudgeted = allowances.reduce((s: number, p: any) => s + Number(p.budgeted_amount || 0), 0);
  const totalSpent = allowances.reduce((s: number, p: any) => s + Number(p.spent_amount || 0), 0);
  const remaining = totalBudgeted - totalSpent;

  const cfg = workflowConfigs.allowances;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/allowances" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Allowances</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Budgeted</CardTitle><PiggyBank className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalBudgeted.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Spent</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalSpent.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Remaining</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {remaining.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={allowances}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="description"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Allowance"
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
                <AlertDialogHeader><AlertDialogTitle>Delete allowance?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteAllowance.mutate(item.id)} disabled={deleteAllowance.isPending}>
                    {deleteAllowance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit allowance" : "Create an allowance"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Allowance Information</h3></div>
              <div><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Allowance title (e.g. Contingency, Electrical)" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this allowance covers" /></div>
              <div className="mt-3"><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Budget</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Budgeted amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" value={form.budgeted_amount} onChange={(e) => setForm({ ...form, budgeted_amount: e.target.value })} placeholder="Total budget allocated" /></div>
                <div><Label>Spent amount (UGX)</Label><Input type="number" value={form.spent_amount} onChange={(e) => setForm({ ...form, spent_amount: e.target.value })} placeholder="Amount spent so far" /></div>
              </div>
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
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about this allowance" /></div>
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
