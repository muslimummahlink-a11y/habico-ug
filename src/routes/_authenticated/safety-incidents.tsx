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
import { Plus, ShieldAlert, AlertCircle, CheckCircle2, AlertTriangle, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LocationSelector } from "@/components/location-selector";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/safety-incidents")({
  head: () => ({ meta: [{ title: "Safety Incidents — Habico Portal" }] }),
  component: SafetyIncidentsPage,
});

const incidentTypeOptions = ["near_miss", "first_aid", "medical_treatment", "lost_time", "property_damage", "fatality"];
const statusOptions = ["reported", "investigating", "resolved", "closed"];
const severityOptions = ["low", "medium", "high", "critical"];

function SafetyIncidentsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager" || role === "safety_officer";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", incident_date: "", incident_type: "near_miss", description: "",
    root_cause: "", corrective_action: "", status: "reported",
    reported_by: "", location: "", severity: "low", notes: "",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["safety-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("safety_incidents").select("*, projects!inner(name)").order("incident_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", incident_date: "", incident_type: "near_miss", description: "",
    root_cause: "", corrective_action: "", status: "reported",
    reported_by: "", location: "", severity: "low", notes: "",
  });

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      project_id: s.project_id ?? "",
      incident_date: s.incident_date ?? "",
      incident_type: s.incident_type ?? "near_miss",
      description: s.description ?? "",
      root_cause: s.root_cause ?? "",
      corrective_action: s.corrective_action ?? "",
      status: s.status ?? "reported",
      reported_by: s.reported_by ?? "",
      location: s.location ?? "",
      severity: s.severity ?? "low",
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("safety_incidents").insert({
        project_id: form.project_id, incident_date: form.incident_date,
        incident_type: form.incident_type, description: form.description,
        root_cause: form.root_cause || null, corrective_action: form.corrective_action || null,
        status: form.status, reported_by: form.reported_by || null,
        location: form.location, severity: form.severity, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Safety incident recorded"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["safety-incidents"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("safety_incidents").update({
        project_id: form.project_id, incident_date: form.incident_date,
        incident_type: form.incident_type, description: form.description,
        root_cause: form.root_cause || null, corrective_action: form.corrective_action || null,
        status: form.status, reported_by: form.reported_by || null,
        location: form.location, severity: form.severity, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Safety incident updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["safety-incidents"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteIncident = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("safety_incidents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Safety incident deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["safety-incidents"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter((s: any) => s.status === "reported" || s.status === "investigating").length;
  const resolvedIncidents = incidents.filter((s: any) => s.status === "resolved" || s.status === "closed").length;
  const criticalCount = incidents.filter((s: any) => s.severity === "critical").length;

  const cfg = workflowConfigs["safety-incidents"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/safety-incidents" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">HSE</div>
          <h1 className="display text-3xl font-bold">Safety Incidents</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total incidents</CardTitle><ShieldAlert className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalIncidents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open</CardTitle><AlertTriangle className="h-4 w-4 text-yellow-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{openIncidents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{resolvedIncidents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Critical</CardTitle><AlertCircle className="h-4 w-4 text-red-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{criticalCount}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={incidents}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "description", "incident_type", "location"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="incident_type"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Report Incident"
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
                <AlertDialogHeader><AlertDialogTitle>Delete safety incident?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this incident record. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteIncident.mutate(item.id)} disabled={deleteIncident.isPending}>
                    {deleteIncident.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit safety incident" : "Report a safety incident"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Section: Incident Details */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Incident Details</legend>
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
                  <Label>Incident date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })} />
                </div>
                <div>
                  <Label>Incident type <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={form.incident_type}
                    onValueChange={(v) => setForm({ ...form, incident_type: v })}
                    placeholder="Select incident type"
                    options={incidentTypeOptions.map((t) => ({ value: t, label: t.replace("_", " ") }))}
                  />
                </div>
                <div>
                  <Label>Location <span className="text-destructive">*</span></Label>
                  <LocationSelector value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
                </div>
                <div>
                  <Label>Description <span className="text-destructive">*</span></Label>
                  <Textarea rows={3} placeholder="Describe what happened, including date, time, and circumstances..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            </fieldset>

            {/* Section: Classification */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Classification</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Severity <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={form.severity}
                    onValueChange={(v) => setForm({ ...form, severity: v })}
                    placeholder="Select severity"
                    options={severityOptions.map((s) => ({ value: s, label: s }))}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
              </div>
            </fieldset>

            {/* Section: Investigation */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Investigation</legend>
              <div className="space-y-3">
                <div>
                  <Label>Reported by</Label>
                  <Input placeholder="Full name of the person reporting" value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: e.target.value })} />
                </div>
                <div>
                  <Label>Root cause</Label>
                  <Textarea rows={2} placeholder="Identify the underlying cause of the incident..." value={form.root_cause} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} />
                </div>
                <div>
                  <Label>Corrective action</Label>
                  <Textarea rows={2} placeholder="Actions taken or planned to prevent recurrence..." value={form.corrective_action} onChange={(e) => setForm({ ...form, corrective_action: e.target.value })} />
                </div>
              </div>
            </fieldset>

            {/* Section: Notes */}
            <fieldset className="rounded-lg border p-4">
              <legend className="text-sm font-semibold text-muted-foreground">Additional Notes</legend>
              <div>
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Any additional remarks, follow-up items, or comments..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </fieldset>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.incident_date || !form.description || !form.project_id || !form.location || !form.incident_type || !form.severity || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
