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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/punch-list")({
  head: () => ({ meta: [{ title: "Punch List — Habico Portal" }] }),
  component: PunchListPage,
});

const statusOptions = ["open", "in_progress", "completed", "verified"];
const priorityOptions = ["low", "medium", "high", "urgent"];

function PunchListPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager" || role === "site_engineer";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", title: "", description: "", status: "open", priority: "medium",
    assignee: "", due_date: "", completed_date: "", verified_by: "", notes: "",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["punch-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("punch_list_items").select("*, projects!inner(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", title: "", description: "", status: "open", priority: "medium",
    assignee: "", due_date: "", completed_date: "", verified_by: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "",
      title: p.title ?? "",
      description: p.description ?? "",
      status: p.status ?? "open",
      priority: p.priority ?? "medium",
      assignee: p.assignee ?? "",
      due_date: p.due_date ?? "",
      completed_date: p.completed_date ?? "",
      verified_by: p.verified_by ?? "",
      notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("punch_list_items").insert({
        project_id: form.project_id, title: form.title, description: form.description,
        status: form.status, priority: form.priority, assignee: form.assignee || null,
        due_date: form.due_date || null, completed_date: form.completed_date || null,
        verified_by: form.verified_by || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Punch list item created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["punch-list"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("punch_list_items").update({
        project_id: form.project_id, title: form.title, description: form.description,
        status: form.status, priority: form.priority, assignee: form.assignee || null,
        due_date: form.due_date || null, completed_date: form.completed_date || null,
        verified_by: form.verified_by || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Punch list item updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["punch-list"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("punch_list_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Punch list item deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["punch-list"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const now = new Date().toISOString().split("T")[0];
  const totalItems = items.length;
  const openItems = items.filter((p: any) => p.status === "open" || p.status === "in_progress").length;
  const completedItems = items.filter((p: any) => p.status === "completed" || p.status === "verified").length;
  const overdueItems = items.filter((p: any) => p.status !== "completed" && p.status !== "verified" && p.due_date && p.due_date < now).length;

  const cfg = workflowConfigs["punch-list"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/punch-list" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Quality</div>
          <h1 className="display text-3xl font-bold">Punch List</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total items</CardTitle><ClipboardCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{openItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{completedItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><Clock className="h-4 w-4 text-red-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overdueItems}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={items}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "description", "assignee"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="description"
        subtitleField="location"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Item"
        workflowButtons={() => []}
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
                <AlertDialogHeader><AlertDialogTitle>Delete punch list item?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteItem.mutate(item.id)} disabled={deleteItem.isPending}>
                    {deleteItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit punch list item" : "Add punch list item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Section: Item Details */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Item Details</legend>
              <div className="space-y-3">
                <div>
                  <Label>Project <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={form.project_id}
                    onValueChange={(v) => setForm({ ...form, project_id: v })}
                    placeholder="Select a project..."
                    options={[
                      { value: "", label: "Select a project..." },
                      ...projects.map((p: any) => ({ value: p.id, label: p.name }))
                    ]}
                  />
                </div>
                <div>
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. Crack in column B-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Description <span className="text-destructive">*</span></Label>
                  <Textarea rows={3} placeholder="Detailed description of the issue, including location and observations..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </fieldset>

            {/* Section: Classification */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Classification</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <SearchableSelect
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v })}
                    placeholder="Select priority"
                    options={priorityOptions.map((p) => ({ value: p, label: p }))}
                  />
                </div>
              </div>
            </fieldset>

            {/* Section: Assignment & Dates */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Assignment &amp; Dates</legend>
              <div className="space-y-3">
                <div>
                  <Label>Assignee</Label>
                  <Input placeholder="Full name of responsible person" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Due date</Label>
                    <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Completed date</Label>
                    <Input type="date" value={form.completed_date} onChange={(e) => setForm({ ...form, completed_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Verified by</Label>
                  <Input placeholder="Name of person who verified completion" value={form.verified_by} onChange={(e) => setForm({ ...form, verified_by: e.target.value })} />
                </div>
              </div>
            </fieldset>

            {/* Section: Notes */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Additional Notes</legend>
              <div>
                <Label>Notes</Label>
                <Textarea rows={3} placeholder="Any additional remarks, inspection notes, or observations..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </fieldset>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.title || !form.description || !form.project_id || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
