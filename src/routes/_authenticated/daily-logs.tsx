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
import { Plus, FileText, Users, Building2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/daily-logs")({
  head: () => ({ meta: [{ title: "Daily Logs — Habico Portal" }] }),
  component: DailyLogsPage,
});

function DailyLogsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", log_date: new Date().toISOString().split("T")[0],
    weather: "", temperature: "", workers_on_site: "", hours_worked: "",
    notes: "", delays: "", safety_incidents: "",
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["daily-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("daily_logs").select("*").order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", log_date: new Date().toISOString().split("T")[0],
    weather: "", temperature: "", workers_on_site: "", hours_worked: "",
    notes: "", delays: "", safety_incidents: "",
  });

  const openEdit = (l: any) => {
    setEditing(l);
    setForm({
      project_id: l.project_id ?? "", log_date: l.log_date ?? new Date().toISOString().split("T")[0],
      weather: l.weather ?? "", temperature: String(l.temperature ?? ""),
      workers_on_site: String(l.workers_on_site ?? ""), hours_worked: String(l.hours_worked ?? ""),
      notes: l.notes ?? "", delays: l.delays ?? "", safety_incidents: l.safety_incidents ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("daily_logs").insert({
        project_id: form.project_id || null, log_date: form.log_date,
        weather: form.weather || null, temperature: form.temperature ? Number(form.temperature) : null,
        workers_on_site: form.workers_on_site ? Number(form.workers_on_site) : null,
        hours_worked: form.hours_worked ? Number(form.hours_worked) : null,
        notes: form.notes || null, delays: form.delays || null, safety_incidents: form.safety_incidents || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Daily log created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["daily-logs"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("daily_logs").update({
        project_id: form.project_id || null, log_date: form.log_date,
        weather: form.weather || null, temperature: form.temperature ? Number(form.temperature) : null,
        workers_on_site: form.workers_on_site ? Number(form.workers_on_site) : null,
        hours_worked: form.hours_worked ? Number(form.hours_worked) : null,
        notes: form.notes || null, delays: form.delays || null, safety_incidents: form.safety_incidents || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Daily log updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["daily-logs"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Daily log deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["daily-logs"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalLogs = logs.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const workersToday = logs
    .filter((l: any) => l.log_date === todayStr)
    .reduce((sum: number, l: any) => sum + Number(l.workers_on_site || 0), 0);
  const projectsWithLogs = new Set(logs.map((l: any) => l.project_id)).size;

  const cfg = workflowConfigs["daily-logs"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/daily-logs" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Daily Logs</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Logs</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalLogs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Workers Today</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{workersToday}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Projects with Logs</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{projectsWithLogs}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={logs}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["weather", "notes", "delays", "safety_incidents"]}
        filterField="weather"
        filterOptions={[]}
        keyExtractor={(item) => item.id}
        titleField="date"
        subtitleField="weather"
        statusField="weather"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Log"
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
                <AlertDialogHeader><AlertDialogTitle>Delete daily log?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the log for {item.log_date}. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteLog.mutate(item.id)} disabled={deleteLog.isPending}>
                    {deleteLog.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit daily log" : "Create a daily log"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Date & Weather</h3></div>
              <div className="space-y-3">
                <div><Label>Log date *</Label><Input type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Weather condition</Label><Input value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} placeholder="e.g. Sunny, Rainy, Cloudy" /></div>
                  <div><Label>Temperature (°C)</Label><Input type="number" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="e.g. 28" /></div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Workforce</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Workers on site</Label><Input type="number" value={form.workers_on_site} onChange={(e) => setForm({ ...form, workers_on_site: e.target.value })} placeholder="Number of workers present" /></div>
                <div><Label>Hours worked</Label><Input type="number" value={form.hours_worked} onChange={(e) => setForm({ ...form, hours_worked: e.target.value })} placeholder="Total man-hours" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes & Incidents</h3></div>
              <div className="space-y-3">
                <div><Label>Daily notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Summary of the day's activities" /></div>
                <div><Label>Delays</Label><Textarea rows={2} value={form.delays} onChange={(e) => setForm({ ...form, delays: e.target.value })} placeholder="Any delays and their causes" /></div>
                <div><Label>Safety incidents</Label><Textarea rows={2} value={form.safety_incidents} onChange={(e) => setForm({ ...form, safety_incidents: e.target.value })} placeholder="Report any safety issues or incidents" /></div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.log_date || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
