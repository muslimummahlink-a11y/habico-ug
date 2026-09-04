import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GridDataCards, type GridCardField } from "@/components/data-grid-cards";
import { Plus, Pencil, Search, Users, Phone, Mail, Eye, EyeOff, Copy, Key, ShieldAlert, Check, RefreshCw, Building2, Home, Layers, MapPin, CreditCard, AlertTriangle, MessageSquare, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/create-notification";
import { sendReminder } from "@/lib/sendEmails.functions";
import { PageTour } from "@/components/page-tour";

const ID_TYPE_OPTIONS = ["national_id", "passport", "drivers_license"].map((t) => ({ value: t, label: t === "drivers_license" ? "Driver's License" : t === "national_id" ? "National ID" : "Passport" }));
const STATUS_OPTIONS = ["active", "inactive", "blacklisted"].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const GENDER_OPTIONS = [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }];

const emptyForm = {
  full_name: "",
  phone: "",
  email: "",
  id_type: "national_id",
  id_number: "",
  gender: "",
  status: "active" as string,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  previous_address: "",
  occupation: "",
  employer: "",
  monthly_income: 0,
  access_pin: "",
  notes: "",
  property_id: "",
  unit_id: "",
};

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Habico Portal" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const { user } = useAuth();
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [pinVisible, setPinVisible] = useState(false);
  const [formTab, setFormTab] = useState("basic");

  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      return data ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["tenant-properties", currentProfile?.company_id],
    queryFn: async () => {
      let q = supabase.from("properties" as any).select("id, name, location").order("name");
      if (currentProfile?.company_id) q = q.eq("company_id", currentProfile.company_id);
      const { data }: any = await q;
      return data ?? [];
    },
    enabled: !!currentProfile,
  });

  const [formPropertyId, setFormPropertyId] = useState("");

  const { data: propertyUnits = [] } = useQuery({
    queryKey: ["tenant-property-units", formPropertyId],
    queryFn: async () => {
      if (!formPropertyId) return [];
      const { data } = await supabase
        .from("units")
        .select("id, unit_number, floor_number, monthly_rent, bedrooms, bathrooms, status")
        .eq("property_id", formPropertyId)
        .order("floor_number", { ascending: true, nullsFirst: false })
        .order("unit_number");
      return data ?? [];
    },
    enabled: !!formPropertyId,
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants", currentProfile?.company_id],
    queryFn: async () => {
      let q = supabase
        .from("tenants" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (currentProfile?.company_id) q = q.eq("company_id", currentProfile.company_id);
      const { data, error } = await q;
      if (error) throw error;
      let tenantList = (data ?? []) as any[];

      const authUserIds = tenantList.map((t: any) => t.auth_user_id).filter(Boolean);
      if (authUserIds.length > 0) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("user_id", authUserIds)
          .in("role", ["owner", "admin", "manager"]);
        const excludeIds = new Set((roles ?? []).map((r: any) => r.user_id));
        tenantList = tenantList.filter((t: any) => !t.auth_user_id || !excludeIds.has(t.auth_user_id));
      }

      if (tenantList.length === 0) return tenantList;
      const { data: leases } = await supabase
        .from("leases")
        .select("id, tenant_id, monthly_rent, outstanding_balance, unit_id, units!inner(unit_number, floor_number, property_id, properties!inner(name, location))")
        .eq("status", "active")
        .in("tenant_id", tenantList.map((t: any) => t.id));
      const leaseMap = new Map((leases ?? []).map((l: any) => [l.tenant_id, l]));
      return tenantList.map((t: any) => ({ ...t, lease: leaseMap.get(t.id) }));
    },
    enabled: !!currentProfile,
  });

  const total = tenants.length;
  const activeCount = tenants.filter((t: any) => t.status === "active").length;
  const inactiveCount = tenants.filter((t: any) => t.status === "inactive").length;
  const blacklistedCount = tenants.filter((t: any) => t.status === "blacklisted").length;

  const filtered = tenants.filter((t: any) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.full_name?.toLowerCase().includes(q) ||
      t.phone?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchProperty = !propertyFilter || t.lease?.units?.property_id === propertyFilter;
    const matchGender = !genderFilter || t.gender === genderFilter;
    const matchLocation = !locationFilter ||
      t.lease?.units?.properties?.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      t.lease?.units?.properties?.name?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchStatus && matchProperty && matchGender && matchLocation;
  });

  const displayed = statusFilter === "all" ? filtered : filtered.filter((t: any) => t.status === statusFilter);

  function openEdit(t: any) {
    setSelectedTenant(t);
    const leaseUnitId = t.lease?.unit_id ?? "";
    const leasePropertyId = t.lease?.units?.property_id ?? "";
    setForm({
      full_name: t.full_name ?? "",
      phone: t.phone ?? "",
      email: t.email ?? "",
      id_type: t.id_type ?? "national_id",
      id_number: t.id_number ?? "",
      gender: t.gender ?? "",
      status: t.status ?? "active",
      emergency_contact_name: t.emergency_contact_name ?? "",
      emergency_contact_phone: t.emergency_contact_phone ?? "",
      previous_address: t.previous_address ?? "",
      occupation: t.occupation ?? "",
      employer: t.employer ?? "",
      monthly_income: t.monthly_income ?? 0,
      access_pin: t.access_pin ?? "",
      notes: t.notes ?? "",
      property_id: leasePropertyId,
      unit_id: leaseUnitId,
    });
    setFormPropertyId(leasePropertyId);
    setPinVisible(false);
    setFormTab("basic");
    setEditOpen(true);
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setFormPropertyId("");
    setPinVisible(false);
    setFormTab("basic");
  }

  function generatePin() {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setForm({ ...form, access_pin: pin });
  }

  async function copyPin() {
    try {
      await navigator.clipboard.writeText(form.access_pin);
      toast.success("PIN copied");
    } catch {
      toast.error("Failed to copy");
    }
  }

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { property_id, unit_id, ...tenantData } = values;
      const { data: newTenant, error } = await supabase.from("tenants").insert([tenantData]).select("id").single();
      if (error) throw error;
      if (unit_id && newTenant) {
        const unit = propertyUnits.find((u: any) => u.id === unit_id);
        const monthlyRent = unit?.monthly_rent ?? 0;
        const { error: le } = await supabase.from("leases").insert({
          tenant_id: newTenant.id,
          unit_id,
          monthly_rent: monthlyRent,
          deposit: monthlyRent,
          deposit_months: 1,
          start_date: new Date().toISOString().slice(0, 10),
          payment_due_day: 25,
          billing_period: "monthly",
          late_fee_amount: Math.round(monthlyRent * 0.05),
          late_fee_grace_days: 5,
          status: "active",
        });
        if (le) throw le;
        await supabase.from("units").update({ status: "occupied" }).eq("id", unit_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["leases"] });
      toast.success("Tenant created" + (form.unit_id ? " with lease" : ""));
      setCreateOpen(false);
      resetForm();
      if (user) createNotification(user.id, "Tenant created",
        `${form.full_name ?? ""}${form.unit_id ? " with lease" : ""}`,
        "/tenants", "success");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form & { id: string }) => {
      const { id, property_id, unit_id, ...rest } = values;
      if (!id) throw new Error(`Cannot update tenant: id is ${typeof id}`);
      const { error } = await supabase.from("tenants").update(rest).eq("id", id);
      if (error) throw error;
      if (unit_id) {
        const existingLease = tenants.find((t: any) => t.id === id)?.lease;
        if (existingLease) {
          if (existingLease.unit_id !== unit_id) {
            await supabase.from("units").update({ status: "vacant" }).eq("id", existingLease.unit_id);
            const unit = propertyUnits.find((u: any) => u.id === unit_id);
            const monthlyRent = unit?.monthly_rent ?? existingLease.monthly_rent;
            const { error: le } = await supabase.from("leases").update({
              unit_id,
              monthly_rent: monthlyRent,
              deposit: monthlyRent,
            }).eq("id", existingLease.id);
            if (le) throw le;
            await supabase.from("units").update({ status: "occupied" }).eq("id", unit_id);
          }
        } else {
          const unit = propertyUnits.find((u: any) => u.id === unit_id);
          const monthlyRent = unit?.monthly_rent ?? 0;
          const { error: le } = await supabase.from("leases").insert({
            tenant_id: id,
            unit_id,
            monthly_rent: monthlyRent,
            deposit: monthlyRent,
            deposit_months: 1,
            start_date: new Date().toISOString().slice(0, 10),
            payment_due_day: 25,
            billing_period: "monthly",
            late_fee_amount: Math.round(monthlyRent * 0.05),
            late_fee_grace_days: 5,
            status: "active",
          });
          if (le) throw le;
          await supabase.from("units").update({ status: "occupied" }).eq("id", unit_id);
        }
      } else {
        const existingLease = tenants.find((t: any) => t.id === id)?.lease;
        if (existingLease) {
          await supabase.from("leases").update({ status: "ended" }).eq("id", existingLease.id);
          await supabase.from("units").update({ status: "vacant" }).eq("id", existingLease.unit_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      qc.invalidateQueries({ queryKey: ["leases"] });
      toast.success("Tenant updated");
      setEditOpen(false);
      setSelectedTenant(null);
      resetForm();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tenants").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function printDossier(t: any) {
    const { data: payments } = t.lease?.id
      ? await supabase.from("payments").select("*").eq("lease_id", t.lease.id).order("payment_date", { ascending: false })
      : { data: [] };
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const fmt = (d: string) => { const dt = new Date(d); return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`; };
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Tenant Dossier - ${t.full_name || "Tenant"}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Inter','Segoe UI',system-ui,sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; background: #fff; padding: 0; margin: 0; }
        .header { background: linear-gradient(135deg,#0f172a,#1e293b); color: #fff; padding: 24px 28px; margin: -12mm -12mm 20px; display: flex; align-items: center; justify-content: space-between; }
        .header h1 { font-size: 24px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
        .header .sub { font-size: 13px; color: #94a3b8; margin: 2px 0 0; }
        .header .badge { background: #f59e0b; color: #fff; padding: 6px 18px; border-radius: 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .section { margin: 18px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #1e293b; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 8px 0; }
        .field { margin: 4px 0; }
        .field .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .field .value { font-weight: 600; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
        th, td { padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #1e293b; color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-muted { color: #64748b; }
        .notes { margin: 10px 0; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 13px; white-space: pre-wrap; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .print-btn { display: block; margin: 16px auto; padding: 8px 24px; background: #1e293b; color: #fff; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; }
        @media print { .print-btn { display: none; } }
      </style>
    </head><body>
      <div class="header"><div><h1>HABICO</h1><p class="sub">Property Managers · Kampala, Uganda</p></div><div class="badge">Tenant Dossier</div></div>
      <p class="text-muted" style="margin:0 0 8px">Prepared: ${fmt(new Date().toISOString().split("T")[0])}</p>

      <div class="section">Personal Information</div>
      <div class="grid2">
        <div class="field"><div class="label">Full Name</div><div class="value">${t.full_name || "—"}</div></div>
        <div class="field"><div class="label">Status</div><div class="value">${(t.status || "active").charAt(0).toUpperCase() + (t.status || "active").slice(1)}</div></div>
        <div class="field"><div class="label">Phone</div><div class="value">${t.phone || "—"}</div></div>
        <div class="field"><div class="label">Email</div><div class="value">${t.email || "—"}</div></div>
        <div class="field"><div class="label">Gender</div><div class="value">${t.gender ? t.gender.charAt(0).toUpperCase() + t.gender.slice(1) : "—"}</div></div>
        <div class="field"><div class="label">ID Type</div><div class="value">${t.id_type ? t.id_type.replace("_", " ").replace(/\b\w/g, (c:any) => c.toUpperCase()) : "—"}</div></div>
        <div class="field"><div class="label">ID Number</div><div class="value">${t.id_number || "—"}</div></div>
        <div class="field"><div class="label">Access PIN</div><div class="value">${t.access_pin || "—"}</div></div>
      </div>

      ${t.lease ? `
      <div class="section">Lease Information</div>
      <div class="grid2">
        <div class="field"><div class="label">Property</div><div class="value">${t.lease.units?.properties?.name || "—"}</div></div>
        <div class="field"><div class="label">Location</div><div class="value">${t.lease.units?.properties?.location || "—"}</div></div>
        <div class="field"><div class="label">Unit</div><div class="value">Unit ${t.lease.units?.unit_number || "—"}</div></div>
        <div class="field"><div class="label">Floor</div><div class="value">${t.lease.units?.floor_number != null ? "Floor " + t.lease.units?.floor_number : "—"}</div></div>
        <div class="field"><div class="label">Monthly Rent</div><div class="value">UGX ${Number(t.lease.monthly_rent).toLocaleString()}</div></div>
        <div class="field"><div class="label">Start Date</div><div class="value">${t.lease.start_date ? fmt(t.lease.start_date) : "—"}</div></div>
        <div class="field"><div class="label">Payment Due</div><div class="value">${t.lease.payment_due_day ? t.lease.payment_due_day + "th of month" : "—"}</div></div>
        <div class="field"><div class="label">Outstanding</div><div class="value">${Number(t.lease.outstanding_balance || 0) > 0 ? "UGX " + Number(t.lease.outstanding_balance).toLocaleString() : "Nil"}</div></div>
      </div>` : ""}

      <div class="section">Payment History</div>
      ${payments && payments.length > 0 ? `
      <table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Period</th><th>Reference</th></tr></thead><tbody>
        ${payments.map((p:any) => `<tr><td>${fmt(p.payment_date)}</td><td class="text-right">UGX ${Number(p.amount).toLocaleString()}</td><td>${(p.method || "—").replace(/_/g, " ").replace(/\b\w/g, (c:any) => c.toUpperCase())}</td><td>${p.period_label || "—"}</td><td>${p.reference || "—"}</td></tr>`).join("")}
      </tbody></table>` : "<p style='color:#64748b;font-size:10px'>No payment records found.</p>"}

      <div class="section">Emergency Contact &amp; Employment</div>
      <div class="grid2">
        <div class="field"><div class="label">Emergency Contact</div><div class="value">${t.emergency_contact_name || "—"} ${t.emergency_contact_phone ? "(" + t.emergency_contact_phone + ")" : ""}</div></div>
        <div class="field"><div class="label">Previous Address</div><div class="value">${t.previous_address || "—"}</div></div>
        <div class="field"><div class="label">Occupation</div><div class="value">${t.occupation || "—"}</div></div>
        <div class="field"><div class="label">Employer</div><div class="value">${t.employer || "—"}</div></div>
        <div class="field"><div class="label">Monthly Income</div><div class="value">${t.monthly_income ? "UGX " + Number(t.monthly_income).toLocaleString() : "—"}</div></div>
      </div>

      ${t.notes ? `<div class="section">Notes</div><div class="notes">${t.notes}</div>` : ""}

      <div class="footer">Habico Property Managers — Basiima Building, 2nd Floor Room C03, Kampala · 0756742220 | 0702239607</div>
      <button class="print-btn" onclick="window.print()">Print Dossier</button>
    </body></html>`);
    win.document.close();
  }

  function handleCreate() {
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    createMutation.mutate(form);
  }

  function handleUpdate() {
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    updateMutation.mutate({ ...form, id: selectedTenant.id });
  }

  function statusBadge(status: string) {
    const cls = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800",
      inactive: "bg-secondary text-secondary-foreground",
      blacklisted: "bg-destructive/10 text-destructive border-destructive/20",
    }[status] ?? "bg-secondary text-secondary-foreground";
    return <Badge variant="outline" className={cls}>{status}</Badge>;
  }

  function formatIdType(t: string) {
    return t === "drivers_license" ? "Driver's License" : t === "national_id" ? "National ID" : "Passport";
  }

  if (!isStaff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const fields: GridCardField<any>[] = [
    {
      render: (t) => (
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold">{t.full_name || "—"}</h3>
          {statusBadge(t.status)}
        </div>
      ),
    },
    {
      label: "Contact",
      render: (t) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {t.phone || "—"}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {t.email || "—"}
          </div>
          {t.gender && (
            <div className="text-xs capitalize text-muted-foreground">{t.gender}</div>
          )}
        </div>
      ),
    },
    {
      label: "Property / Unit",
      render: (t) => t.lease ? (
        <div className="space-y-1 text-sm">
          <div className="font-medium">{t.lease.units?.properties?.name ?? "—"}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Home className="h-3 w-3" />
            Unit {t.lease.units?.unit_number ?? "—"}
            {t.lease.units?.floor_number != null && (
              <><Layers className="ml-1 h-3 w-3" /> Fl {t.lease.units?.floor_number}</>
            )}
          </div>
          <div className="text-xs">UGX {Number(t.lease.monthly_rent).toLocaleString()}/mo</div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">No active lease</span>
      ),
    },
    {
      label: "Balance",
      render: (t) => t.lease && Number(t.lease.outstanding_balance) > 0 ? (
        <div className="flex items-center gap-1.5 text-sm font-medium text-red-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          UGX {Number(t.lease.outstanding_balance).toLocaleString()}
        </div>
      ) : (
        <span className="text-sm text-green-600">—</span>
      ),
    },
  ];

  function printTenantList() {
    const list = filtered && filtered.length > 0 ? filtered : displayed;
    if (list.length === 0) { toast.error("No tenants to print"); return; }
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const fmt = (d: string) => { const dt = new Date(d); return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`; };
    const propFilterLabel = propertyFilter
      ? properties.find((p: any) => p.id === propertyFilter)?.name ?? "selected"
      : "All Properties";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Tenant List - Habico</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Inter','Segoe UI',system-ui,sans-serif; font-size: 10px; color: #1e293b; background: #fff; padding: 0; margin: 0; }
        .header { background: linear-gradient(135deg,#0f172a,#1e293b); color: #fff; padding: 16px 24px; margin: -10mm -10mm 14px; display: flex; align-items: center; justify-content: space-between; }
        .header h1 { font-size: 18px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
        .header .sub { font-size: 9px; color: #94a3b8; margin: 2px 0 0; }
        .header .badge { background: #f59e0b; color: #fff; padding: 3px 12px; border-radius: 4px; font-size: 8px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .filter-info { margin: 0 0 10px; font-size: 10px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
        th, td { padding: 5px 7px; text-align: left; font-size: 8.5px; white-space: nowrap; }
        th { background: #1e293b; color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 7.5px; }
        tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .badge-status { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 7.5px; font-weight: 600; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-inactive { background: #f1f5f9; color: #475569; }
        .badge-blacklisted { background: #fef2f2; color: #991b1b; }
        .footer { text-align: center; font-size: 7px; color: #94a3b8; margin-top: 12px; }
        @media print { .print-btn { display: none; } }
      </style>
    </head><body>
      <div class="header"><div><h1>HABICO</h1><p class="sub">Property Managers · Kampala, Uganda</p></div><div class="badge">Tenant List</div></div>
      <p class="filter-info">Property: <strong>${propFilterLabel}</strong> &nbsp;|&nbsp; Status: <strong>${statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</strong> &nbsp;|&nbsp; Generated: ${fmt(new Date().toISOString().split("T")[0])} &nbsp;|&nbsp; Total: <strong>${list.length} tenant${list.length === 1 ? "" : "s"}</strong></p>
      <table><thead><tr>
        <th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Gender</th><th>Status</th><th>Property</th><th>Unit</th><th>Rent/Mo</th><th>Balance</th><th>ID Type</th><th>ID Number</th>
      </tr></thead><tbody>
        ${list.map((t: any, i: number) => {
          const rent = t.lease ? Number(t.lease.monthly_rent).toLocaleString() : "—";
          const bal = t.lease && Number(t.lease.outstanding_balance) > 0 ? "UGX " + Number(t.lease.outstanding_balance).toLocaleString() : "—";
          const prop = t.lease?.units?.properties?.name || "—";
          const unit = t.lease?.units?.unit_number || "—";
          const statusClass = t.status === "active" ? "badge-active" : t.status === "blacklisted" ? "badge-blacklisted" : "badge-inactive";
          return `<tr>
            <td>${i + 1}</td>
            <td style="font-weight:600">${t.full_name || "—"}</td>
            <td>${t.phone || "—"}</td>
            <td>${t.email || "—"}</td>
            <td>${t.gender ? t.gender.charAt(0).toUpperCase() + t.gender.slice(1) : "—"}</td>
            <td><span class="badge-status ${statusClass}">${(t.status || "active").charAt(0).toUpperCase() + (t.status || "active").slice(1)}</span></td>
            <td>${prop}</td>
            <td>${unit}</td>
            <td class="text-right">${rent}</td>
            <td class="text-right">${bal}</td>
            <td>${t.id_type ? t.id_type.replace(/_/g, " ").replace(/\b\w/g, (c: any) => c.toUpperCase()) : "—"}</td>
            <td>${t.id_number || "—"}</td>
          </tr>`;
        }).join("")}
      </tbody></table>
      <div class="footer">Habico Property Managers — Basiima Building, 2nd Floor Room C03, Kampala · 0756742220 | 0702239607</div>
      <button class="print-btn" onclick="window.print()" style="display:block;margin:16px auto;padding:8px 24px;background:#1e293b;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer">Print</button>
    </body></html>`);
    win.document.close();
  }

  const dialogForm = (
    <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="lease">Property / Unit</TabsTrigger>
        <TabsTrigger value="emergency">Emergency</TabsTrigger>
        <TabsTrigger value="employment">Employment</TabsTrigger>
        <TabsTrigger value="portal">Portal Access</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Mukasa" />
          <p className="mt-1 text-xs text-muted-foreground">Legal full name as it appears on identification documents.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +256 700 123456" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tenant@example.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id_type">ID Type *</Label>
            <SearchableSelect
              value={form.id_type}
              onValueChange={(v) => setForm({ ...form, id_type: v })}
              placeholder="Select ID type"
              options={ID_TYPE_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_number">ID Number *</Label>
            <Input id="id_number" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="e.g. CM12345678" />
            <p className="mt-1 text-xs text-muted-foreground">Government-issued identification number.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <SearchableSelect
            value={form.gender}
            onValueChange={(v) => setForm({ ...form, gender: v })}
            placeholder="Select gender"
            options={GENDER_OPTIONS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <SearchableSelect
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v })}
            placeholder="Select status"
            options={STATUS_OPTIONS}
          />
          <p className="mt-1 text-xs text-muted-foreground">Active tenants can be assigned leases. Blacklisted tenants cannot rent properties.</p>
        </div>
      </TabsContent>

      <TabsContent value="lease" className="space-y-4 pt-4">
        <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          Select a property and unit to automatically create an active lease for this tenant.
          The tenant will be linked to the selected unit with standard payment terms.
        </div>
        <div className="space-y-2">
          <Label>Property</Label>
          <select
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
            value={formPropertyId}
            onChange={(e) => {
              setFormPropertyId(e.target.value);
              setForm({ ...form, property_id: e.target.value, unit_id: "" });
            }}
          >
            <option value="">— Select property —</option>
            {properties.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.location ? `— ${p.location}` : ""}
              </option>
            ))}
          </select>
        </div>

        {formPropertyId && (
          <div className="space-y-2">
            <Label>Unit</Label>
            {propertyUnits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No units found for this property.</p>
            ) : (
              <div className="grid gap-2">
                {propertyUnits
                  .map((u: any) => {
                    const isSelected = form.unit_id === u.id;
                    return (
                      <label
                        key={u.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition hover:bg-accent/10 ${
                          isSelected ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-input"
                        }`}
                        onClick={() => {
                          setForm({ ...form, property_id: formPropertyId, unit_id: isSelected ? "" : u.id });
                        }}
                      >
                        <input
                          type="radio"
                          name="unit"
                          className="h-4 w-4 accent-accent"
                          checked={isSelected}
                          readOnly
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            <Home className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />
                            Unit {u.unit_number}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {u.floor_number != null && (
                              <span className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                Floor {u.floor_number}
                              </span>
                            )}
                            {u.bedrooms != null && <span>{u.bedrooms} bed</span>}
                            {u.bathrooms != null && <span>{u.bathrooms} bath</span>}
                            <span>UGX {Number(u.monthly_rent).toLocaleString()}/mo</span>
                          </div>
                        </div>
                        <Badge variant={u.status === "vacant" ? "outline" : "default"} className="text-xs">
                          {u.status}
                        </Badge>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {form.unit_id && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-800 dark:text-green-300">
            <Check className="mr-1 inline h-3.5 w-3.5" />
            A lease will be created with this unit. Start date: today, Deposit: 1 month, Due day: 25th.
          </div>
        )}
      </TabsContent>

      <TabsContent value="emergency" className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
            <Input id="emergency_contact_name" value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="e.g. Sarah Mukasa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
            <Input id="emergency_contact_phone" value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="e.g. +256 700 654321" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="previous_address">Previous Address</Label>
          <Textarea id="previous_address" rows={3} value={form.previous_address} onChange={(e) => setForm({ ...form, previous_address: e.target.value })} placeholder="e.g. Plot 10, Kololo, Kampala" />
          <p className="mt-1 text-xs text-muted-foreground">Tenant's previous place of residence for reference.</p>
        </div>
      </TabsContent>

      <TabsContent value="employment" className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="e.g. Software Engineer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employer">Employer</Label>
            <Input id="employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} placeholder="e.g. ABC Company Ltd" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_income">Monthly Income (UGX)</Label>
          <Input id="monthly_income" type="number" min={0} value={form.monthly_income} onChange={(e) => setForm({ ...form, monthly_income: Number(e.target.value) })} placeholder="e.g. 3000000" />
          <p className="mt-1 text-xs text-muted-foreground">Used for affordability assessment. Should be at least 2.5× the monthly rent.</p>
        </div>
      </TabsContent>

      <TabsContent value="portal" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="access_pin">Access PIN (4-digit)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="access_pin"
                type={pinVisible ? "text" : "password"}
                maxLength={4}
                value={form.access_pin}
                onChange={(e) => setForm({ ...form, access_pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="0000"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setPinVisible(!pinVisible)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {pinVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="button" variant="outline" onClick={generatePin}>
              <Key className="mr-2 h-4 w-4" /> Generate
            </Button>
            <Button type="button" variant="outline" onClick={copyPin} disabled={!form.access_pin}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Used for tenant portal login. Must be a 4-digit number. Share securely with the tenant.</p>
        </div>
      </TabsContent>

      <div className="mt-4 space-y-2">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional remarks, special considerations, or details about the tenant…" />
        <p className="mt-1 text-xs text-muted-foreground">Notes visible only to staff. Not shared with the tenant.</p>
      </div>
    </Tabs>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/tenants" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">People</div>
          <h1 className="display text-3xl font-bold">Tenants</h1>
        </div>
        <div className="flex items-center gap-2">
        {tenants.length > 0 && (
          <Button variant="outline" onClick={printTenantList}>
            <Printer className="mr-2 h-4 w-4" />Print List
          </Button>
        )}
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Tenant</DialogTitle>
            </DialogHeader>
            {dialogForm}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{blacklistedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          className="h-9 rounded-full border border-input bg-background px-3 text-sm"
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
        >
          <option value="">All Properties</option>
          {properties.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}{p.location ? ` — ${p.location}` : ""}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-full border border-input bg-background px-3 text-sm"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="">All Genders</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <Input
          placeholder="Filter by area..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-9 w-40 rounded-full"
        />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({total})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveCount})</TabsTrigger>
          <TabsTrigger value="blacklisted">Blacklisted ({blacklistedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <GridDataCards
        data={displayed}
        fields={fields}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage={search || statusFilter !== "all" ? "No matching tenants" : "No tenants yet"}
        emptyIcon={<Users className="h-10 w-10 text-muted-foreground" />}
        actions={(t) => (
          <div className="flex w-full flex-wrap items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => printDossier(t)}>
                <FileText className="h-4 w-4 mr-1" /> Dossier
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              {t.phone && (
                <Button variant="ghost" size="sm" onClick={() => {
                  const msg = `Hi ${t.full_name ?? "Tenant"}, this is Habico Property Managers. This is a reminder for your rent at ${t.lease?.units?.properties?.name ?? ""} - Unit ${t.lease?.units?.unit_number ?? ""}. ${Number(t.lease?.outstanding_balance) > 0 ? `Your outstanding balance is UGX ${Number(t.lease?.outstanding_balance).toLocaleString()}. ` : ""}Please pay at your earliest convenience. Thank you.`;
                  window.open(`https://wa.me/${t.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                }}>
                  <MessageSquare className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              )}
              {t.email && t.lease && (
                <Button variant="ghost" size="sm" onClick={async () => {
                  try {
                    const r = await sendReminder({
                      to: t.email,
                      tenantName: t.full_name ?? "Tenant",
                      propertyName: t.lease?.units?.properties?.name ?? "Property",
                      unitNumber: t.lease?.units?.unit_number ?? "",
                      monthlyRent: Number(t.lease?.monthly_rent ?? 0),
                      dueDate: "25th of the month",
                      balance: Number(t.lease?.outstanding_balance ?? 0),
                      whatsappLink: t.phone ? `https://wa.me/${t.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Habico, I'm checking on my rent payment.")}` : "https://wa.me/256702239607",
                    });
                    if (r.success) toast.success("Reminder sent to tenant");
                    else toast.error(r.error ?? "Failed to send reminder");
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}>
                  <Mail className="h-4 w-4 mr-1" /> Remind
                </Button>
              )}
            </div>
            {t.status === "blacklisted" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => statusMutation.mutate({ id: t.id, status: "active" })}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Reactivate
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => statusMutation.mutate({ id: t.id, status: "blacklisted" })}
              >
                <ShieldAlert className="h-4 w-4 mr-1" /> Blacklist
              </Button>
            )}
          </div>
        )}
      />

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setSelectedTenant(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          {dialogForm}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setEditOpen(false); setSelectedTenant(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
