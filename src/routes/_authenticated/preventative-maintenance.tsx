// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Plus, CalendarCheck, CheckCircle, ToggleLeft, ToggleRight, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/preventative-maintenance")({
  head: () => ({ meta: [{ title: "Preventative Maintenance — Habico Portal" }] }),
  component: PreventativeMaintenancePage,
});

const categoryLabels: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  appliance: "Appliance",
  structural: "Structural",
  pest_control: "Pest Control",
  cleaning: "Cleaning",
  landscaping: "Landscaping",
  general: "General",
};

const categoryColors: Record<string, string> = {
  plumbing: "bg-blue-100 text-blue-800",
  electrical: "bg-yellow-100 text-yellow-800",
  hvac: "bg-cyan-100 text-cyan-800",
  appliance: "bg-indigo-100 text-indigo-800",
  structural: "bg-orange-100 text-orange-800",
  pest_control: "bg-pink-100 text-pink-800",
  cleaning: "bg-teal-100 text-teal-800",
  landscaping: "bg-green-100 text-green-800",
  general: "bg-gray-100 text-gray-800",
};

const frequencyLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  bi_annual: "Bi-Annual",
  annual: "Annual",
  one_time: "One Time",
};

const frequencyIntervalDays: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  bi_annual: 180,
  annual: 365,
  one_time: 0,
};

