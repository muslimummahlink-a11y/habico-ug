// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole, useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { FileUpload } from "@/components/ui/file-upload";
import { Plus, Pencil, Trash2, XCircle, Building2, FileText } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/create-notification";
import { TenancyAgreementDialog } from "@/components/tenancy-agreement-template";
import type { AgreementData } from "@/components/tenancy-agreement-template";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/leases")({
  head: () => ({ meta: [{ title: "Leases — Habico Portal" }] }),
  component: LeasesPage,
});

const PAYMENT_DUE_OPTIONS = [1, 5, 10, 15, 20, 25, 28].map((d) => ({ value: String(d), label: d > 28 ? "End of month" : `Day ${d}` }));
const BILLING_PERIOD_OPTIONS = ["monthly", "quarterly", "bi_annual", "annual"].map((p) => ({ value: p, label: p.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));
const TERMINATION_REASON_OPTIONS = ["Left without paying", "Absconded", "Evicted", "Dispute", "Other"].map((r) => ({ value: r, label: r }));
const LATE_PENALTY_RATE = 0.05;

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ended: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  terminated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function LeasesPage() {
  const role = useHighestRole();
  const { user } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementData, setAgreementData] = useState<AgreementData | null>(null);
  const [editingLease, setEditingLease] = useState<any>(null);
  const [terminatingLease, setTerminatingLease] = useState<any>(null);

  const blankForm = {
    unit_id: "", tenant_email: "", monthly_rent: "0", deposit: "0",
    deposit_months: "1", start_date: new Date().toISOString().slice(0, 10), end_date: "",
    payment_due_day: "25", billing_period: "monthly",
    late_fee_amount: "0", late_fee_grace_days: "0", special_conditions: "",
    signed_document_url: "",
  };
  const [form, setForm] = useState({ ...blankForm });

  const [terminateForm, setTerminateForm] = useState({ outstanding_balance: "0", termination_reason: "" });

  const { data: myPropIds } = useQuery({
    queryKey: ["my-property-ids", user?.id],
    queryFn: async () => {
      if (!user || role !== "owner") return null;
      const { data } = await supabase.from("properties").select("id").eq("owner_id", user.id);
      return ((data as any[]) ?? []).map((p) => p.id);
    },
    enabled: role === "owner" && !!user,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases", role, user?.id, myPropIds],
    queryFn: async () => {
      let query = supabase
        .from("leases")
        .select("*, units!inner(unit_number, floor_number, bedrooms, properties(id, name, location, address))")
        .order("created_at", { ascending: false });
      if (role === "owner") {
        if (!myPropIds || myPropIds.length === 0) return [];
        query = query.in("units.property_id", myPropIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((l: any) => l.tenant_id)));
      const { data: tenantList } = ids.length
        ? await supabase.from("tenants").select("*").in("id", ids)
        : { data: [] };
      const map = new Map((tenantList ?? []).map((t: any) => [t.id, t]));
      return (data ?? []).map((l: any) => {
        const profile = map.get(l.tenant_id);
        return { ...l, profile, tenant: profile?.full_name ?? "Untitled", property: l.units?.properties?.name ?? "" };
      });
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units-all"], enabled: isStaff,
    queryFn: async () => {
      const { data } = await supabase
        .from("units")
        .select("id, unit_number, monthly_rent, status, properties(name)")
        .order("unit_number");
      return data ?? [];
    },
  });

  const now = new Date();
  const activeLeases = leases.filter((l: any) => l.status === "active");
  const activeCount = activeLeases.length;
  const totalMonthly = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);
  const expiringSoon = activeLeases.filter((l: any) => {
    if (!l.end_date) return false;
    const end = new Date(l.end_date);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  const create = useMutation({
    mutationFn: async () => {
      if (!form.signed_document_url) throw new Error("Upload the signed & stamped tenancy agreement before creating the lease.");
      const { data: prof, error: pe } = await supabase.from("profiles").select("id").eq("email", form.tenant_email).maybeSingle();
      if (pe) throw pe;
      if (!prof) throw new Error("No tenant account found for that email. Ask them to sign up first.");
      let tenantId: string;
      const { data: tenantRec } = await supabase.from("tenants").select("id").eq("auth_user_id", prof.id).maybeSingle();
      if (tenantRec) {
        tenantId = tenantRec.id;
      } else {
        const { data: profFull } = await supabase.from("profiles").select("full_name").eq("id", prof.id).single();
        const { data: newTenant, error: ntErr } = await supabase.from("tenants").insert({
          auth_user_id: prof.id,
          email: form.tenant_email,
          full_name: profFull?.full_name ?? form.tenant_email.split("@")[0],
          status: "active",
        }).select("id").single();
        if (ntErr) throw ntErr;
        tenantId = newTenant.id;
        toast.success("Tenant record created automatically");
      }
      const monthlyRent = Number(form.monthly_rent);
      const lateFee = Number(form.late_fee_amount) || Math.round(monthlyRent * LATE_PENALTY_RATE);
      const { error } = await supabase.from("leases").insert({
        unit_id: form.unit_id, tenant_id: tenantId,
        monthly_rent: monthlyRent, deposit: Number(form.deposit),
        deposit_months: Number(form.deposit_months),
        start_date: form.start_date, end_date: form.end_date || null,
        payment_due_day: Number(form.payment_due_day), billing_period: form.billing_period,
        late_fee_amount: lateFee,
        late_fee_grace_days: Number(form.late_fee_grace_days),
        special_conditions: form.special_conditions || null,
        signed_document_url: form.signed_document_url,
      });
      if (error) throw error;
      await supabase.from("units").update({ status: "occupied" }).eq("id", form.unit_id);
    },
    onSuccess: () => {
      toast.success("Lease created"); setOpen(false); setForm({ ...blankForm });
      qc.invalidateQueries({ queryKey: ["leases"] });
      if (user) createNotification(user.id, "Lease created",
        `${form.tenant_email} — Unit ${form.unit_id?.slice(0, 8) ?? ""}`,
        "/leases", "info");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editingLease) return;
      if (!form.signed_document_url && !editingLease.signed_document_url) throw new Error("Upload the signed & stamped tenancy agreement before updating the lease.");
      if (editingLease.unit_id !== form.unit_id) {
        await supabase.from("units").update({ status: "vacant" }).eq("id", editingLease.unit_id);
        await supabase.from("units").update({ status: "occupied" }).eq("id", form.unit_id);
      }
      const monthlyRent = Number(form.monthly_rent);
      const lateFee = Number(form.late_fee_amount) || Math.round(monthlyRent * LATE_PENALTY_RATE);
      const { error } = await supabase.from("leases").update({
        unit_id: form.unit_id, monthly_rent: monthlyRent,
        deposit: Number(form.deposit), deposit_months: Number(form.deposit_months),
        start_date: form.start_date, end_date: form.end_date || null,
        payment_due_day: Number(form.payment_due_day), billing_period: form.billing_period,
        late_fee_amount: lateFee,
        late_fee_grace_days: Number(form.late_fee_grace_days),
        special_conditions: form.special_conditions || null,
        signed_document_url: form.signed_document_url || editingLease.signed_document_url,
      }).eq("id", editingLease.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lease updated"); setEditOpen(false); setEditingLease(null); setForm({ ...blankForm }); qc.invalidateQueries({ queryKey: ["leases"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const terminate = useMutation({
    mutationFn: async () => {
      if (!terminatingLease) return;
      await supabase.from("leases").update({
        status: "terminated", outstanding_balance: Number(terminateForm.outstanding_balance),
        termination_reason: terminateForm.termination_reason,
        termination_date: new Date().toISOString().slice(0, 10),
      }).eq("id", terminatingLease.id);
      await supabase.from("units").update({ status: "vacant" }).eq("id", terminatingLease.unit_id);
    },
    onSuccess: () => {
      toast.success("Lease terminated");
      setTerminateOpen(false); setTerminatingLease(null);
      setTerminateForm({ outstanding_balance: "0", termination_reason: "" });
      qc.invalidateQueries({ queryKey: ["leases"] });
      if (user) createNotification(user.id, "Lease terminated",
        terminatingLease ? `Lease #${terminatingLease.id?.slice(0, 8)} terminated` : undefined,
        "/leases", "warning");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function openEdit(l: any) {
    setEditingLease(l);
    setForm({
      unit_id: l.unit_id, tenant_email: l.profile?.email ?? "",
      monthly_rent: String(l.monthly_rent), deposit: String(l.deposit ?? 0),
      deposit_months: String(l.deposit_months ?? 1),
      start_date: l.start_date, end_date: l.end_date ?? "",
      payment_due_day: String(l.payment_due_day ?? 1),
      billing_period: l.billing_period ?? "monthly",
      late_fee_amount: String(l.late_fee_amount ?? 0),
      late_fee_grace_days: String(l.late_fee_grace_days ?? 0),
      special_conditions: l.special_conditions ?? "",
      signed_document_url: l.signed_document_url ?? "",
    });
    setEditOpen(true);
  }

  function openTerminate(l: any) {
    setTerminatingLease(l);
    setTerminateForm({ outstanding_balance: "0", termination_reason: "" });
    setTerminateOpen(true);
  }

  function parseLocation(loc: string): { village: string; parish: string; county: string; district: string } {
    const parts = (loc ?? "").split("/");
    return { district: parts[1] ?? "", county: parts[2] ?? "", parish: parts[3] ?? "", village: parts[4] ?? "" };
  }

  function buildAgreementData(l: any): AgreementData {
    const months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    const startD = l.start_date ? new Date(l.start_date) : new Date();
    const endD = l.end_date ? new Date(l.end_date) : new Date(startD.getFullYear() + 1, startD.getMonth(), startD.getDate());
    const t = l.profile ?? {};
    const prop = l.units?.properties ?? {};
    const loc = parseLocation(prop.location ?? "");
    return {
      day: String(startD.getDate()),
      month: months[startD.getMonth()],
      year: String(startD.getFullYear()),
      startDate: startD.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/\//g, " "),
      endDate: endD.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/\//g, " "),
      tenant: {
        name: t.full_name || t.email?.split("@")[0] || "Tenant",
        nationalId: t.id_number ?? "",
        dob: "",
        poBox: "",
        contact: t.phone ?? "",
        email: t.email ?? "",
        occupation: t.occupation ?? "",
        workplace: t.employer ?? "",
        nextOfKin: t.emergency_contact_name ?? "",
        nextOfKinContact: t.emergency_contact_phone ?? "",
        relationship: "",
      },
      property: {
        usage: (l.units?.unit_type ?? "RESIDENTIAL").toUpperCase(),
        rooms: l.units?.bedrooms ? String(l.units.bedrooms) : "1",
        unitNo: l.units?.unit_number ?? "",
        location: prop.location ?? "",
        village: loc.village,
        parish: loc.parish,
        county: loc.county,
        district: loc.district,
        propertyName: prop.name ?? "",
        streetName: prop.address ?? "",
      },
      payment: {
        monthlyRent: Number(l.monthly_rent),
        amountPaid: Number(l.monthly_rent) * (l.billing_period === "quarterly" ? 3 : 1),
        periodPaid: l.billing_period === "quarterly" ? "Quarterly" : l.billing_period === "annual" ? "Annual" : "Monthly",
        deposit: Number(l.deposit ?? 0),
      },
      bank: {
        bankName: "Stanbic Bank",
        accountNumber: "9030027136418",
        accountName: "HABICO PROPERTY MANAGERS LIMITED",
      },
    };
  }

  function openAgreement(l: any) {
    setAgreementData(buildAgreementData(l));
    setAgreementOpen(true);
  }

  function unitChange(value: string) {
    const u = units.find((x: any) => x.id === value) as any;
    const rent = u ? String(u.monthly_rent) : "0";
    setForm({ ...form, unit_id: value, monthly_rent: rent, deposit: String(Number(rent) * Number(form.deposit_months)) });
  }

  function monthlyRentChange(value: string) {
    setForm({ ...form, monthly_rent: value, deposit: String(Number(value) * Number(form.deposit_months)) });
  }

  function depositMonthsChange(value: string) {
    setForm({ ...form, deposit_months: value, deposit: String(Number(form.monthly_rent) * Number(value)) });
  }

  function daysRemaining(endDate: string | null): number | null {
    if (!endDate) return null;
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function DaysCell({ endDate }: { endDate: string | null }) {
    const diff = daysRemaining(endDate);
    if (diff === null) return <TableCell className="text-sm text-muted-foreground">—</TableCell>;
    if (diff < 0) return <TableCell className="text-sm font-semibold text-destructive">Expired</TableCell>;
    if (diff <= 30) return <TableCell className="text-sm font-semibold text-orange-500">{diff} days</TableCell>;
    return <TableCell className="text-sm">{diff} days</TableCell>;
  }

  function StatusBadge({ status }: { status: string }) {
    const color = statusColors[status] ?? "bg-secondary text-muted-foreground";
    return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{status}</span>;
  }

  function renderFormFields(isEdit = false) {
    return (
      <div className="space-y-5">
        <div>
          <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Unit &amp; Tenant</h3></div>
          <div className="space-y-3">
            <div>
              <Label>Unit *</Label>
              <SearchableSelect
                value={form.unit_id}
                onValueChange={unitChange}
                placeholder="Select unit…"
                options={units.map((u: any) => ({ value: u.id, label: `${u.properties?.name} · Unit ${u.unit_number} — UGX ${Number(u.monthly_rent).toLocaleString()}/mo` }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Select any unit — occupied or vacant.</p>
            </div>
            <div>
              <Label>Tenant Email * {isEdit ? "(cannot be changed)" : ""}</Label>
              <Input value={form.tenant_email} onChange={(e: any) => setForm({ ...form, tenant_email: e.target.value })} disabled={isEdit} placeholder="tenant@example.com" />
              {!isEdit && <p className="mt-1 text-xs text-muted-foreground">Tenant must have an existing account. They will be linked by email.</p>}
            </div>
          </div>
        </div>
        <div>
          <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Rent &amp; Deposit</h3></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly Rent (UGX) *</Label>
              <Input type="number" value={form.monthly_rent} onChange={(e: any) => monthlyRentChange(e.target.value)} placeholder="e.g. 1500000" />
            </div>
            <div>
              <Label>Deposit (Months) *</Label>
              <SearchableSelect
                value={form.deposit_months}
                onValueChange={depositMonthsChange}
                placeholder="Select months"
                options={Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({ value: String(n), label: `${n} month${n > 1 ? "s" : ""}` }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Security deposit equivalent to this many months' rent.</p>
            </div>
            <div>
              <Label>Deposit Amount (UGX)</Label>
              <Input type="number" value={form.deposit} onChange={(e: any) => setForm({ ...form, deposit: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">Auto-calculated as months × monthly rent. Adjust if needed.</p>
            </div>
          </div>
        </div>
        <div>
          <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Payment Terms</h3></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payment Due Day *</Label>
              <SearchableSelect
                value={form.payment_due_day}
                onValueChange={(v) => setForm({ ...form, payment_due_day: v })}
                placeholder="Select day"
                options={PAYMENT_DUE_OPTIONS}
              />
              <p className="mt-1 text-xs text-muted-foreground">Default: 25th per standard agreement terms.</p>
            </div>
            <div>
              <Label>Billing Period</Label>
              <SearchableSelect
                value={form.billing_period}
                onValueChange={(v) => setForm({ ...form, billing_period: v })}
                placeholder="Select period"
                options={BILLING_PERIOD_OPTIONS}
              />
            </div>
            <div>
              <Label>Late Fee (UGX)</Label>
              <Input type="number" value={form.late_fee_amount} onChange={(e: any) => setForm({ ...form, late_fee_amount: e.target.value })} placeholder="Auto-calculated (5% of rent)" />
              <p className="mt-1 text-xs text-muted-foreground">5% late penalty per clause 3. Auto-calculated if left as 0.</p>
            </div>
            <div>
              <Label>Grace Period (Days)</Label>
              <Input type="number" value={form.late_fee_grace_days} onChange={(e: any) => setForm({ ...form, late_fee_grace_days: e.target.value })} placeholder="e.g. 3" />
              <p className="mt-1 text-xs text-muted-foreground">Number of days after due date before late fee applies.</p>
            </div>
          </div>
        </div>
        <div>
          <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Dates &amp; Conditions</h3></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" value={form.start_date} onChange={(e: any) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e: any) => setForm({ ...form, end_date: e.target.value })} />
              <p className="mt-1 text-xs text-muted-foreground">Leave blank for periodic (month-to-month) tenancy.</p>
            </div>
          </div>
          <div className="mt-3">
            <Label>Special Conditions</Label>
            <Textarea value={form.special_conditions} onChange={(e: any) => setForm({ ...form, special_conditions: e.target.value })} placeholder="e.g. Pet allowed with additional deposit, no subletting, landlord provides water &amp; garbage…" rows={3} />
            <p className="mt-1 text-xs text-muted-foreground">Any custom terms, conditions, or clauses specific to this lease agreement.</p>
          </div>
        </div>
        <div>
          <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Signed Agreement</h3></div>
          <FileUpload
            bucket="public"
            folder="signed-agreements"
            accept=".pdf,image/*"
            maxSizeMB={10}
            value={form.signed_document_url}
            onChange={(url) => setForm({ ...form, signed_document_url: url })}
            label="Signed &amp; Stamped Tenancy Agreement *"
          />
          <p className="mt-1 text-xs text-muted-foreground">Upload the scanned copy signed by both parties. Lease cannot be activated without this document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/leases" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Agreements</div>
          <h1 className="display text-3xl font-bold">Leases</h1>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm({ ...blankForm }); }}>
            <DialogTrigger asChild><Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-2 h-4 w-4" />New lease</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>New lease</DialogTitle></DialogHeader>
              {renderFormFields()}
              <DialogFooter>
                <Button onClick={() => create.mutate()} disabled={!form.unit_id || !form.tenant_email || !form.signed_document_url || create.isPending}>Create lease</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Leases</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Monthly Recurring</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalMonthly.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Expiring Soon (≤30 days)</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${expiringSoon > 0 ? "text-orange-500" : ""}`}>{expiringSoon}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={leases}
        isLoading={false}
        searchFields={["tenant", "property", "unit"]}
        filterField="status"
        filterOptions={[
          { label: "Active", value: "active" },
          { label: "Ended", value: "ended" },
          { label: "Terminated", value: "terminated" },
        ]}
        keyExtractor={(item) => item.id}
        titleField="tenant"
        subtitleField="property"
        statusField="status"
        metricFields={[
          { key: "monthly_rent", label: "Rent", format: "currency" },
          { key: "outstanding_balance", label: "Arrears", format: "currency" },
          { key: "end_date", label: "End Date", format: "date" },
        ]}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Lease"
        cardActions={(l) => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openAgreement(l)} title="Print tenancy agreement"><FileText className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(l)} title="Edit lease"><Pencil className="h-3 w-3" /></Button>
            {l.status === "active" && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => openTerminate(l)} title="Terminate lease"><XCircle className="h-3 w-3" /></Button>
            )}
          </>
        ) : undefined}
      />

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { setEditingLease(null); setForm({ ...blankForm }); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit lease</DialogTitle></DialogHeader>
          {renderFormFields(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingLease(null); setForm({ ...blankForm }); }}>Cancel</Button>
            <Button onClick={() => update.mutate()} disabled={!form.unit_id || update.isPending}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={agreementOpen} onOpenChange={(v) => { setAgreementOpen(v); if (!v) setAgreementData(null); }}>
        <DialogContent className="max-h-[95vh] overflow-y-auto max-w-4xl">
          <DialogHeader><DialogTitle>Habico Tenancy Agreement</DialogTitle></DialogHeader>
          {agreementData && <TenancyAgreementDialog data={agreementData} />}
        </DialogContent>
      </Dialog>

      <Dialog open={terminateOpen} onOpenChange={(v) => { setTerminateOpen(v); if (!v) { setTerminatingLease(null); setTerminateForm({ outstanding_balance: "0", termination_reason: "" }); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Terminate Lease (30-day notice)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <AlertDialogDescription className="text-sm">
              {terminatingLease && (
                <span>
                  Ending lease for <strong>{terminatingLease.profile?.full_name ?? terminatingLease.profile?.email}</strong> at {terminatingLease.units?.properties?.name} · {terminatingLease.units?.unit_number}. Per clause 10(a), either party must give <strong>30 days' notice</strong>. Outstanding arrears will be tracked. The unit will be marked as vacant and deposit refund processed within 2 weeks per clause 4.
                </span>
              )}
            </AlertDialogDescription>
            <div>
              <Label>Outstanding Balance (UGX) *</Label>
              <Input type="number" value={terminateForm.outstanding_balance} onChange={(e: any) => setTerminateForm({ ...terminateForm, outstanding_balance: e.target.value })} placeholder="0" />
              <p className="mt-1 text-xs text-muted-foreground">Any unpaid rent or fees still owed by the tenant.</p>
            </div>
            <div>
              <Label>Termination Reason *</Label>
              <SearchableSelect
                value={terminateForm.termination_reason}
                onValueChange={(v) => setTerminateForm({ ...terminateForm, termination_reason: v })}
                placeholder="Select reason…"
                options={TERMINATION_REASON_OPTIONS}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTerminateOpen(false); setTerminatingLease(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => terminate.mutate()} disabled={!terminateForm.termination_reason || terminate.isPending}>
              {terminate.isPending ? "Processing…" : "Terminate lease"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
