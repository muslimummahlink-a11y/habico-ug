// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Package, Monitor, Sofa, Wrench, HardDrive, Building2, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({ meta: [{ title: "Assets — Habico Portal" }] }),
  component: AssetsPage,
});

const categories = ["electronics", "furniture", "appliance", "vehicle", "equipment", "other"];
const conditions = ["new", "good", "fair", "poor"];
const statuses = ["active", "maintenance", "disposed", "stored"];

const categoryLabels: Record<string, string> = {
  electronics: "Electronics",
  furniture: "Furniture",
  appliance: "Appliance",
  vehicle: "Vehicle",
  equipment: "Equipment",
  other: "Other",
};

function AssetsPage() {
  const { user } = useAuth();
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "other",
    status: "active",
    condition: "good",
    purchase_value: "0",
    current_value: "0",
    purchase_date: "",
    serial_number: "",
    assigned_to: "",
    notes: "",
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, employees(full_name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-pick"], enabled: isStaff,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
      return data ?? [];
    },
  });

  const resetForm = () => {
    setForm({
      name: "", category: "other", status: "active", condition: "good",
      purchase_value: "0", current_value: "0", purchase_date: "",
      serial_number: "", assigned_to: "", notes: "",
    });
    setEditId(null);
  };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({
      name: a.name ?? "",
      category: a.category ?? "other",
      status: a.status ?? "active",
      condition: a.condition ?? "good",
      purchase_value: String(a.purchase_value ?? "0"),
      current_value: String(a.current_value ?? "0"),
      purchase_date: a.purchase_date ?? "",
      serial_number: a.serial_number ?? "",
      assigned_to: a.assigned_to ?? "",
      notes: a.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        category: form.category,
        status: form.status,
        condition: form.condition,
        purchase_value: Number(form.purchase_value) || 0,
        current_value: Number(form.current_value) || 0,
        purchase_date: form.purchase_date || null,
        serial_number: form.serial_number || null,
        assigned_to: form.assigned_to || null,
        notes: form.notes || null,
      };
      if (editId) {
        const { error } = await supabase.from("assets").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("assets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Asset updated" : "Asset created");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Asset deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["assets"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalValue = assets.reduce((s: number, a: any) => s + Number(a.purchase_value ?? 0), 0);
  const bookValue = assets.reduce((s: number, a: any) => s + Number(a.current_value ?? 0), 0);
  const needsRepair = assets.filter((a: any) => a.condition === "poor" || a.status === "maintenance").length;

  const cfg = workflowConfigs.assets;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/assets" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Inventory</div>
          <h1 className="display text-3xl font-bold">Assets</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Book Value</CardTitle>
            <Sofa className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {bookValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Repair</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{needsRepair}</div>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={assets}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["name", "serial_number"]}
        filterField="status"
        filterOptions={statuses.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
        extraFilters={[{ label: "Condition", value: "", field: "condition" }]}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="category"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Add Asset"
        cardActions={(item) => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </>
        ) : undefined}
      />

      <Sheet open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editId ? "Edit asset" : "Add a new asset"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Asset Info</h3></div>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asset name" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <SearchableSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} placeholder="Select category" options={categories.map((c) => ({ value: c, label: categoryLabels[c] }))} />
                  </div>
                  <div>
                    <Label>Serial / ID #</Label>
                    <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="Serial number or asset ID" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Acquisition</h3></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Purchase date *</Label>
                    <Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Purchase value (UGX) *</Label>
                    <Input type="number" value={form.purchase_value} onChange={(e) => setForm({ ...form, purchase_value: e.target.value })} placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status & Location</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <SearchableSelect value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} placeholder="Select status" options={statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
                </div>
                <div>
                  <Label>Condition</Label>
                  <SearchableSelect value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })} placeholder="Select condition" options={conditions.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
                </div>
              </div>
              <div className="mt-3">
                <Label>Assigned to</Label>
                <SearchableSelect value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })} placeholder="Unassigned" options={[{ value: "", label: "Unassigned" }, ...employees.map((e: any) => ({ value: e.id, label: e.full_name ?? e.email }))]} />
              </div>
              <div className="mt-3">
                <Label>Current value (UGX)</Label>
                <Input type="number" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} placeholder="Depreciated value" />
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes or maintenance history" />
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Update" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
