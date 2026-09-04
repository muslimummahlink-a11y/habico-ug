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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, CalendarDays, CheckCircle2, AlertTriangle, Clock, Loader2, Flag, GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/project-schedules")({
  head: () => ({ meta: [{ title: "Project Schedules — Habico Portal" }] }),
  component: ProjectSchedulesPage,
});

const statusOptions = ["planned", "in_progress", "completed", "delayed"];

function ProjectSchedulesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    milestone: false,
    status: "planned",
    progress: "0",
    assignee: "",
    parent_id: "",
    notes: "",
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["project-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_schedules")
        .select("*, projects(name), parent:project_schedules!project_schedules_parent_id_fkey(title)")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-pick-schedule"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("name");
      return data ?? [];
    },
  });

  const parentCandidates = schedules.filter((s: any) => s.id !== editing?.id);

  const resetForm = () => setForm({
    project_id: "", title: "", description: "", start_date: "", end_date: "",
    milestone: false, status: "planned", progress: "0", assignee: "",
    parent_id: "", notes: "",
  });

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      project_id: s.project_id ?? "",
      title: s.title ?? "",
      description: s.description ?? "",
      start_date: s.start_date ?? "",
      end_date: s.end_date ?? "",
      milestone: s.milestone ?? false,
      status: s.status ?? "planned",
      progress: String(s.progress ?? "0"),
      assignee: s.assignee ?? "",
      parent_id: s.parent_id ?? "",
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_schedules").insert({
        project_id: form.project_id || null,
        title: form.title,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        milestone: form.milestone,
        status: form.status,
        progress: Number(form.progress),
        assignee: form.assignee || null,
        parent_id: form.parent_id || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Schedule item created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["project-schedules"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_schedules").update({
        project_id: form.project_id || null,
        title: form.title,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        milestone: form.milestone,
        status: form.status,
        progress: Number(form.progress),
        assignee: form.assignee || null,
        parent_id: form.parent_id || null,
        notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Schedule item updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["project-schedules"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Schedule item deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["project-schedules"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalTasks = schedules.length;
  const onSchedule = schedules.filter((s: any) => s.status === "in_progress" || s.status === "planned").length;
  const delayed = schedules.filter((s: any) => s.status === "delayed").length;
  const completed = schedules.filter((s: any) => s.status === "completed").length;
  const overallProgress = totalTasks > 0 ? Math.round(schedules.reduce((s: number, t: any) => s + Number(t.progress || 0), 0) / totalTasks) : 0;

  const cfg = workflowConfigs["project-schedules"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/project-schedules" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Project Schedules</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Tasks</CardTitle><CalendarDays className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalTasks}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">On Schedule</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{onSchedule}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Delayed</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{delayed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Overall Progress</CardTitle><CalendarDays className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={schedules}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "description", "assignee"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="project_name"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Schedule Item"
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
                <AlertDialogHeader><AlertDialogTitle>Delete schedule item?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteSchedule.mutate(item.id)} disabled={deleteSchedule.isPending}>
                    {deleteSchedule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit schedule item" : "Create a schedule item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Assignment</p>
            </div>
            <div><Label>Project <span className="text-destructive">*</span></Label>
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

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Details</p>
            </div>
            <div><Label>Title <span className="text-destructive">*</span></Label><Input placeholder="e.g. Foundation excavation" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} placeholder="Describe the scope of work, deliverables, and any dependencies..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Assignee</Label><Input placeholder="Name or team responsible" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule &amp; Dates</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status &amp; Progress</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Status <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  placeholder="Select status"
                  options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                />
              </div>
              <div><Label>Progress (%)</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input type="range" min="0" max="100" className="flex-1" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
                  <span className="min-w-[3ch] text-right text-sm font-semibold">{form.progress}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <input type="checkbox" id="milestone" className="h-4 w-4 rounded border-gray-300" checked={form.milestone} onChange={(e) => setForm({ ...form, milestone: e.target.checked })} />
              <Label htmlFor="milestone" className="cursor-pointer font-medium">Mark as milestone</Label>
              <Flag className="ml-auto h-4 w-4 text-muted-foreground" />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hierarchy &amp; Notes</p>
            </div>
            <div><Label>Parent task</Label>
              <SearchableSelect
                value={form.parent_id}
                onValueChange={(v) => setForm({ ...form, parent_id: v })}
                placeholder="No parent (top-level task)"
                options={[
                  { value: "", label: "No parent (top-level task)" },
                  ...parentCandidates.map((s: any) => ({ value: s.id, label: `${s.title}${s.project_id ? ` — ${s.projects?.name ?? ""}` : ""}` }))
                ]}
              />
              <p className="mt-1 text-xs text-muted-foreground">Assign this task as a sub-task of another schedule item to build a hierarchy.</p>
            </div>
            <div><Label>Notes</Label><Textarea rows={3} placeholder="Additional notes, assumptions, constraints, or references..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.title || !form.project_id || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create schedule item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
