// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { sendAppointmentReminder } from "@/lib/sendAppointmentReminder.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, Clock3, FileText, Mail, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/preventative-maintenance")({
  head: () => ({ meta: [{ title: "Appointments & Schedules — Habico Portal" }] }),
  component: AppointmentsPage,
});

const emptyForm = {
  title: "", appointment_type: "meeting", starts_at: "", ends_at: "", location: "", agenda: "",
  organizer_email: "", party_one_name: "", party_one_email: "", party_two_name: "", party_two_email: "",
  is_recurring: false, recurrence: "weekly",
};

function AppointmentsPage() {
  const { user } = useAuth();
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager" || role === "staff";
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [meeting, setMeeting] = useState<any>(null);
  const [meetingNotes, setMeetingNotes] = useState({ notes: "", minutes: "", action_items: "" });
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [open, setOpen] = useState(false);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isStaff,
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ["appointment-attachments", meeting?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointment_attachments").select("*").eq("appointment_id", meeting.id).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!meeting,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.starts_at) throw new Error("Title and start time are required");
      const { error } = await supabase.from("appointments").insert({
        ...form,
        organizer_id: user?.id,
        organizer_email: form.organizer_email || user?.email || null,
        ends_at: form.ends_at || null,
        location: form.location || null,
        agenda: form.agenda || null,
        recurrence: form.is_recurring ? form.recurrence : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Appointment scheduled"); setOpen(false); setForm({ ...emptyForm }); qc.invalidateQueries({ queryKey: ["appointments"] }); },
    onError: (e: any) => toast.error(e.message || "Could not create appointment"),
  });

  const saveMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!meeting) return;
      const { error } = await supabase.from("appointments").update({ ...meetingNotes, status: "completed" }).eq("id", meeting.id);
      if (error) throw error;
      if (attachmentUrl && attachmentName) {
        const { error: attachmentError } = await supabase.from("appointment_attachments").insert({ appointment_id: meeting.id, name: attachmentName, file_url: attachmentUrl, file_type: "uploaded" });
        if (attachmentError) throw attachmentError;
      }
    },
    onSuccess: () => { toast.success("Meeting record saved"); setAttachmentUrl(""); setAttachmentName(""); setMeeting(null); qc.invalidateQueries({ queryKey: ["appointments"] }); },
    onError: (e: any) => toast.error(e.message || "Could not save meeting record"),
  });

  const sendReminderMutation = useMutation({
    mutationFn: (id: string) => sendAppointmentReminder({ data: { appointmentId: id } }),
    onSuccess: (result) => result.success ? toast.success("Reminder sent to the recorded parties") : toast.error(result.error),
    onError: (e: any) => toast.error(e.message || "Could not send reminder"),
  });

  const upcoming = appointments.filter((a: any) => a.status === "scheduled");
  const recurring = appointments.filter((a: any) => a.is_recurring);
  const completed = appointments.filter((a: any) => a.status === "completed");

  function openMeeting(item: any) {
    setMeeting(item);
    setMeetingNotes({ notes: item.notes || "", minutes: item.minutes || "", action_items: item.action_items || "" });
  }

  if (!isStaff) return <div className="flex h-96 items-center justify-center text-muted-foreground">You do not have permission to view this page.</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageTour route="/preventative-maintenance" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-accent">Operations</p><h1 className="text-3xl font-bold">Appointments &amp; Schedules</h1><p className="mt-1 text-sm text-muted-foreground">Plan meetings, inspections, viewings, and follow-ups in one place.</p></div><Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> New appointment</Button></div>
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Upcoming</CardTitle><Clock3 className="h-4 w-4 text-accent" /></CardHeader><CardContent><p className="text-3xl font-bold">{upcoming.length}</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Recurring</CardTitle><CalendarDays className="h-4 w-4 text-accent" /></CardHeader><CardContent><p className="text-3xl font-bold">{recurring.length}</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Completed meetings</CardTitle><CheckCircle2 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><p className="text-3xl font-bold">{completed.length}</p></CardContent></Card></div>

      <Tabs defaultValue="appointments" className="space-y-4"><TabsList><TabsTrigger value="appointments">Appointments</TabsTrigger><TabsTrigger value="schedules">Schedules</TabsTrigger><TabsTrigger value="meetings">Meeting records</TabsTrigger></TabsList>
        <TabsContent value="appointments" className="space-y-3">{isLoading && <p className="text-sm text-muted-foreground">Loading appointments...</p>}{!isLoading && appointments.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground"><CalendarDays className="mx-auto mb-3 h-10 w-10 opacity-40" />No appointments yet. Create the first one.</CardContent></Card>}{appointments.map((item: any) => <Card key={item.id}><CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.title}</h3><Badge variant={item.status === "completed" ? "default" : item.status === "cancelled" ? "destructive" : "secondary"}>{item.status}</Badge>{item.is_recurring && <Badge variant="outline">{item.recurrence}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{new Date(item.starts_at).toLocaleString()} {item.location ? `· ${item.location}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">{item.party_one_name || item.party_one_email || "First party"} {item.party_two_name || item.party_two_email ? `and ${item.party_two_name || item.party_two_email}` : ""}</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => openMeeting(item)}><FileText className="mr-1 h-4 w-4" /> Record</Button><Button variant="ghost" size="sm" onClick={() => sendReminderMutation.mutate(item.id)} disabled={sendReminderMutation.isPending}><Mail className="mr-1 h-4 w-4" /> Remind</Button></div></CardContent></Card>)}</TabsContent>
        <TabsContent value="schedules" className="space-y-3"><Card><CardHeader><CardTitle className="text-base">Recurring schedules</CardTitle></CardHeader><CardContent className="space-y-3">{recurring.length === 0 ? <p className="text-sm text-muted-foreground">No recurring schedules have been created.</p> : recurring.map((item: any) => <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.recurrence} · next occurrence {new Date(item.starts_at).toLocaleDateString()}</p></div><Badge variant="outline">Active</Badge></div>)}</CardContent></Card></TabsContent>
        <TabsContent value="meetings" className="space-y-3"><Card><CardHeader><CardTitle className="text-base">Meeting records</CardTitle></CardHeader><CardContent className="space-y-3">{completed.length === 0 ? <p className="text-sm text-muted-foreground">Completed appointments with minutes will appear here.</p> : completed.map((item: any) => <button key={item.id} className="flex w-full items-center justify-between border-b pb-3 text-left last:border-0" onClick={() => openMeeting(item)}><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{new Date(item.starts_at).toLocaleDateString()} · {item.minutes ? "Minutes recorded" : "No minutes yet"}</p></div><FileText className="h-4 w-4 text-muted-foreground" /></button>)}</CardContent></Card></TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>New appointment or schedule</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Landlord review meeting" /></div><div className="space-y-2"><Label>Type</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}><option value="meeting">Meeting</option><option value="inspection">Inspection</option><option value="viewing">Property viewing</option><option value="handover">Handover</option><option value="follow_up">Follow-up</option></select></div><div className="space-y-2"><Label>Starts *</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div><div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div><div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Office, site, phone, or video link" /></div><div className="space-y-2 sm:col-span-2"><Label>Agenda</Label><Textarea value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} placeholder="Topics to cover" rows={3} /></div><div className="space-y-2"><Label>First party name</Label><Input value={form.party_one_name} onChange={(e) => setForm({ ...form, party_one_name: e.target.value })} /></div><div className="space-y-2"><Label>First party email</Label><Input type="email" value={form.party_one_email} onChange={(e) => setForm({ ...form, party_one_email: e.target.value })} /></div><div className="space-y-2"><Label>Second party name</Label><Input value={form.party_two_name} onChange={(e) => setForm({ ...form, party_two_name: e.target.value })} /></div><div className="space-y-2"><Label>Second party email</Label><Input type="email" value={form.party_two_email} onChange={(e) => setForm({ ...form, party_two_email: e.target.value })} /></div><div className="flex items-center gap-2 sm:col-span-2"><input id="recurring" type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} /><Label htmlFor="recurring">Make this a recurring schedule</Label>{form.is_recurring && <select className="h-9 rounded-md border bg-background px-2 text-sm" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select>}</div></div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create appointment"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={!!meeting} onOpenChange={(value) => !value && setMeeting(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Meeting record: {meeting?.title}</DialogTitle></DialogHeader><div className="space-y-4"><div className="rounded-md border bg-muted/30 p-3 text-sm"><p><strong>Agenda:</strong> {meeting?.agenda || "No agenda recorded"}</p><p className="mt-1 text-muted-foreground">{meeting && new Date(meeting.starts_at).toLocaleString()} · {meeting?.location || "No location"}</p></div><div className="space-y-2"><Label>Notes from the meeting</Label><Textarea rows={5} value={meetingNotes.notes} onChange={(e) => setMeetingNotes({ ...meetingNotes, notes: e.target.value })} /></div><div className="space-y-2"><Label>Minutes / decisions</Label><Textarea rows={5} value={meetingNotes.minutes} onChange={(e) => setMeetingNotes({ ...meetingNotes, minutes: e.target.value })} placeholder="Record what took place and decisions made" /></div><div className="space-y-2"><Label>Action items</Label><Textarea rows={4} value={meetingNotes.action_items} onChange={(e) => setMeetingNotes({ ...meetingNotes, action_items: e.target.value })} placeholder="Action, owner, due date" /></div><div className="space-y-2"><Label>Support files</Label>{attachments.map((file: any) => <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="block text-sm text-accent hover:underline">{file.name}</a>)}<Input value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="File name" /><FileUpload value={attachmentUrl} onChange={setAttachmentUrl} label="Upload meeting file" maxSizeMB={10} /></div></div><DialogFooter><Button variant="outline" onClick={() => setMeeting(null)}>Close</Button><Button onClick={() => saveMeetingMutation.mutate()} disabled={saveMeetingMutation.isPending}><Save className="mr-2 h-4 w-4" /> Save meeting record</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}