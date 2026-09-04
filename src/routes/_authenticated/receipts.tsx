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
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Receipt, TrendingUp, Loader2, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";
import { BRAND, PDF_MARGIN, CONTENT_WIDTH, hexToRgb, loadLogo, headerBand, footerBand } from "@/lib/pdf-brand";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_authenticated/receipts")({
  head: () => ({ meta: [{ title: "Receipts — Habico Portal" }] }),
  component: ReceiptsPage,
});

function ReceiptsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    expense_id: "", project_id: "", receipt_number: "", vendor: "",
    amount: "0", receipt_date: "", image_url: "", notes: "",
  });

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    expense_id: "", project_id: "", receipt_number: "", vendor: "",
    amount: "0", receipt_date: "", image_url: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      expense_id: p.expense_id ?? "", project_id: p.project_id ?? "",
      receipt_number: p.receipt_number ?? "", vendor: p.vendor ?? "",
      amount: String(p.amount ?? "0"), receipt_date: p.receipt_date ?? "",
      image_url: p.image_url ?? "", notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("receipts").insert({
        expense_id: form.expense_id || null, project_id: form.project_id || null,
        receipt_number: form.receipt_number || null, vendor: form.vendor || null,
        amount: Number(form.amount), receipt_date: form.receipt_date || null,
        image_url: form.image_url || null, notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Receipt created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["receipts"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("receipts").update({
        expense_id: form.expense_id || null, project_id: form.project_id || null,
        receipt_number: form.receipt_number || null, vendor: form.vendor || null,
        amount: Number(form.amount), receipt_date: form.receipt_date || null,
        image_url: form.image_url || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Receipt updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["receipts"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteReceipt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receipts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Receipt deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["receipts"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const averageReceipt = totalReceipts > 0 ? totalAmount / totalReceipts : 0;

  const cfg = workflowConfigs.receipts;

  async function handlePrintReceipt(item: any) {
    try {
      const logoDataUrl = await loadLogo();
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      drawWatermark(pdf, pageW, pageH, logoDataUrl);
      headerBand(pdf, pageW, logoDataUrl);

      let y = 48;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.primary));
      pdf.text("RECEIPT", pageW / 2, y, { align: "center" });
      y += 3;
      pdf.setDrawColor(...hexToRgb(BRAND.accent));
      pdf.setLineWidth(0.8);
      pdf.line(pageW / 2 - 20, y, pageW / 2 + 20, y);
      y += 10;

      // Receipt number badge
      pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
      pdf.roundedRect(PDF_MARGIN, y - 6, 65, 10, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text("RECEIPT #", PDF_MARGIN + 5, y - 1);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(item.receipt_number || "—", PDF_MARGIN + 5, y + 4);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text(item.receipt_date ? new Date(item.receipt_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—", pageW - PDF_MARGIN, y + 2, { align: "right" });
      y += 16;

      // Details card
      pdf.setFillColor(...hexToRgb(BRAND.white));
      pdf.setDrawColor(...hexToRgb(BRAND.border));
      pdf.setLineWidth(0.4);
      pdf.roundedRect(PDF_MARGIN, y, CONTENT_WIDTH, 40, 2, 2, "FD");

      const leftX = PDF_MARGIN + 6;
      const rightX = PDF_MARGIN + CONTENT_WIDTH / 2 + 6;
      let dy = y + 10;

      function field(lx: number, label: string, value: string) {
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text(label.toUpperCase(), lx, dy);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...hexToRgb(BRAND.text));
        pdf.text(value || "—", lx, dy + 4);
      }

      field(leftX, "Receipt No.", item.receipt_number || "—");
      field(rightX, "Date", item.receipt_date ? new Date(item.receipt_date).toLocaleDateString("en-GB") : "—");
      dy += 12;
      field(leftX, "Vendor / Supplier", item.vendor || "—");
      field(rightX, "Notes", (item.notes || "—").slice(0, 30));
      dy += 12;
      field(leftX, "Expense Ref", item.expense_id || "—");
      field(rightX, "Project Ref", item.project_id || "—");

      y += 48;

      // Amount highlight box
      const amountStr = `UGX ${Number(item.amount || 0).toLocaleString()}`;
      const boxW = 80;
      const boxX = (pageW - boxW) / 2;
      pdf.setFillColor(...hexToRgb(BRAND.accent));
      pdf.roundedRect(boxX, y, boxW, 16, 3, 3, "F");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text("AMOUNT PAID", boxX + boxW / 2, y + 5, { align: "center" });
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(amountStr, boxX + boxW / 2, y + 12, { align: "center" });

      y += 26;

      // Signature
      const sigW = 55;
      pdf.setDrawColor(...hexToRgb(BRAND.text));
      pdf.setLineWidth(0.3);
      pdf.line(PDF_MARGIN, y, PDF_MARGIN + sigW, y);
      pdf.line(PDF_MARGIN + CONTENT_WIDTH - sigW, y, PDF_MARGIN + CONTENT_WIDTH, y);
      y += 4;
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.textMuted));
      pdf.text("Received By (Signature & Date)", PDF_MARGIN, y);
      pdf.text("Authorized By (Signature & Date)", PDF_MARGIN + CONTENT_WIDTH - sigW, y);

      footerBand(pdf, pageW, pageH);

      const safeName = (item.vendor || item.receipt_number || "receipt").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      pdf.save(`receipt-${item.receipt_number || "doc"}-${safeName}.pdf`);
      toast.success("Receipt PDF downloaded");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function drawWatermark(pdf: any, pageW: number, pageH: number, logoDataUrl?: string | null) {
    if (!logoDataUrl) return;
    try {
      const wmSize = 70;
      pdf.addImage(logoDataUrl, "PNG", (pageW - wmSize) / 2, (pageH - wmSize) / 2, wmSize, wmSize);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/receipts" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Financial Management</div>
          <h1 className="display text-3xl font-bold">Receipts</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Receipts</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalReceipts}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Amount</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {totalAmount.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Avg per Receipt</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">UGX {Math.round(averageReceipt).toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={receipts}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["receipt_number", "vendor"]}
        keyExtractor={(item) => item.id}
        titleField="vendor_name"
        subtitleField="receipt_number"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Receipt"
        workflowButtons={() => []}
        cardActions={(item) => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handlePrintReceipt(item)}>
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
                <AlertDialogHeader><AlertDialogTitle>Delete receipt?</AlertDialogTitle><AlertDialogDescription>This will permanently delete receipt "{item.receipt_number}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteReceipt.mutate(item.id)} disabled={deleteReceipt.isPending}>
                    {deleteReceipt.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit receipt" : "Create a receipt"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Receipt Info</h3></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Receipt number *</Label><Input value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} placeholder="e.g. RCP-001" /></div>
                  <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Supplier or store name" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (UGX) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
                  <div><Label>Receipt date *</Label><Input type="date" value={form.receipt_date} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Reference</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Expense ID</Label><Input value={form.expense_id} onChange={(e) => setForm({ ...form, expense_id: e.target.value })} placeholder="Linked expense ID" /></div>
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Linked project ID" /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Image & Notes</h3></div>
              <div className="space-y-3">
                <FileUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Image" accept="image/*" maxSizeMB={5} />
                <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about this receipt" /></div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
