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
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, Users, UserCheck, Clock, FileText, Loader2, Pencil, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";
import { downloadStaffIdCardPdf, type StaffCardData } from "@/lib/generate-staff-id-pdf";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({ meta: [{ title: "Employees — Habico Portal" }] }),
  component: EmployeesPage,
});

const roleOptions = ["worker", "supervisor", "manager", "admin", "contractor"];
const typeOptions = ["full_time", "part_time", "contract", "casual"];
const statusOptions = ["active", "inactive"];

function EmployeesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", role: "worker", employee_type: "full_time",
    daily_rate: "0", monthly_salary: "0", bank_account: "", tax_id: "", national_id: "",
    emergency_contact: "", emergency_phone: "", hire_date: "", notes: "",
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    full_name: "", phone: "", email: "", role: "worker", employee_type: "full_time",
    daily_rate: "0", monthly_salary: "0", bank_account: "", tax_id: "", national_id: "",
    emergency_contact: "", emergency_phone: "", hire_date: "", notes: "",
  });

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      full_name: e.full_name ?? "", phone: e.phone ?? "", email: e.email ?? "",
      role: e.role ?? "worker", employee_type: e.employee_type ?? "full_time",
      daily_rate: String(e.daily_rate ?? "0"), monthly_salary: String(e.monthly_salary ?? "0"),
      bank_account: e.bank_account ?? "", tax_id: e.tax_id ?? "", national_id: e.national_id ?? "",
      emergency_contact: e.emergency_contact ?? "", emergency_phone: e.emergency_phone ?? "",
      hire_date: e.hire_date ?? "", notes: e.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employees").insert({
        full_name: form.full_name, phone: form.phone || null, email: form.email || null,
        role: form.role, employee_type: form.employee_type,
        daily_rate: Number(form.daily_rate), monthly_salary: Number(form.monthly_salary),
        bank_account: form.bank_account || null, tax_id: form.tax_id || null,
        national_id: form.national_id || null, emergency_contact: form.emergency_contact || null,
        emergency_phone: form.emergency_phone || null, hire_date: form.hire_date || null,
        notes: form.notes || null, status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Employee created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("employees").update({
        full_name: form.full_name, phone: form.phone || null, email: form.email || null,
        role: form.role, employee_type: form.employee_type,
        daily_rate: Number(form.daily_rate), monthly_salary: Number(form.monthly_salary),
        bank_account: form.bank_account || null, tax_id: form.tax_id || null,
        national_id: form.national_id || null, emergency_contact: form.emergency_contact || null,
        emergency_phone: form.emergency_phone || null, hire_date: form.hire_date || null,
        notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Employee updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Employee deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("employees").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e: any) => e.status === "active").length;
  const dailyWorkers = employees.filter((e: any) => e.employee_type === "casual" || e.employee_type === "part_time").length;
  const onContract = employees.filter((e: any) => e.employee_type === "contract").length;

  const cfg = workflowConfigs.employees;

  async function handleDownloadStaffId(item: any) {
    try {
      const empId = `HAB-${new Date().getFullYear()}-${String(item.id?.slice(0, 4) || "0000").replace(/[^0-9]/g, "").padStart(4, "0")}`;
      const cardData: StaffCardData = {
        fullName: item.full_name || "Unknown",
        jobTitle: item.role || "Staff",
        employeeId: empId,
        department: item.department || "General",
        bloodGroup: item.blood_group || "—",
        accessLevel: item.access_level || "Site & Office — All Zones",
        nationalId: item.national_id || "—",
        dateJoined: item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        issueDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        emergencyContact: item.emergency_contact || "—",
        emergencyPhone: item.emergency_phone || "—",
        reportingOffice: item.reporting_office || "Habico Head Office",
        photoDataUrl: null,
      };
      await downloadStaffIdCardPdf(cardData);
      toast.success("Staff ID card PDF downloaded");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/employees" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">People</div>
          <h1 className="display text-3xl font-bold">Employees</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Employees</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalEmployees}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active</CardTitle><UserCheck className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeEmployees}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Daily Workers</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{dailyWorkers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">On Contract</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{onContract}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={employees}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["full_name", "phone", "email"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="full_name"
        subtitleField="phone"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Add Employee"
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
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); handleDownloadStaffId(item); }}>
              <CreditCard className="mr-1 h-3 w-3" /> Staff ID
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); toggleStatus.mutate({ id: item.id, status: item.status === "active" ? "inactive" : "active" }); }}>
              <Switch checked={item.status === "active"} className="pointer-events-none scale-75" />
            </Button>
            <AlertDialog open={deleteId === item.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete employee?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.full_name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteEmployee.mutate(item.id)} disabled={deleteEmployee.isPending}>
                    {deleteEmployee.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit employee" : "Add an employee"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Personal Info</h3></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Full name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Enter full name" /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +256 700 000 000" /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="employee@example.com" /></div>
                <div><Label>National ID</Label><Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} placeholder="National identification number" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Employment</h3></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role *</Label>
                    <SearchableSelect
                      value={form.role}
                      onValueChange={(v) => setForm({ ...form, role: v })}
                      placeholder="Select role"
                      options={roleOptions.map((r) => ({ value: r, label: r.replace("_", " ") }))}
                    />
                  </div>
                  <div><Label>Type *</Label>
                    <SearchableSelect
                      value={form.employee_type}
                      onValueChange={(v) => setForm({ ...form, employee_type: v })}
                      placeholder="Select type"
                      options={typeOptions.map((t) => ({ value: t, label: t.replace("_", " ") }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Daily rate (UGX)</Label><Input type="number" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} placeholder="0" /></div>
                  <div><Label>Monthly salary (UGX)</Label><Input type="number" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Bank account</Label><Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} placeholder="Account number" /></div>
                  <div><Label>Tax ID</Label><Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="Tax identification number" /></div>
                </div>
                <div><Label>Hire date</Label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Emergency Contact</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Contact name</Label><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="Full name" /></div>
                <div><Label>Emergency phone</Label><Input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} placeholder="e.g. +256 700 000 000" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes or remarks" /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.full_name || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
