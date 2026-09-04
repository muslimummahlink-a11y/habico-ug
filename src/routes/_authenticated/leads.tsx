// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useRecordActions } from "@/hooks/use-record-actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, Users, TrendingUp, TrendingDown, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — Habico Portal" }] }),
  component: LeadsPage,
});

const statusOptions = ["new", "contacted", "qualified", "proposal", "won", "lost"];
const sourceOptions = ["direct", "website", "referral", "phone", "email", "social_media", "other"];

function LeadsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const { deleteMutation, editMutation, copyMutation } = useRecordActions({ table: "leads" });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    source: "direct", contact_name: "", contact_phone: "", contact_email: "",
    company: "", description: "", status: "new", budget_range_min: "", budget_range_max: "",
    notes: "", assigned_to: "",
  });

  const resetForm = () => setForm({
    source: "direct", contact_name: "", contact_phone: "", contact_email: "",
    company: "", description: "", status: "new", budget_range_min: "", budget_range_max: "",
    notes: "", assigned_to: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      source: p.source ?? "direct", contact_name: p.contact_name ?? "", contact_phone: p.contact_phone ?? "",
      contact_email: p.contact_email ?? "", company: p.company ?? "", description: p.description ?? "",
      status: p.status ?? "new", budget_range_min: p.budget_range_min != null ? String(p.budget_range_min) : "",
      budget_range_max: p.budget_range_max != null ? String(p.budget_range_max) : "",
      notes: p.notes ?? "", assigned_to: p.assigned_to ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert({
        source: form.source, contact_name: form.contact_name || null, contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null, company: form.company || null, description: form.description || null,
        status: form.status, budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
        budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
        notes: form.notes || null, assigned_to: form.assigned_to || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").update({
        source: form.source, contact_name: form.contact_name || null, contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null, company: form.company || null, description: form.description || null,
        status: form.status, budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
        budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
        notes: form.notes || null, assigned_to: form.assigned_to || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["leads"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  // Delete already handled by useRecordActions hook

  const totalLeads = leads.length;
  const wonLeads = leads.filter((p: any) => p.status === "won").length;
  const lostLeads = leads.filter((p: any) => p.status === "lost").length;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const cfg = workflowConfigs.leads;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/leads" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Preconstruction</div>
          <h1 className="display text-3xl font-bold">Leads</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Leads</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalLeads}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Won</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{wonLeads}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lost</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{lostLeads}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Conversion Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{conversionRate}%</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={leads}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["contact_name", "contact_email", "company", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="contact_name"
        subtitleField="company"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Lead"
        workflowButtons={(item) => {
          const actions = cfg.actions.filter((a) => !a.precondition || a.precondition(item));
          return actions.map((a) => ({
            label: a.label,
            icon: a.icon,
            to: a.paramKey ? `${a.to}?${a.paramKey}=${item.id}` : a.to,
            variant: "outline" as const,
          }));
        }}
        cardActions={(item) => isStaff ? (
          <>
            <RecordActions
              item={item}
              table="leads"
              onDeleteConfirm={() => deleteMutation.mutate(item.id)}
              onEdit={() => openEdit(item)}
              onCopy={() => copyMutation.mutate(item.id)}
            />
            {/* Legacy delete preserved in AlertDialog for backward compatibility */}
            <AlertDialog open={false} onOpenChange={(v) => {}}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit lead" : "Create a lead"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Contact Information</h3></div>
              <div className="space-y-3">
                <div><Label>Contact name <span className="text-destructive">*</span></Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Full name of the contact person" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+256 XXX XXX XXX" /></div>
                  <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="email@example.com" /></div>
                </div>
                <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company or organization name" /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the lead and their needs" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Lead Details</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source <span className="text-destructive">*</span></Label>
                  <SearchableSelect value={form.source} onValueChange={(v) => setForm({ ...form, source: v })} placeholder="Select source" options={sourceOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
                </div>
                <div><Label>Status <span className="text-destructive">*</span></Label>
                  <SearchableSelect value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} placeholder="Select status" options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Budget min (UGX)</Label><Input type="number" value={form.budget_range_min} onChange={(e) => setForm({ ...form, budget_range_min: e.target.value })} placeholder="Minimum expected budget" /></div>
                <div><Label>Budget max (UGX)</Label><Input type="number" value={form.budget_range_max} onChange={(e) => setForm({ ...form, budget_range_max: e.target.value })} placeholder="Maximum expected budget" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Assignment & Notes</h3></div>
              <div><Label>Assigned to</Label><Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="Team member responsible" /></div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.contact_name || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}