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
import { Plus, MessageSquareText, Clock, CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/rfis")({
  head: () => ({ meta: [{ title: "RFIs — Habico Portal" }] }),
  component: RfisPage,
});

const statusOptions = ["open", "answered", "closed"];
const priorityOptions = ["low", "medium", "high", "urgent"];

function RfisPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", rfi_number: "", title: "", question: "", response: "",
    status: "open", priority: "medium", due_date: "",
  });

  const { data: rfis = [], isLoading } = useQuery({
    queryKey: ["rfis"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rfis").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", rfi_number: "", title: "", question: "", response: "",
    status: "open", priority: "medium", due_date: "",
  });

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      project_id: r.project_id ?? "", rfi_number: r.rfi_number ?? "", title: r.title ?? "",
      question: r.question ?? "", response: r.response ?? "", status: r.status ?? "open",
      priority: r.priority ?? "medium", due_date: r.due_date ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rfis").insert({
        project_id: form.project_id || null, rfi_number: form.rfi_number || null, title: form.title,
        question: form.question || null, response: form.response || null, status: form.status,
        priority: form.priority, due_date: form.due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("RFI created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["rfis"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rfis").update({
        project_id: form.project_id || null, rfi_number: form.rfi_number || null, title: form.title,
        question: form.question || null, response: form.response || null, status: form.status,
        priority: form.priority, due_date: form.due_date || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("RFI updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["rfis"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteRfi = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rfis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("RFI deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["rfis"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const today = new Date();
  const openRfis = rfis.filter((r: any) => r.status === "open").length;
  const overdueRfis = rfis.filter((r: any) => r.status === "open" && r.due_date && new Date(r.due_date) < today).length;
  const answeredRfis = rfis.filter((r: any) => r.status === "answered").length;

  const cfg = workflowConfigs.rfis;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/rfis" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">RFIs</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open RFIs</CardTitle><MessageSquareText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{openRfis}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overdue</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{overdueRfis}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Answered</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{answeredRfis}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={rfis}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "question", "rfi_number"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="rfi_number"
        subtitleField="subject"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New RFI"
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
                <AlertDialogHeader><AlertDialogTitle>Delete RFI?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteRfi.mutate(item.id)} disabled={deleteRfi.isPending}>
                    {deleteRfi.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit RFI" : "Create an RFI"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">RFI Info</h3></div>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief subject of the RFI" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>RFI number</Label><Input value={form.rfi_number} onChange={(e) => setForm({ ...form, rfi_number: e.target.value })} placeholder="e.g. RFI-001" /></div>
                  <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Question & Response</h3></div>
              <div className="space-y-3">
                <div><Label>Question *</Label><Textarea rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Describe the information or clarification needed" /></div>
                <div><Label>Response</Label><Textarea rows={3} value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} placeholder="Official response from the responsible party" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Assignment</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Priority</Label>
                  <SearchableSelect
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v })}
                    placeholder="Select priority"
                    options={priorityOptions.map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
              </div>
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
