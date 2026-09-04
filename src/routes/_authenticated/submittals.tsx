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
import { Plus, FileUp, CheckCircle2, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/submittals")({
  head: () => ({ meta: [{ title: "Submittals — Habico Portal" }] }),
  component: SubmittalsPage,
});

const statusOptions = ["draft", "submitted", "under_review", "approved", "rejected", "revised"];

function SubmittalsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", title: "", description: "", status: "draft",
    due_date: "", submitted_date: "", review_notes: "", file_url: "",
  });

  const { data: submittals = [], isLoading } = useQuery({
    queryKey: ["submittals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("submittals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", title: "", description: "", status: "draft",
    due_date: "", submitted_date: "", review_notes: "", file_url: "",
  });

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      project_id: s.project_id ?? "", title: s.title ?? "", description: s.description ?? "",
      status: s.status ?? "draft", due_date: s.due_date ?? "", submitted_date: s.submitted_date ?? "",
      review_notes: s.review_notes ?? "", file_url: s.file_url ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("submittals").insert({
        project_id: form.project_id || null, title: form.title, description: form.description || null,
        status: form.status, due_date: form.due_date || null, submitted_date: form.submitted_date || null,
        review_notes: form.review_notes || null, file_url: form.file_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Submittal created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["submittals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("submittals").update({
        project_id: form.project_id || null, title: form.title, description: form.description || null,
        status: form.status, due_date: form.due_date || null, submitted_date: form.submitted_date || null,
        review_notes: form.review_notes || null, file_url: form.file_url || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Submittal updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["submittals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteSubmittal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("submittals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Submittal deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["submittals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalSubmittals = submittals.length;
  const approvedSubmittals = submittals.filter((s: any) => s.status === "approved").length;
  const pendingReview = submittals.filter((s: any) => s.status === "submitted" || s.status === "under_review").length;

  const cfg = workflowConfigs.submittals;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/submittals" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Submittals</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Submittals</CardTitle><FileUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalSubmittals}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Approved</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{approvedSubmittals}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending Review</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingReview}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={submittals}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "description", "submittal_number"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="submittal_number"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Submittal"
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
                <AlertDialogHeader><AlertDialogTitle>Delete submittal?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteSubmittal.mutate(item.id)} disabled={deleteSubmittal.isPending}>
                    {deleteSubmittal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit submittal" : "Create a submittal"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Submittal Details</h3></div>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Name of the submittal" /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the submittal" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Review</h3></div>
              <div className="space-y-3">
                <div><Label>Status</Label>
                <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                />
                </div>
                <div><Label>Review notes</Label><Textarea rows={2} value={form.review_notes} onChange={(e) => setForm({ ...form, review_notes: e.target.value })} placeholder="Reviewer comments and feedback" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Dates</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><Label>Submitted date</Label><Input type="date" value={form.submitted_date} onChange={(e) => setForm({ ...form, submitted_date: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">File</h3></div>
              <div><Label>File URL</Label><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://example.com/document.pdf" /></div>
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
