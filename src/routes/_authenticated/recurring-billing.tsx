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
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Plus, Repeat, Send, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/recurring-billing")({
  component: RecurringBilling,
});

function RecurringBilling() {
  const role = useHighestRole();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ lease_id: "", due_day: 1, amount: 0, reminder_type: "auto" });

  const remindersQ = useQuery({
    queryKey: ["payment_reminders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_reminders")
        .select("*, lease:lease_id(id, monthly_rent, tenant:tenant_id(id, full_name), unit:unit_id(id, unit_number, property:property_id(id, name)))")
        .order("next_reminder_date", { ascending: true, nullsFirst: false }) as any;
      return (data ?? []) as any[];
    },
  });

  const reminders = remindersQ.data ?? [];

  const leasesQ = useQuery({
    queryKey: ["leases_for_reminder"],
    queryFn: async () => {
      const { data: existing } = await supabase.from("payment_reminders").select("lease_id") as any;
      const existingIds = (existing ?? []).map((r: any) => r.lease_id);
      const { data } = await supabase
        .from("leases")
        .select("id, monthly_rent, tenant:tenant_id(id, full_name), unit:unit_id(id, unit_number, property:property_id(id, name))")
        .eq("status", "active") as any;
      return ((data ?? []) as any[]).filter((l: any) => !existingIds.includes(l.id));
    },
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const paidThisMonthQ = useQuery({
    queryKey: ["paid_this_month", currentMonth, currentYear],
    queryFn: async () => {
      const start = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const { data } = await supabase
        .from("payments")
        .select("lease_id")
        .gte("payment_date", start)
        .lte("payment_date", `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`) as any;
      return new Set((data ?? []).map((p: any) => p.lease_id));
    },
  });

  const paidLeaseIds = paidThisMonthQ.data ?? new Set();

  const activeReminders = reminders.filter((r: any) => r.is_active);
  const monthlyTotal = activeReminders.reduce((s: number, r: any) => s + Number(r.amount), 0);

  const overdueCount = reminders.filter((r: any) => {
    if (!r.is_active) return false;
    const today = now.getDate();
    const dueDay = Number(r.due_day);
    if (dueDay >= today) return false;
    return !paidLeaseIds.has(r.lease_id);
  }).length;

  const createReminder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("payment_reminders").insert({
        lease_id: form.lease_id,
        due_day: form.due_day,
        amount: form.amount,
        reminder_type: form.reminder_type,
        is_active: true,
      }) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_reminders"] });
      qc.invalidateQueries({ queryKey: ["leases_for_reminder"] });
      setOpen(false);
      setForm({ lease_id: "", due_day: 1, amount: 0, reminder_type: "auto" });
      toast.success("Reminder created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleReminder = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("payment_reminders").update({ is_active }).eq("id", id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_reminders"] });
      toast.success("Reminder updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendNow = useMutation({
    mutationFn: async (id: string) => {
      const next = new Date();
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      const { error } = await supabase
        .from("payment_reminders")
        .update({ last_reminder_sent: new Date().toISOString(), next_reminder_date: next.toISOString().slice(0, 10) })
        .eq("id", id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_reminders"] });
      toast.success("Reminder sent");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!role || role === "owner" || role === "tenant") {
    return <div className="text-center text-muted-foreground py-12">Access restricted to staff.</div>;
  }

  return (
    <div className="space-y-6">
      <PageTour route="/recurring-billing" role={role} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Recurring Billing</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Payment Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Lease</h3></div>
                <div className="space-y-2">
                  <Label>Lease (Tenant — Property/Unit) *</Label>
                  <SearchableSelect
                    value={form.lease_id}
                    onValueChange={(v) => {
                      const lease = (leasesQ.data ?? []).find((l: any) => l.id === v);
                      setForm((f) => ({
                        ...f,
                        lease_id: v,
                        amount: lease?.monthly_rent ?? 0,
                      }));
                    }}
                    placeholder="Select a lease"
                    options={(leasesQ.data ?? []).map((l: any) => ({ value: l.id, label: `${l.tenant?.full_name ?? "Unknown"} — ${l.unit?.property?.name ?? ""} / ${l.unit?.unit_number ?? ""}` }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Only active leases without existing reminders are shown.</p>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Schedule</h3></div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Due Day (1–31) *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={form.due_day}
                      onChange={(e) => setForm((f) => ({ ...f, due_day: Number(e.target.value) }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Day of month when payment is due. Default per standard lease terms is the 25th.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Reminder Type</Label>
                    <SearchableSelect
                      value={form.reminder_type}
                      onValueChange={(v) => setForm((f) => ({ ...f, reminder_type: v }))}
                      placeholder="Select type"
                      options={[
                        { value: "auto", label: "Auto — Send automatically on due date" },
                        { value: "manual", label: "Manual — Send on demand only" },
                      ]}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Auto reminders are sent automatically. Manual reminders must be triggered from the list.</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Amount</h3></div>
                <div className="space-y-2">
                  <Label>Amount (UGX) *</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                    placeholder="e.g. 1500000"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Monthly rent amount. Pre-filled from the selected lease.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => createReminder.mutate()} disabled={!form.lease_id || createReminder.isPending}>
                {createReminder.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReminders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Total</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {monthlyTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : ""}`}>
              {overdueCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={reminders}
        isLoading={remindersQ.isLoading}
        searchFields={["lease", "tenant", "property", "unit"]}
        keyExtractor={(item) => item.id}
        titleField="tenant"
        subtitleField="property"
        statusField="status"
        metricFields={[
          { key: "amount", label: "Amount", format: "currency" },
          { key: "due_day", label: "Due Day" },
          { key: "reminder_type", label: "Type" },
        ]}
        emptyMessage="No payment reminders configured."
        cardActions={(r) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleReminder.mutate({ id: r.id, is_active: !r.is_active })}>
              {r.is_active ? (
                <><ToggleRight className="h-3 w-3 text-green-600 mr-1" /> Active</>
              ) : (
                <><ToggleLeft className="h-3 w-3 text-muted-foreground mr-1" /> Paused</>
              )}
            </Button>
            {r.reminder_type === "manual" && (
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => sendNow.mutate(r.id)} disabled={sendNow.isPending}>
                <Send className="mr-1 h-3 w-3" /> Send Now
              </Button>
            )}
          </>
        )}
      />
    </div>
  );
}
