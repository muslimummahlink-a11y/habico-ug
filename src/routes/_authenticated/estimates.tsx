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
import { Plus, FileText, TrendingUp, Clock, Loader2, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";
import { BRAND, PDF_MARGIN, CONTENT_WIDTH, hexToRgb, loadLogo, headerBand, footerBand } from "@/lib/pdf-brand";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_authenticated/estimates")({
  head: () => ({ meta: [{ title: "Estimates — Habico Portal" }] }),
  component: EstimatesPage,
});

const statusOptions = ["draft", "pending", "approved", "rejected"];

function EstimatesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", lead_id: "", estimate_number: "", title: "", description: "",
    status: "draft", subtotal: "", tax_rate: "", tax_amount: "", total_amount: "",
    valid_until: "", notes: "",
  });
  const [items, setItems] = useState<any[]>([]);

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("estimates").select("*, estimate_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const resetForm = () => {
    setForm({
      project_id: "", lead_id: "", estimate_number: "", title: "", description: "",
      status: "draft", subtotal: "", tax_rate: "", tax_amount: "", total_amount: "",
      valid_until: "", notes: "",
    });
    setItems([]);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", lead_id: p.lead_id ?? "", estimate_number: p.estimate_number ?? "",
      title: p.title ?? "", description: p.description ?? "", status: p.status ?? "draft",
      subtotal: p.subtotal != null ? String(p.subtotal) : "",
      tax_rate: p.tax_rate != null ? String(p.tax_rate) : "",
      tax_amount: p.tax_amount != null ? String(p.tax_amount) : "",
      total_amount: p.total_amount != null ? String(p.total_amount) : "",
      valid_until: p.valid_until ?? "", notes: p.notes ?? "",
    });
    setItems(p.estimate_items ?? []);
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

  const create = useMutation({
    mutationFn: async () => {
      const { data: est, error } = await supabase.from("estimates").insert({
        project_id: form.project_id || null, lead_id: form.lead_id || null,
        estimate_number: form.estimate_number || null, title: form.title, description: form.description || null,
        status: form.status, subtotal: form.subtotal ? Number(form.subtotal) : 0,
        tax_rate: form.tax_rate ? Number(form.tax_rate) : 0,
        tax_amount: form.tax_amount ? Number(form.tax_amount) : 0,
        total_amount: form.total_amount ? Number(form.total_amount) : 0,
        valid_until: form.valid_until || null, notes: form.notes || null,
      }).select("id").single();
      if (error) throw error;
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("estimate_items").insert(
          items.map((it) => ({ estimate_id: est.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, amount: it.amount }))
        );
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => { toast.success("Estimate created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["estimates"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("estimates").update({
        project_id: form.project_id || null, lead_id: form.lead_id || null,
        estimate_number: form.estimate_number || null, title: form.title, description: form.description || null,
        status: form.status, subtotal: form.subtotal ? Number(form.subtotal) : 0,
        tax_rate: form.tax_rate ? Number(form.tax_rate) : 0,
        tax_amount: form.tax_amount ? Number(form.tax_amount) : 0,
        total_amount: form.total_amount ? Number(form.total_amount) : 0,
        valid_until: form.valid_until || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
      await supabase.from("estimate_items").delete().eq("estimate_id", editing.id);
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("estimate_items").insert(
          items.map((it) => ({ estimate_id: editing.id, description: it.description, quantity: it.quantity, unit_price: it.unit_price, amount: it.amount }))
        );
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => { toast.success("Estimate updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["estimates"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteEstimate = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("estimate_items").delete().eq("estimate_id", id);
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Estimate deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["estimates"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalEstimates = estimates.length;
  const approvedTotal = estimates.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0);
  const pendingEstimates = estimates.filter((p: any) => p.status === "pending").length;
  const approvalRate = estimates.length > 0 ? Math.round((estimates.filter((p: any) => p.status === "approved").length / estimates.length) * 100) : 0;

  const cfg = workflowConfigs.estimates;

  async function handlePrintEstimate(item: any) {
    try {
      const logoDataUrl = await loadLogo();
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      headerBand(pdf, pageW, logoDataUrl);
      let y = 48;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.primary));
      pdf.text("ESTIMATE", pageW / 2, y, { align: "center" });
      y += 3;
      pdf.setDrawColor(...hexToRgb(BRAND.accent));
      pdf.setLineWidth(0.8);
      pdf.line(pageW / 2 - 20, y, pageW / 2 + 20, y);
      y += 10;

      // Estimate number + status
      pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
      pdf.roundedRect(PDF_MARGIN, y - 6, 65, 10, 2, 2, "F");
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text("ESTIMATE #", PDF_MARGIN + 5, y - 1);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
      pdf.text(item.estimate_number || "—", PDF_MARGIN + 5, y + 4);
      const sc = item.status === "approved" ? BRAND.success : item.status === "rejected" ? BRAND.danger : BRAND.accent;
      const statusW = pdf.getTextWidth((item.status || "draft").toUpperCase()) + 10;
      pdf.setFillColor(...hexToRgb(sc));
      pdf.roundedRect(pageW - PDF_MARGIN - statusW, y - 4, statusW, 8, 2, 2, "F");
      pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text((item.status || "draft").toUpperCase(), pageW - PDF_MARGIN - statusW / 2, y + 1, { align: "center" });
      y += 14;

      // Details
      pdf.setFillColor(...hexToRgb(BRAND.white));
      pdf.setDrawColor(...hexToRgb(BRAND.border));
      pdf.roundedRect(PDF_MARGIN, y, CONTENT_WIDTH, 28, 2, 2, "FD");
      let dy = y + 8;
      function fld(lx: number, label: string, val: string) {
        pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text(label.toUpperCase(), lx, dy);
        pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.text));
        pdf.text(val || "—", lx, dy + 4);
      }
      fld(PDF_MARGIN + 6, "Estimate", item.estimate_number || "—");
      fld(PDF_MARGIN + CONTENT_WIDTH / 2 + 6, "Valid Until", item.valid_until ? new Date(item.valid_until).toLocaleDateString("en-GB") : "—");
      dy += 12;
      fld(PDF_MARGIN + 6, "Title", (item.title || "—").slice(0, 40));
      fld(PDF_MARGIN + CONTENT_WIDTH / 2 + 6, "Total", `UGX ${Number(item.total_amount || 0).toLocaleString()}`);
      y += 36;

      // Line items table
      const lineItems = item.estimate_items ?? [];
      if (lineItems.length > 0) {
        pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text("LINE ITEMS", PDF_MARGIN, y); y += 5;

        // Table header
        pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
        pdf.rect(PDF_MARGIN, y - 4, CONTENT_WIDTH, 6, "F");
        pdf.setFontSize(6); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexToRgb(BRAND.white));
        pdf.text("DESCRIPTION", PDF_MARGIN + 3, y);
        pdf.text("QTY", PDF_MARGIN + 100, y);
        pdf.text("UNIT PRICE", PDF_MARGIN + 120, y);
        pdf.text("AMOUNT", PDF_MARGIN + 155, y);
        y += 6;

        // Table rows
        pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.text));
        for (const li of lineItems) {
          if (y > pageH - 40) { pdf.addPage(); y = 20; }
          pdf.setFontSize(7);
          pdf.text((li.description || "—").slice(0, 45), PDF_MARGIN + 3, y);
          pdf.text(String(li.quantity ?? ""), PDF_MARGIN + 100, y);
          pdf.text(`UGX ${Number(li.unit_price || 0).toLocaleString()}`, PDF_MARGIN + 120, y);
          pdf.text(`UGX ${Number(li.amount || 0).toLocaleString()}`, PDF_MARGIN + 155, y);
          y += 5;
          pdf.setDrawColor(...hexToRgb(BRAND.border)); pdf.setLineWidth(0.1);
          pdf.line(PDF_MARGIN, y - 2, PDF_MARGIN + CONTENT_WIDTH, y - 2);
        }
        y += 4;
      }

      // Financial summary
      pdf.setFillColor(...hexToRgb(BRAND.white));
      pdf.setDrawColor(...hexToRgb(BRAND.border));
      pdf.roundedRect(PDF_MARGIN + CONTENT_WIDTH - 60, y, 60, 28, 2, 2, "FD");
      let sy = y + 7;
      function summaryLine(label: string, val: string, bold = false) {
        pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text(label, PDF_MARGIN + CONTENT_WIDTH - 57, sy);
        pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setTextColor(...hexToRgb(BRAND.text));
        pdf.text(val, PDF_MARGIN + CONTENT_WIDTH - 5, sy, { align: "right" });
        sy += 6;
      }
      summaryLine("Subtotal", `UGX ${Number(item.subtotal || 0).toLocaleString()}`);
      summaryLine(`Tax (${item.tax_rate || 0}%)`, `UGX ${Number(item.tax_amount || 0).toLocaleString()}`);
      summaryLine("Total", `UGX ${Number(item.total_amount || 0).toLocaleString()}`, true);
      y += 36;

      // Amount box
      const amountStr = `UGX ${Number(item.total_amount || 0).toLocaleString()}`;
      const boxW = 80; const boxX = (pageW - boxW) / 2;
      pdf.setFillColor(...hexToRgb(BRAND.accent));
      pdf.roundedRect(boxX, y, boxW, 16, 3, 3, "F");
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text("ESTIMATED TOTAL", boxX + boxW / 2, y + 5, { align: "center" });
      pdf.setFontSize(13); pdf.setFont("helvetica", "bold");
      pdf.text(amountStr, boxX + boxW / 2, y + 12, { align: "center" });
      y += 24;

      // Signature
      const sigW = 55;
      pdf.setDrawColor(...hexToRgb(BRAND.text)); pdf.setLineWidth(0.3);
      pdf.line(PDF_MARGIN, y, PDF_MARGIN + sigW, y);
      pdf.line(PDF_MARGIN + CONTENT_WIDTH - sigW, y, PDF_MARGIN + CONTENT_WIDTH, y);
      y += 4;
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text("Prepared By (Signature & Date)", PDF_MARGIN, y);
      pdf.text("Approved By (Signature & Date)", PDF_MARGIN + CONTENT_WIDTH - sigW, y);

      footerBand(pdf, pageW, pageH);
      pdf.save(`estimate-${item.estimate_number || "doc"}.pdf`);
      toast.success("Estimate PDF downloaded");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/estimates" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Preconstruction</div>
          <h1 className="display text-3xl font-bold">Estimates</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Estimates</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalEstimates}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Approved Total</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {approvedTotal.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingEstimates}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Approval Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{approvalRate}%</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={estimates}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "estimate_number", "description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="estimate_number"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Estimate"
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
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handlePrintEstimate(item)}>
              <Printer className="mr-1 h-3 w-3" /> Print
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
                <AlertDialogHeader><AlertDialogTitle>Delete estimate?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteEstimate.mutate(item.id)} disabled={deleteEstimate.isPending}>
                    {deleteEstimate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit estimate" : "Create an estimate"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Estimate Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
                <div><Label>Lead ID</Label><Input value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} placeholder="Associated lead ID" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Estimate number <span className="text-destructive">*</span></Label><Input value={form.estimate_number} onChange={(e) => setForm({ ...form, estimate_number: e.target.value })} placeholder="e.g. EST-001" /></div>
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
              </div>
              <div className="mt-3"><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Estimate title or scope summary" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the estimate" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial Details</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subtotal (UGX)</Label><Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} placeholder="Total before tax" /></div>
                <div><Label>Tax rate (%)</Label><Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} placeholder="e.g. 18" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Tax amount (UGX)</Label><Input type="number" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} placeholder="Calculated tax amount" /></div>
                <div><Label>Total (UGX)</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="Grand total including tax" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Validity &amp; Notes</h3></div>
              <div><Label>Valid until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes or terms" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Line Items</h3></div>
              <div className="space-y-2">
                {items.length === 0 && <p className="text-xs text-muted-foreground">No line items added yet. Click "Add item" to include estimate line items.</p>}
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
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.title || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
