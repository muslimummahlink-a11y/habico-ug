// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { downloadMeetingMinutesPdf } from "@/lib/generate-meeting-minutes-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ClipboardList, CheckCircle2, Circle, Loader2, Trash2, Pencil, FileDown, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { LocationSelector } from "@/components/location-selector";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/meeting-minutes")({
  head: () => ({ meta: [{ title: "Meeting Minutes — Habico Portal" }] }),
  component: MeetingMinutesPage,
});

const meetingTypes = ["regular", "special", "annual", "emergency"];
const actionStatuses = ["open", "in_progress", "completed"];
const matterStatuses = ["carried_forward", "resolved", "closed", "deferred"];

const emptyDiscussion = { topic: "", discussion: "", decisions: "", follow_ups: "" };
const emptyMatter = { description: "", reference_meeting: "", status: "carried_forward" };
const emptyResolution = { text: "", proposed_by: "", seconded_by: "" };
const emptyAOB = { topic: "", discussion: "" };
const emptyActionItem = { action: "", assignee: "", due_date: "", status: "open" };

function MeetingMinutesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState("details");
  const [form, setForm] = useState({
    project_id: "", title: "", meeting_type: "regular", meeting_date: "", start_time: "", end_time: "",
    location: "", attendees: "", secretary_name: "", chairperson_name: "", confirmed_by: "",
    agenda: "", notes: "",
    discussions: [{ ...emptyDiscussion }],
    matters_arising: [{ ...emptyMatter }],
    resolutions: [{ ...emptyResolution }],
    aob: [{ ...emptyAOB }],
    action_items: [{ ...emptyActionItem }],
    next_meeting_date: "", next_meeting_time: "", next_meeting_location: "", next_meeting_agenda: "",
    distribution_list: "",
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meeting-minutes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meeting_minutes").select("*, projects!inner(name)").order("meeting_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setForm({
      project_id: "", title: "", meeting_type: "regular", meeting_date: "", start_time: "", end_time: "",
      location: "", attendees: "", secretary_name: "", chairperson_name: "", confirmed_by: "",
      agenda: "", notes: "",
      discussions: [{ ...emptyDiscussion }],
      matters_arising: [{ ...emptyMatter }],
      resolutions: [{ ...emptyResolution }],
      aob: [{ ...emptyAOB }],
      action_items: [{ ...emptyActionItem }],
      next_meeting_date: "", next_meeting_time: "", next_meeting_location: "", next_meeting_agenda: "",
      distribution_list: "",
    });
    setFormTab("details");
  };

  const openEdit = (m: any) => {
    setEditing(m);
    const nm = m.next_meeting && typeof m.next_meeting === "object" ? m.next_meeting : {};
    setForm({
      project_id: m.project_id ?? "", title: m.title ?? "", meeting_type: m.meeting_type ?? "regular",
      meeting_date: m.meeting_date ?? "", start_time: m.start_time ?? "", end_time: m.end_time ?? "",
      location: m.location ?? "", attendees: m.attendees ?? "",
      secretary_name: m.secretary_name ?? "", chairperson_name: m.chairperson_name ?? "",
      confirmed_by: m.confirmed_by ?? "", agenda: m.agenda ?? "", notes: m.notes ?? "",
      discussions: Array.isArray(m.discussions) && m.discussions.length > 0
        ? m.discussions.map((d: any) => ({ topic: d.topic ?? "", discussion: d.discussion ?? "", decisions: d.decisions ?? "", follow_ups: d.follow_ups ?? "" }))
        : [{ ...emptyDiscussion }],
      matters_arising: Array.isArray(m.matters_arising) && m.matters_arising.length > 0
        ? m.matters_arising.map((ma: any) => ({ description: ma.description ?? "", reference_meeting: ma.reference_meeting ?? "", status: ma.status ?? "carried_forward" }))
        : [{ ...emptyMatter }],
      resolutions: Array.isArray(m.resolutions) && m.resolutions.length > 0
        ? m.resolutions.map((r: any) => ({ text: r.text ?? "", proposed_by: r.proposed_by ?? "", seconded_by: r.seconded_by ?? "" }))
        : [{ ...emptyResolution }],
      aob: Array.isArray(m.aob) && m.aob.length > 0
        ? m.aob.map((a: any) => ({ topic: a.topic ?? "", discussion: a.discussion ?? "" }))
        : [{ ...emptyAOB }],
      action_items: Array.isArray(m.action_items) && m.action_items.length > 0
        ? m.action_items.map((ai: any) => ({ action: ai.action ?? "", assignee: ai.assignee ?? "", due_date: ai.due_date ?? "", status: ai.status ?? "open" }))
        : [{ ...emptyActionItem }],
      next_meeting_date: nm.date ?? "", next_meeting_time: nm.time ?? "",
      next_meeting_location: nm.location ?? "", next_meeting_agenda: nm.proposed_agenda ?? "",
      distribution_list: m.distribution_list ?? "",
    });
    setOpen(true);
  };

  // Generic array helpers
  const updateArray = (field: string, idx: number, key: string, value: string) => {
    const arr = [...(form as any)[field]];
    arr[idx] = { ...arr[idx], [key]: value };
    setForm({ ...form, [field]: arr });
  };
  const addToArray = (field: string, empty: any) => setForm({ ...form, [field]: [...(form as any)[field], { ...empty }] });
  const removeFromArray = (field: string, idx: number) => setForm({ ...form, [field]: (form as any)[field].filter((_: any, i: number) => i !== idx) });

  const buildPayload = () => ({
    project_id: form.project_id, title: form.title, meeting_type: form.meeting_type,
    meeting_date: form.meeting_date, start_time: form.start_time || null, end_time: form.end_time || null,
    location: form.location || null, attendees: form.attendees || null,
    secretary_name: form.secretary_name || null, chairperson_name: form.chairperson_name || null,
    confirmed_by: form.confirmed_by || null, agenda: form.agenda || null, notes: form.notes || null,
    discussions: form.discussions.filter((d: any) => d.topic),
    matters_arising: form.matters_arising.filter((m: any) => m.description),
    resolutions: form.resolutions.filter((r: any) => r.text),
    aob: form.aob.filter((a: any) => a.topic),
    action_items: form.action_items.filter((ai: any) => ai.action),
    next_meeting: (form.next_meeting_date || form.next_meeting_time) ? {
      date: form.next_meeting_date || null, time: form.next_meeting_time || null,
      location: form.next_meeting_location || null, proposed_agenda: form.next_meeting_agenda || null,
    } : null,
    distribution_list: form.distribution_list || null,
  });

  const create = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("meeting_minutes").insert(buildPayload()); if (error) throw error; },
    onSuccess: () => { toast.success("Meeting minutes created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["meeting-minutes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("meeting_minutes").update(buildPayload()).eq("id", editing.id); if (error) throw error; },
    onSuccess: () => { toast.success("Meeting minutes updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["meeting-minutes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("meeting_minutes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["meeting-minutes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleDownloadPdf = (m: any) => {
    const nm = m.next_meeting && typeof m.next_meeting === "object" ? m.next_meeting : null;
    downloadMeetingMinutesPdf({
      title: m.title, meeting_type: m.meeting_type || "regular", meeting_date: m.meeting_date,
      start_time: m.start_time, end_time: m.end_time, location: m.location,
      project_name: m.projects?.name ?? "", secretary_name: m.secretary_name,
      chairperson_name: m.chairperson_name, attendees: m.attendees || "",
      confirmed_by: m.confirmed_by, agenda: m.agenda,
      discussions: m.discussions || [], matters_arising: m.matters_arising || [],
      resolutions: m.resolutions || [], aob: m.aob || [],
      action_items: m.action_items || [], next_meeting: nm,
      distribution_list: m.distribution_list,
    });
  };

  const totalMeetings = meetings.length;
  const allActions = meetings.flatMap((m: any) => m.action_items ?? []);
  const openActions = allActions.filter((a: any) => a.status !== "completed").length;
  const completedActions = allActions.filter((a: any) => a.status === "completed").length;

  const cfg = workflowConfigs["meeting-minutes"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/meeting-minutes" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Meeting Minutes</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total meetings</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalMeetings}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open action items</CardTitle><Circle className="h-4 w-4 text-yellow-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{openActions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed actions</CardTitle><CheckCircle2 className="h-4 w-4 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{completedActions}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={meetings}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "attendees", "agenda", "notes", "secretary_name", "chairperson_name"]}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="meeting_date"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Record Minutes"
        workflowButtons={() => []}
        cardActions={(item) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDownloadPdf(item)}>
              <FileDown className="mr-1 h-3 w-3" /> PDF
            </Button>
            {isStaff && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <AlertDialog open={deleteId === item.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="mr-1 h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete?</AlertDialogTitle><AlertDialogDescription>Permanently delete "{item.title}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMeeting.mutate(item.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </>
        )}
      />

      {/* Enhanced Recording Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {editing ? "Edit Meeting Minutes" : "Record Meeting Minutes"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={formTab} onValueChange={setFormTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="matters">Matters & Resolutions</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="wrap">Wrap Up</TabsTrigger>
            </TabsList>

            {/* TAB 1: Meeting Details */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Meeting Information</legend>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Project <span className="text-destructive">*</span></Label>
                      <SearchableSelect value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })} placeholder="Select project..." options={projects.map((p: any) => ({ value: p.id, label: p.name }))} />
                    </div>
                    <div>
                      <Label>Meeting Type</Label>
                      <SearchableSelect value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })} placeholder="Type" options={meetingTypes.map((t) => ({ value: t, label: t.replace("_", " ") }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Title <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g. Weekly Progress Meeting — Week 12" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Meeting Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                    <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
                  </div>
                  <div><Label>Location</Label><LocationSelector value={form.location} onChange={(v) => setForm({ ...form, location: v })} /></div>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Officers & Attendees</legend>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Secretary</Label><Input placeholder="Name of the secretary" value={form.secretary_name} onChange={(e) => setForm({ ...form, secretary_name: e.target.value })} /></div>
                    <div><Label>Chairperson</Label><Input placeholder="Name of the chairperson" value={form.chairperson_name} onChange={(e) => setForm({ ...form, chairperson_name: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label>Attendees</Label>
                    <Textarea rows={4} placeholder="One name per line, include title/role:&#10;Eng. James Okello — Project Manager&#10;Sarah Nambi — Quantity Surveyor&#10;David Mugisha — Site Supervisor" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
                  </div>
                  <div><Label>Confirmed By (Previous Minutes)</Label><Input placeholder="Name of person who confirmed previous minutes" value={form.confirmed_by} onChange={(e) => setForm({ ...form, confirmed_by: e.target.value })} /></div>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Agenda</legend>
                <Textarea rows={5} placeholder="1. Confirmation of previous minutes&#10;2. Matters arising&#10;3. Progress report&#10;4. Financial update&#10;5. Any other business&#10;6. Next meeting" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
              </fieldset>
            </TabsContent>

            {/* TAB 2: Discussion Sections */}
            <TabsContent value="discussion" className="space-y-4 mt-4">
              <p className="text-xs text-muted-foreground">Record detailed discussion for each agenda item discussed in the meeting.</p>
              {form.discussions.map((disc: any, idx: number) => (
                <fieldset key={idx} className="rounded-lg border p-4">
                  <legend className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
                    <span>Agenda Item {idx + 1}</span>
                    {form.discussions.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removeFromArray("discussions", idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </legend>
                  <div className="space-y-3 mt-2">
                    <div><Label>Topic / Agenda Item</Label><Input placeholder="e.g. Progress Report on Block A" value={disc.topic} onChange={(e) => updateArray("discussions", idx, "topic", e.target.value)} /></div>
                    <div><Label>Discussion</Label><Textarea rows={4} placeholder="Record the full discussion: who said what, key points raised, debate..." value={disc.discussion} onChange={(e) => updateArray("discussions", idx, "discussion", e.target.value)} /></div>
                    <div><Label>Decisions Made</Label><Textarea rows={2} placeholder="Any decisions reached on this item" value={disc.decisions} onChange={(e) => updateArray("discussions", idx, "decisions", e.target.value)} /></div>
                    <div><Label>Follow-up Required</Label><Input placeholder="What needs to happen next" value={disc.follow_ups} onChange={(e) => updateArray("discussions", idx, "follow_ups", e.target.value)} /></div>
                  </div>
                </fieldset>
              ))}
              <Button variant="outline" size="sm" onClick={() => addToArray("discussions", emptyDiscussion)} className="w-full">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Discussion Item
              </Button>
            </TabsContent>

            {/* TAB 3: Matters Arising & Resolutions */}
            <TabsContent value="matters" className="space-y-4 mt-4">
              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Matters Arising from Previous Minutes</legend>
                <div className="space-y-3">
                  {form.matters_arising.map((ma: any, idx: number) => (
                    <div key={idx} className="rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Matter {idx + 1}</span>
                        {form.matters_arising.length > 1 && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removeFromArray("matters_arising", idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div><Label className="text-xs">Description</Label><Input placeholder="Matter to be discussed" value={ma.description} onChange={(e) => updateArray("matters_arising", idx, "description", e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Reference Meeting</Label><Input placeholder="e.g. Minutes of 14 Jul 2026" value={ma.reference_meeting} onChange={(e) => updateArray("matters_arising", idx, "reference_meeting", e.target.value)} /></div>
                          <div><Label className="text-xs">Status</Label>
                            <SearchableSelect value={ma.status} onValueChange={(v) => updateArray("matters_arising", idx, "status", v)} placeholder="Status" options={matterStatuses.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addToArray("matters_arising", emptyMatter)} className="w-full">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Matter Arising
                  </Button>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Resolutions / Formal Decisions</legend>
                <div className="space-y-3">
                  {form.resolutions.map((res: any, idx: number) => (
                    <div key={idx} className="rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Resolution {idx + 1}</span>
                        {form.resolutions.length > 1 && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removeFromArray("resolutions", idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div><Label className="text-xs">Resolution Text</Label><Textarea rows={2} placeholder="RESOLVED THAT..." value={res.text} onChange={(e) => updateArray("resolutions", idx, "text", e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Proposed By</Label><Input placeholder="Name" value={res.proposed_by} onChange={(e) => updateArray("resolutions", idx, "proposed_by", e.target.value)} /></div>
                          <div><Label className="text-xs">Seconded By</Label><Input placeholder="Name" value={res.seconded_by} onChange={(e) => updateArray("resolutions", idx, "seconded_by", e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addToArray("resolutions", emptyResolution)} className="w-full">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Resolution
                  </Button>
                </div>
              </fieldset>
            </TabsContent>

            {/* TAB 4: Action Items & AOB */}
            <TabsContent value="actions" className="space-y-4 mt-4">
              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Action Items</legend>
                <div className="space-y-3">
                  {form.action_items.map((item: any, idx: number) => (
                    <div key={idx} className="rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Action {idx + 1}</span>
                        {form.action_items.length > 1 && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removeFromArray("action_items", idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div><Label className="text-xs">Action</Label><Input placeholder="Describe the action required" value={item.action} onChange={(e) => updateArray("action_items", idx, "action", e.target.value)} /></div>
                        <div className="grid grid-cols-3 gap-2">
                          <div><Label className="text-xs">Assignee</Label><Input placeholder="Responsible person" value={item.assignee} onChange={(e) => updateArray("action_items", idx, "assignee", e.target.value)} /></div>
                          <div><Label className="text-xs">Due Date</Label><Input type="date" value={item.due_date} onChange={(e) => updateArray("action_items", idx, "due_date", e.target.value)} /></div>
                          <div><Label className="text-xs">Status</Label>
                            <SearchableSelect value={item.status} onValueChange={(v) => updateArray("action_items", idx, "status", v)} placeholder="Status" options={actionStatuses.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addToArray("action_items", emptyActionItem)} className="w-full">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Action Item
                  </Button>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Any Other Business</legend>
                <div className="space-y-3">
                  {form.aob.map((item: any, idx: number) => (
                    <div key={idx} className="rounded-md border bg-muted/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">AOB {idx + 1}</span>
                        {form.aob.length > 1 && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-destructive" onClick={() => removeFromArray("aob", idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div><Label className="text-xs">Topic</Label><Input placeholder="AOB topic" value={item.topic} onChange={(e) => updateArray("aob", idx, "topic", e.target.value)} /></div>
                        <div><Label className="text-xs">Discussion</Label><Textarea rows={2} placeholder="What was discussed" value={item.discussion} onChange={(e) => updateArray("aob", idx, "discussion", e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addToArray("aob", emptyAOB)} className="w-full">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add AOB Item
                  </Button>
                </div>
              </fieldset>
            </TabsContent>

            {/* TAB 5: Wrap Up */}
            <TabsContent value="wrap" className="space-y-4 mt-4">
              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Next Meeting</legend>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Date</Label><Input type="date" value={form.next_meeting_date} onChange={(e) => setForm({ ...form, next_meeting_date: e.target.value })} /></div>
                    <div><Label>Time</Label><Input type="time" value={form.next_meeting_time} onChange={(e) => setForm({ ...form, next_meeting_time: e.target.value })} /></div>
                  </div>
                  <div><Label>Location</Label><Input placeholder="Meeting venue" value={form.next_meeting_location} onChange={(e) => setForm({ ...form, next_meeting_location: e.target.value })} /></div>
                  <div><Label>Proposed Agenda</Label><Textarea rows={3} placeholder="Preliminary agenda for next meeting" value={form.next_meeting_agenda} onChange={(e) => setForm({ ...form, next_meeting_agenda: e.target.value })} /></div>
                </div>
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Distribution List</legend>
                <Textarea rows={3} placeholder="List who should receive a copy of these minutes:&#10;Project Director&#10;Site Manager&#10;Finance Manager&#10;All attendees" value={form.distribution_list} onChange={(e) => setForm({ ...form, distribution_list: e.target.value })} />
              </fieldset>

              <fieldset className="rounded-lg border p-4">
                <legend className="text-sm font-semibold text-muted-foreground">Additional Notes</legend>
                <Textarea rows={3} placeholder="Any additional notes or remarks..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </fieldset>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.title || !form.meeting_date || !form.project_id || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Record Minutes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
