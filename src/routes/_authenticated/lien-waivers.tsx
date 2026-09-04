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
import { Plus, FileSignature, TrendingUp, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/lien-waivers")({
  head: () => ({ meta: [{ title: "Lien Waivers — Habico Portal" }] }),
  component: LienWaiversPage,
});

const statusOptions = ["pending", "signed", "received"];
const waiverTypeOptions = ["partial", "final"];

function LienWaiversPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", supplier_id: "", waiver_type: "partial", amount: "0",
    status: "pending", signed_date: "", notes: "",
  });

  const { data: waivers = [], isLoading } = useQuery({
    queryKey: ["lien-waivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lien_waivers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", supplier_id: "", waiver_type: "partial", amount: "0",
    status: "pending", signed_date: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", supplier_id: p.supplier_id ?? "",
      waiver_type: p.waiver_type ?? "partial", amount: String(p.amount ?? "0"),
      status: p.status ?? "pending", signed_date: p.signed_date ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lien_waivers").insert({
        project_id: form.project_id || null, supplier_id: form.supplier_id || null,
        waiver_type: form.waiver_type, amount: Number(form.amount),
        status: form.status, signed_date: form.signed_date || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lien waiver created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["lien-waivers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lien_waivers").update({
        project_id: form.project_id || null, supplier_id: form.supplier_id || null,
        waiver_type: form.waiver_type, amount: Number(form.amount),
        status: form.status, signed_date: form.signed_date || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lien waiver updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["lien-waivers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteWaiver = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lien_waivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lien waiver deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["lien-waivers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalWaivers = waivers.length;
  const signedWaivers = waivers.filter((p: any) => p.status === "signed" || p.status === "received").length;
  const pendingWaivers = waivers.filter((p: any) => p.status === "pending").length;

  const cfg = workflowConfigs["lien-waivers"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/lien-waivers" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Lien Waivers</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Waivers</CardTitle><FileSignature className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalWaivers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Signed / Received</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{signedWaivers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingWaivers}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={waivers}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["waiver_type", "supplier_id"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="waiver_type"
        subtitleField="supplier_id"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Lien Waiver"
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
                <AlertDialogHeader><AlertDialogTitle>Delete lien waiver?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this lien waiver. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteWaiver.mutate(item.id)} disabled={deleteWaiver.isPending}>
                    {deleteWaiver.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit lien waiver" : "Create a lien waiver"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Waiver Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Waiver type <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={form.waiver_type}
                    onValueChange={(v) => setForm({ ...form, waiver_type: v })}
                    placeholder="Select waiver type"
                    options={waiverTypeOptions.map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
              </div>
              <div className="mt-3"><Label>Supplier ID</Label><Input value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} placeholder="Supplier or subcontractor name" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial</h3></div>
              <div><Label>Amount (UGX) <span className="text-destructive">*</span></Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Waiver amount" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status &amp; Dates</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
                <div><Label>Signed date</Label><Input type="date" value={form.signed_date} onChange={(e) => setForm({ ...form, signed_date: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about this waiver" /></div>
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
