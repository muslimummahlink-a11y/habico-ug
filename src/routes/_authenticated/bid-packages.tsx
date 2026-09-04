// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, PackageOpen, TrendingUp, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/bid-packages")({
  head: () => ({ meta: [{ title: "Bid Packages — Habico Portal" }] }),
  component: BidPackagesPage,
});

const statusOptions = ["draft", "sent", "under_review", "awarded", "closed"];

function BidPackagesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", title: "", description: "", status: "draft",
    due_date: "", estimated_budget: "", actual_award: "", awarded_to: "", notes: "",
  });

  const { data: bidPackages = [], isLoading } = useQuery({
    queryKey: ["bid_packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bid_packages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const resetForm = () => setForm({
    project_id: "", title: "", description: "", status: "draft",
    due_date: "", estimated_budget: "", actual_award: "", awarded_to: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", title: p.title ?? "", description: p.description ?? "",
      status: p.status ?? "draft", due_date: p.due_date ?? "",
      estimated_budget: p.estimated_budget != null ? String(p.estimated_budget) : "",
      actual_award: p.actual_award != null ? String(p.actual_award) : "",
      awarded_to: p.awarded_to ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bid_packages").insert({
        project_id: form.project_id || null, title: form.title, description: form.description || null,
        status: form.status, due_date: form.due_date || null,
        estimated_budget: form.estimated_budget ? Number(form.estimated_budget) : null,
        actual_award: form.actual_award ? Number(form.actual_award) : null,
        awarded_to: form.awarded_to || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bid package created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["bid_packages"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bid_packages").update({
        project_id: form.project_id || null, title: form.title, description: form.description || null,
        status: form.status, due_date: form.due_date || null,
        estimated_budget: form.estimated_budget ? Number(form.estimated_budget) : null,
        actual_award: form.actual_award ? Number(form.actual_award) : null,
        awarded_to: form.awarded_to || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bid package updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["bid_packages"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteBidPackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bid_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bid package deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["bid_packages"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalPackages = bidPackages.length;
  const awardedValue = bidPackages.filter((p: any) => p.status === "awarded").reduce((s: number, p: any) => s + Number(p.actual_award || 0), 0);
  const pendingPackages = bidPackages.filter((p: any) => p.status === "sent" || p.status === "under_review").length;

  const cfg = workflowConfigs["bid-packages"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/bid-packages" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Preconstruction</div>
          <h1 className="display text-3xl font-bold">Bid Packages</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Packages</CardTitle><PackageOpen className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPackages}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Awarded Value</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {awardedValue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingPackages}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Avg. Award</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">
            {totalPackages > 0 ? `UGX ${Math.round(awardedValue / totalPackages).toLocaleString()}` : "UGX 0"}
          </div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={bidPackages}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "description", "awarded_to"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="package_number"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Bid Package"
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
                <AlertDialogHeader><AlertDialogTitle>Delete bid package?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteBidPackage.mutate(item.id)} disabled={deleteBidPackage.isPending}>
                    {deleteBidPackage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit bid package" : "Create a bid package"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Package Information</h3></div>
              <div><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Bid package title or scope name" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the work package" /></div>
              <div className="mt-3"><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Bid Details</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><Label>Estimated budget (UGX)</Label><Input type="number" value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} placeholder="Estimated budget range" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Actual award (UGX)</Label><Input type="number" value={form.actual_award} onChange={(e) => setForm({ ...form, actual_award: e.target.value })} placeholder="Final awarded amount" /></div>
                <div><Label>Awarded to</Label><Input value={form.awarded_to} onChange={(e) => setForm({ ...form, awarded_to: e.target.value })} placeholder="Contractor or vendor awarded the bid" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status &amp; Notes</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
              </div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes regarding this bid package" /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.title || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
