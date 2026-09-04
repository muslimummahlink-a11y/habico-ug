// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — Habico Portal" }] }),
  component: SuppliersPage,
});

const statusOptions = ["active", "inactive", "blacklisted"];

function SuppliersPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const blankForm = {
    name: "", contact_person: "", phone: "", email: "", address: "",
    category: "materials", payment_terms: "", tax_id: "", notes: "", status: "active",
  };
  const [form, setForm] = useState(blankForm);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => { setEditing(null); setForm(blankForm); };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name ?? "",
      contact_person: s.contact_person ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      category: s.category ?? "materials",
      payment_terms: s.payment_terms ?? "",
      tax_id: s.tax_id ?? "",
      notes: s.notes ?? "",
      status: s.status ?? "active",
    });
    setOpen(true);
  };

  const upsert = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("suppliers").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Supplier updated" : "Supplier created");
      setOpen(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Supplier deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("suppliers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const cfg = workflowConfigs.suppliers;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/suppliers" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Procurement</div>
          <h1 className="display text-3xl font-bold">Suppliers</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <EntityCardGrid
        data={suppliers}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["name", "contact_person", "phone", "email"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="category"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Add Supplier"
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
                <AlertDialogHeader><AlertDialogTitle>Delete supplier?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteSupplier.mutate(item.id)} disabled={deleteSupplier.isPending}>
                    {deleteSupplier.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit supplier" : "New supplier"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Company Info</h3></div>
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company or supplier name" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Contact person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Primary contact name" /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +256 700 000 000" /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="supplier@example.com" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Address & Details</h3></div>
              <div className="space-y-3">
                <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Physical or postal address" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <SearchableSelect
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                      placeholder="Select category"
                      options={[
                        { value: "materials", label: "Materials" },
                        { value: "equipment", label: "Equipment" },
                        { value: "services", label: "Services" },
                        { value: "transport", label: "Transport" }
                      ]}
                    />
                  </div>
                  <div><Label>Payment terms</Label><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} placeholder="e.g. Net 30" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tax ID</Label><Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="Tax registration number" /></div>
                  <div className="flex items-end gap-3 pb-1.5">
                    <div className="flex-1"><Label>Status</Label></div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Inactive</span>
                      <Switch checked={form.status === "active"} onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about the supplier" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => upsert.mutate()} disabled={!form.name || upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
