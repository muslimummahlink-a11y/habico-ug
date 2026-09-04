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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Plus, FileText, DollarSign, Clock, Loader2, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadQuotationPdf } from "@/lib/generate-quotation-pdf";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({ meta: [{ title: "Quotations — Habico Portal" }] }),
  component: QuotationsPage,
});

const statusOptions = ["draft", "sent", "accepted", "rejected"];

function QuotationsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", lead_id: "", quotation_number: "", client_name: "", client_email: "",
    client_phone: "", title: "", description: "", status: "draft", subtotal: "", tax_rate: "",
    tax_amount: "", discount_amount: "", total_amount: "", valid_until: "", notes: "",
    terms_and_conditions: "",
  });
  const [items, setItems] = useState<any[]>([]);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotations").select("*, quotation_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const resetForm = () => {
    setForm({
      project_id: "", lead_id: "", quotation_number: "", client_name: "", client_email: "",
      client_phone: "", title: "", description: "", status: "draft", subtotal: "", tax_rate: "",
      tax_amount: "", discount_amount: "", total_amount: "", valid_until: "", notes: "",
      terms_and_conditions: "",
    });
    setItems([]);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", lead_id: p.lead_id ?? "", quotation_number: p.quotation_number ?? "",
      client_name: p.client_name ?? "", client_email: p.client_email ?? "", client_phone: p.client_phone ?? "",
      title: p.title ?? "", description: p.description ?? "", status: p.status ?? "draft",
      subtotal: p.subtotal != null ? String(p.subtotal) : "", tax_rate: p.tax_rate != null ? String(p.tax_rate) : "",
      tax_amount: p.tax_amount != null ? String(p.tax_amount) : "", discount_amount: p.discount_amount != null ? String(p.discount_amount) : "",
      total_amount: p.total_amount != null ? String(p.total_amount) : "", valid_until: p.valid_until ?? "",
      notes: p.notes ?? "", terms_and_conditions: p.terms_and_conditions ?? "",
    });
    setItems(p.quotation_items ?? []);
    setOpen(true);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const updateItem = (i: number, field: string, value: any) => {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      copy[i].amount = Number(copy[i].quantity) * Number(copy[i].unit_price);
    }
    setItems(copy);
  };

  const removeItem = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  const computeTotals = () => {
    const subtotal = items.reduce((s, it) => s + Number(it.amount || 0), 0);
    const taxRate = form.tax_rate ? Number(form.tax_rate) : 0;
    const discount = form.discount_amount ? Number(form.discount_amount) : 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;
    setForm((f) => ({
      ...f,
      subtotal: String(subtotal),
      tax_amount: String(taxAmount),
      total_amount: String(total),
    }));
  };

  const payload = () => ({
    project_id: form.project_id || null, lead_id: form.lead_id || null,
    quotation_number: form.quotation_number || null, client_name: form.client_name,
    client_email: form.client_email || null, client_phone: form.client_phone || null,
    title: form.title, description: form.description || null,
    status: form.status, subtotal: form.subtotal ? Number(form.subtotal) : 0,
    tax_rate: form.tax_rate ? Number(form.tax_rate) : 0,
    tax_amount: form.tax_amount ? Number(form.tax_amount) : 0,
    discount_amount: form.discount_amount ? Number(form.discount_amount) : 0,
    total_amount: form.total_amount ? Number(form.total_amount) : 0,
    valid_until: form.valid_until || null, notes: form.notes || null,
    terms_and_conditions: form.terms_and_conditions || null,
  });

  const create = useMutation({
    mutationFn: async () => {
      computeTotals();
      const { data: q, error } = await supabase.from("quotations").insert(payload()).select("id").single();
      if (error) throw error;
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("quotation_items").insert(
          items.map((it) => ({ quotation_id: q.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, amount: it.amount }))
        );
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => { toast.success("Quotation created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["quotations"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      computeTotals();
      const { error } = await supabase.from("quotations").update(payload()).eq("id", editing.id);
      if (error) throw error;
      await supabase.from("quotation_items").delete().eq("quotation_id", editing.id);
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("quotation_items").insert(
          items.map((it) => ({ quotation_id: editing.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, amount: it.amount }))
        );
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => { toast.success("Quotation updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["quotations"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteQuotation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("quotation_items").delete().eq("quotation_id", id);
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Quotation deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["quotations"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleDownloadPdf = async (q: any) => {
    await downloadQuotationPdf({
      quotation_number: q.quotation_number ?? "DRAFT",
      client_name: q.client_name,
      client_email: q.client_email,
      client_phone: q.client_phone,
      title: q.title,
      description: q.description,
      status: q.status,
      subtotal: Number(q.subtotal || 0),
      tax_rate: Number(q.tax_rate || 0),
      tax_amount: Number(q.tax_amount || 0),
      discount_amount: Number(q.discount_amount || 0),
      total_amount: Number(q.total_amount || 0),
      valid_until: q.valid_until,
      notes: q.notes,
      terms_and_conditions: q.terms_and_conditions,
      items: (q.quotation_items ?? []).map((it: any) => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        amount: Number(it.amount),
      })),
      created_at: q.created_at,
    });
  };

  const totalQuotations = quotations.length;
  const acceptedTotal = quotations.filter((q: any) => q.status === "accepted").reduce((s: number, q: any) => s + Number(q.total_amount || 0), 0);
  const pendingQuotations = quotations.filter((q: any) => q.status === "sent" || q.status === "draft").length;
  const acceptanceRate = quotations.length > 0 ? Math.round((quotations.filter((q: any) => q.status === "accepted").length / quotations.length) * 100) : 0;

  const cfg = workflowConfigs.quotations;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/quotations" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Preconstruction</div>
          <h1 className="display text-3xl font-bold">Quotations</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Quotations</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalQuotations}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Accepted Total</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {acceptedTotal.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending / Draft</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingQuotations}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{acceptanceRate}%</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={quotations}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "quotation_number", "client_name", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="quotation_number"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Quotation"
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
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDownloadPdf(item)} title="Download PDF">
              <Download className="mr-1 h-3 w-3" /> PDF
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
            <AlertDialog open={deleteId === item.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete quotation?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteQuotation.mutate(item.id)} disabled={deleteQuotation.isPending}>
                    {deleteQuotation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit quotation" : "Create a quotation"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Client Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client name <span className="text-destructive">*</span></Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Client or company name" /></div>
                <div><Label>Quotation #</Label><Input value={form.quotation_number} onChange={(e) => setForm({ ...form, quotation_number: e.target.value })} placeholder="e.g. QT-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Client email</Label><Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="client@example.com" /></div>
                <div><Label>Client phone</Label><Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="+256..." /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Quotation Details</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s }))}
                  />
                </div>
              </div>
              <div className="mt-3"><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Quotation title or scope summary" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the work" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial Details</h3></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Discount (UGX)</Label><Input type="number" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} placeholder="0" /></div>
                <div><Label>Tax rate (%)</Label><Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} placeholder="e.g. 18" /></div>
                <div><Label>Valid until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div><Label>Subtotal (UGX)</Label><Input type="number" value={form.subtotal} readOnly className="bg-muted" /></div>
                <div><Label>Tax amount (UGX)</Label><Input type="number" value={form.tax_amount} readOnly className="bg-muted" /></div>
                <div><Label>Total (UGX)</Label><Input type="number" value={form.total_amount} readOnly className="bg-muted font-bold" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Line Items</h3></div>
              <div className="space-y-2">
                {items.length === 0 && <p className="text-xs text-muted-foreground">No line items added yet.</p>}
                {items.map((item, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-md border p-2">
                    <div className="flex-1">
                      <Label className="text-xs">Description</Label>
                      <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Unit price</Label>
                      <Input type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} />
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Amount</Label>
                      <Input type="number" value={item.amount} readOnly className="bg-muted" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add item</Button>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes &amp; Terms</h3></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes" /></div>
              <div className="mt-3"><Label>Terms &amp; Conditions</Label><Textarea rows={3} value={form.terms_and_conditions} onChange={(e) => setForm({ ...form, terms_and_conditions: e.target.value })} placeholder="Payment terms, warranty, validity..." /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => { computeTotals(); (editing ? update : create).mutate(); }} disabled={!form.title || !form.client_name || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
