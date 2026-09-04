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
import { LocationSelector } from "@/components/location-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FolderKanban, TrendingUp, TrendingDown, Loader2, Pencil, Trash2, Edit2 } from "lucide-react";
import { useRecordActions } from "@/hooks/use-record-actions";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Projects — Habico Portal" }] }),
  component: ProjectsPage,
});

const statusOptions = ["planning", "in_progress", "on_hold", "completed", "cancelled"];

function ProjectsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { deleteMutation, editMutation, copyMutation } = useRecordActions({ table: "projects" });

  const resetForm = () => setForm({
    name: "", description: "", location: "", status: "planning",
    start_date: "", target_end_date: "", budget: "0",
    client_name: "", client_phone: "", client_email: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name ?? "", description: p.description ?? "", location: p.location ?? "",
      status: p.status ?? "planning", start_date: p.start_date ?? "", target_end_date: p.target_end_date ?? "",
      budget: String(p.budget ?? "0"), client_name: p.client_name ?? "", client_phone: p.client_phone ?? "",
      client_email: p.client_email ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        name: form.name, description: form.description || null, location: form.location || null,
        status: form.status, start_date: form.start_date || null, target_end_date: form.target_end_date || null,
        budget: Number(form.budget), client_name: form.client_name || null, client_phone: form.client_phone || null,
        client_email: form.client_email || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Project created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").update({
        name: form.name, description: form.description || null, location: form.location || null,
        status: form.status, start_date: form.start_date || null, target_end_date: form.target_end_date || null,
        budget: Number(form.budget), client_name: form.client_name || null, client_phone: form.client_phone || null,
        client_email: form.client_email || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Project updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Project deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["projects"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalBudget = projects.reduce((s: number, p: any) => s + Number(p.budget || 0), 0);
  const totalSpent = projects.reduce((s: number, p: any) => s + Number(p.spent || 0), 0);
  const activeProjects = projects.filter((p: any) => p.status === "in_progress" || p.status === "planning").length;
  const completedProjects = projects.filter((p: any) => p.status === "completed").length;
  const completionRate = projects.length > 0 ? Math.round((completedProjects / projects.length) * 100) : 0;

  const cfg = workflowConfigs.projects;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/projects" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Projects</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active Projects</CardTitle><FolderKanban className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeProjects}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Budget</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalBudget.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Spent</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalSpent.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{completionRate}%</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={projects}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["name", "location", "client_name", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="location"
        statusField="status"
        metricFields={[
          { key: "budget", label: "Budget", format: "currency" },
          { key: "spent", label: "Spent", format: "currency" },
        ]}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Project"
        workflowButtons={(item) => {
          const actions = cfg.actions;
          return actions.map((a) => ({
            label: a.label,
            icon: a.icon,
            to: `${a.to}?project_id=${item.id}`,
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
                <AlertDialogHeader><AlertDialogTitle>Delete project?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteProject.mutate(item.id)} disabled={deleteProject.isPending}>
                    {deleteProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit project" : "Create a project"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Project Info</h3></div>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter project name" /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the project scope and objectives" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Status</Label>
                    <SearchableSelect
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                      placeholder="Select status"
                      options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                    />
                  </div>
                  <div className="col-span-2"><LocationSelector value={form.location} onChange={(v) => setForm({ ...form, location: v })} /></div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Client Details</h3></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Client name</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Full name" /></div>
                  <div><Label>Client phone</Label><Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="e.g. +256 700 000 000" /></div>
                </div>
                <div><Label>Client email</Label><Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="client@example.com" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Budget & Dates</h3></div>
              <div className="space-y-3">
                <div><Label>Budget (UGX) *</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div><Label>Target end date</Label><Input type="date" value={form.target_end_date} onChange={(e) => setForm({ ...form, target_end_date: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes or remarks" /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.name || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