function PreventativeMaintenancePage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager" || role === "staff";
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const [editUnitId, setEditUnitId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [editFrequency, setEditFrequency] = useState("monthly");
  const [editNextDueDate, setEditNextDueDate] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editEstimatedCost, setEditEstimatedCost] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data } = await supabase
        .from("units")
        .select("id, name, property_id, properties(name)");
      return (data as any) || [];
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["maintenance_schedules"],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_schedules")
        .select("*, units!inner(id, name, property_id, properties!inner(id, name))")
        .order("next_due_date", { ascending: true, nullsFirst: false });
      return (data as any) || [];
    },
  });

  const activeCount = schedules?.filter((s: any) => s.is_active).length || 0;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const overdueCount = schedules?.filter((s: any) => s.is_active && s.next_due_date && s.next_due_date < todayStr).length || 0;
  const completedThisMonth = schedules?.filter((s: any) => {
    if (!s.last_completed_date) return false;
    const d = new Date(s.last_completed_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length || 0;

  function resetCreateForm() {
    setUnitId("");
    setTitle("");
    setDescription("");
    setCategory("general");
    setFrequency("monthly");
    setNextDueDate("");
    setAssignedTo("");
    setEstimatedCost("");
    setNotes("");
  }

  function getIntervalDays(freq: string): number {
    return frequencyIntervalDays[freq] || 0;
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const intervalDays = getIntervalDays(frequency);
      const payload: any = {
        unit_id: unitId,
        title,
        description,
        category,
        frequency,
        interval_days: intervalDays,
        assigned_to: assignedTo || null,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        notes: notes || null,
        is_active: true,
      };
      if (frequency !== "one_time") {
        payload.next_due_date = nextDueDate || null;
      }
      const { error } = await supabase.from("maintenance_schedules").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_schedules"] });
      setCreateOpen(false);
      resetCreateForm();
      toast.success("Schedule created");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to create schedule");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingSchedule) return;
      const intervalDays = getIntervalDays(editFrequency);
      const payload: any = {
        unit_id: editUnitId,
        title: editTitle,
        description: editDescription,
        category: editCategory,
        frequency: editFrequency,
        interval_days: intervalDays,
        assigned_to: editAssignedTo || null,
        estimated_cost: editEstimatedCost ? parseFloat(editEstimatedCost) : null,
        notes: editNotes || null,
        is_active: editIsActive,
      };
      if (editFrequency !== "one_time") {
        payload.next_due_date = editNextDueDate || null;
      } else {
        payload.next_due_date = null;
      }
      const { error } = await supabase
        .from("maintenance_schedules")
        .update(payload)
        .eq("id", editingSchedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_schedules"] });
      setEditOpen(false);
      setEditingSchedule(null);
      toast.success("Schedule updated");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to update schedule");
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (schedule: any) => {
      const today = new Date().toISOString().split("T")[0];
      const intervalDays = schedule.interval_days || getIntervalDays(schedule.frequency);
      let nextDue: string | null = null;
      if (schedule.frequency !== "one_time" && intervalDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + intervalDays);
        nextDue = d.toISOString().split("T")[0];
      }
      const { error } = await supabase
        .from("maintenance_schedules")
        .update({
          last_completed_date: today,
          next_due_date: nextDue,
        })
        .eq("id", schedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_schedules"] });
      toast.success("Marked as complete");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to mark complete");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("maintenance_schedules")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_schedules"] });
      toast.success("Status updated");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to update status");
    },
  });

  function openEdit(schedule: any) {
    setEditingSchedule(schedule);
    setEditUnitId(schedule.unit_id);
    setEditTitle(schedule.title);
    setEditDescription(schedule.description || "");
    setEditCategory(schedule.category || "general");
    setEditFrequency(schedule.frequency || "monthly");
    setEditNextDueDate(schedule.next_due_date?.split("T")[0] || "");
    setEditAssignedTo(schedule.assigned_to || "");
    setEditEstimatedCost(schedule.estimated_cost?.toString() || "");
    setEditNotes(schedule.notes || "");
    setEditIsActive(schedule.is_active !== false);
    setEditOpen(true);
  }

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return dueDate < todayStr;
  }

  if (!isStaff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageTour route="/preventative-maintenance" role={role} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Preventative Maintenance</h1>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Maintenance Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <SearchableSelect
                  value={unitId}
                  onValueChange={setUnitId}
                  placeholder="Select unit"
                  options={(units ?? []).map((u: any) => ({ value: u.id, label: `${u.name} - ${u.properties?.name}` }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HVAC filter replacement" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <SearchableSelect
                    value={category}
                    onValueChange={setCategory}
                    placeholder="Select category"
                    options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <SearchableSelect
                    value={frequency}
                    onValueChange={(v) => { setFrequency(v); if (v === "one_time") setNextDueDate(""); }}
                    placeholder="Select frequency"
                    options={Object.entries(frequencyLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
              </div>
              {frequency !== "one_time" && (
                <div className="space-y-2">
                  <Label>Next Due Date</Label>
                  <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name or role" />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Cost (UGX)</Label>
                  <Input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!unitId || !title || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{completedThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={schedules}
        isLoading={isLoading}
        searchFields={["title", "unit", "property", "assigned_to"]}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="unit"
        statusField="status"
        metricFields={[
          { key: "frequency", label: "Frequency" },
          { key: "next_due_date", label: "Next Due", format: "date" },
          { key: "estimated_cost", label: "Est. Cost", format: "currency" },
        ]}
        emptyMessage="No schedules found"
        cardActions={(s) => (
          <>
            {s.is_active && s.next_due_date && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => markCompleteMutation.mutate(s)}
                disabled={markCompleteMutation.isPending}
                title="Mark Complete"
              >
                <CheckCircle className="h-3 w-3 text-green-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => openEdit(s)}
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.is_active })}
              title={s.is_active ? "Deactivate" : "Activate"}
            >
              {s.is_active ? (
                <ToggleRight className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ToggleLeft className="h-3 w-3 text-green-600" />
              )}
            </Button>
          </>
        )}
      />

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingSchedule(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          {editingSchedule && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <SearchableSelect
                  value={editUnitId}
                  onValueChange={setEditUnitId}
                  placeholder="Select unit"
                  options={(units ?? []).map((u: any) => ({ value: u.id, label: `${u.name} - ${u.properties?.name}` }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <SearchableSelect
                    value={editCategory}
                    onValueChange={setEditCategory}
                    placeholder="Select category"
                    options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <SearchableSelect
                    value={editFrequency}
                    onValueChange={(v) => { setEditFrequency(v); if (v === "one_time") setEditNextDueDate(""); }}
                    placeholder="Select frequency"
                    options={Object.entries(frequencyLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
              </div>
              {editFrequency !== "one_time" && (
                <div className="space-y-2">
                  <Label>Next Due Date</Label>
                  <Input type="date" value={editNextDueDate} onChange={(e) => setEditNextDueDate(e.target.value)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Cost (UGX)</Label>
                  <Input type="number" value={editEstimatedCost} onChange={(e) => setEditEstimatedCost(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Label>Active</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditIsActive(!editIsActive)}
                >
                  {editIsActive ? (
                    <><ToggleRight className="h-4 w-4 mr-1 text-green-600" /> Active</>
                  ) : (
                    <><ToggleLeft className="h-4 w-4 mr-1 text-muted-foreground" /> Inactive</>
                  )}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingSchedule(null); }}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
