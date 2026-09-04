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
import { Plus, FileSpreadsheet, TrendingUp, TrendingDown, Loader2, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { BRAND, PDF_MARGIN, CONTENT_WIDTH, hexToRgb, loadLogo, headerBand, footerBand } from "@/lib/pdf-brand";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_authenticated/proposals")({
  head: () => ({ meta: [{ title: "Proposals — Habico Portal" }] }),
  component: ProposalsPage,
});

const statusOptions = ["draft", "sent", "reviewing", "accepted", "rejected"];

function ProposalsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", lead_id: "", estimate_id: "", proposal_number: "", title: "",
    content: "", status: "draft", total_amount: "", valid_until: "",
    sent_at: "", accepted_at: "", notes: "",
  });

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const resetForm = () => setForm({
    project_id: "", lead_id: "", estimate_id: "", proposal_number: "", title: "",
    content: "", status: "draft", total_amount: "", valid_until: "",
    sent_at: "", accepted_at: "", notes: "",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", lead_id: p.lead_id ?? "", estimate_id: p.estimate_id ?? "",
      proposal_number: p.proposal_number ?? "", title: p.title ?? "", content: p.content ?? "",
      status: p.status ?? "draft", total_amount: p.total_amount != null ? String(p.total_amount) : "",
      valid_until: p.valid_until ?? "", sent_at: p.sent_at ?? "", accepted_at: p.accepted_at ?? "",
      notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("proposals").insert({
        project_id: form.project_id || null, lead_id: form.lead_id || null, estimate_id: form.estimate_id || null,
        proposal_number: form.proposal_number || null, title: form.title, content: form.content || null,
        status: form.status, total_amount: form.total_amount ? Number(form.total_amount) : 0,
        valid_until: form.valid_until || null, sent_at: form.sent_at || null, accepted_at: form.accepted_at || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proposal created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["proposals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("proposals").update({
        project_id: form.project_id || null, lead_id: form.lead_id || null, estimate_id: form.estimate_id || null,
        proposal_number: form.proposal_number || null, title: form.title, content: form.content || null,
        status: form.status, total_amount: form.total_amount ? Number(form.total_amount) : 0,
        valid_until: form.valid_until || null, sent_at: form.sent_at || null, accepted_at: form.accepted_at || null,
        notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proposal updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["proposals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Proposal deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["proposals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter((p: any) => p.status === "accepted").length;
  const rejectedProposals = proposals.filter((p: any) => p.status === "rejected").length;
  const acceptanceRate = proposals.length > 0 ? Math.round((acceptedProposals / proposals.length) * 100) : 0;

  const cfg = workflowConfigs.proposals;

  async function handlePrintProposal(item: any) {
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
      pdf.text("PROPOSAL", pageW / 2, y, { align: "center" });
      y += 3;
      pdf.setDrawColor(...hexToRgb(BRAND.accent));
      pdf.setLineWidth(0.8);
      pdf.line(pageW / 2 - 20, y, pageW / 2 + 20, y);
      y += 10;

      // Proposal number + status
      pdf.setFillColor(...hexToRgb(BRAND.primaryLight));
      pdf.roundedRect(PDF_MARGIN, y - 6, 65, 10, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text("PROPOSAL #", PDF_MARGIN + 5, y - 1);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(item.proposal_number || "—", PDF_MARGIN + 5, y + 4);

      // Status badge
      const sc = item.status === "accepted" ? BRAND.success : item.status === "rejected" ? BRAND.danger : BRAND.accent;
      const statusW = pdf.getTextWidth((item.status || "draft").toUpperCase()) + 10;
      pdf.setFillColor(...hexToRgb(sc));
      pdf.roundedRect(pageW - PDF_MARGIN - statusW, y - 4, statusW, 8, 2, 2, "F");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text((item.status || "draft").toUpperCase(), pageW - PDF_MARGIN - statusW / 2, y + 1, { align: "center" });
      y += 14;

      // Details card
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
      fld(PDF_MARGIN + 6, "Proposal", item.proposal_number || "—");
      fld(PDF_MARGIN + CONTENT_WIDTH / 2 + 6, "Valid Until", item.valid_until ? new Date(item.valid_until).toLocaleDateString("en-GB") : "—");
      dy += 12;
      fld(PDF_MARGIN + 6, "Title", (item.title || "—").slice(0, 40));
      fld(PDF_MARGIN + CONTENT_WIDTH / 2 + 6, "Total", `UGX ${Number(item.total_amount || 0).toLocaleString()}`);
      y += 36;

      // Content
      if (item.content) {
        pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); pdf.setTextColor(...hexToRgb(BRAND.textMuted));
        pdf.text("PROPOSAL CONTENT", PDF_MARGIN, y); y += 5;
        pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.text));
        const lines = pdf.splitTextToSize(item.content, CONTENT_WIDTH);
        pdf.text(lines.slice(0, 12), PDF_MARGIN, y);
        y += Math.min(lines.length, 12) * 4 + 6;
      }

      // Amount box
      const amountStr = `UGX ${Number(item.total_amount || 0).toLocaleString()}`;
      const boxW = 80; const boxX = (pageW - boxW) / 2;
      pdf.setFillColor(...hexToRgb(BRAND.accent));
      pdf.roundedRect(boxX, y, boxW, 16, 3, 3, "F");
      pdf.setFontSize(7); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...hexToRgb(BRAND.white));
      pdf.text("PROPOSED AMOUNT", boxX + boxW / 2, y + 5, { align: "center" });
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
      pdf.save(`proposal-${item.proposal_number || "doc"}.pdf`);
      toast.success("Proposal PDF downloaded");
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/proposals" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Preconstruction</div>
          <h1 className="display text-3xl font-bold">Proposals</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Proposals</CardTitle><FileSpreadsheet className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalProposals}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Accepted</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{acceptedProposals}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Rejected</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{rejectedProposals}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{acceptanceRate}%</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={proposals}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["title", "proposal_number", "content"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="proposal_number"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Proposal"
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
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handlePrintProposal(item)}>
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
                <AlertDialogHeader><AlertDialogTitle>Delete proposal?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteProposal.mutate(item.id)} disabled={deleteProposal.isPending}>
                    {deleteProposal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit proposal" : "Create a proposal"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Proposal Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Proposal number <span className="text-destructive">*</span></Label><Input value={form.proposal_number} onChange={(e) => setForm({ ...form, proposal_number: e.target.value })} placeholder="e.g. PRO-001" /></div>
                <div><Label>Project ID</Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="Reference project ID" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Lead ID</Label><Input value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} placeholder="Associated lead ID" /></div>
                <div><Label>Estimate ID</Label><Input value={form.estimate_id} onChange={(e) => setForm({ ...form, estimate_id: e.target.value })} placeholder="Based on estimate ID" /></div>
              </div>
              <div className="mt-3"><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Proposal title" /></div>
              <div className="mt-3"><Label>Content</Label><Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Full proposal content, scope, and terms" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Financial</h3></div>
              <div><Label>Total (UGX)</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} placeholder="Proposed total amount" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status &amp; Notes</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
                  />
                </div>
                <div><Label>Valid until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Sent at</Label><Input type="date" value={form.sent_at} onChange={(e) => setForm({ ...form, sent_at: e.target.value })} /></div>
                <div><Label>Accepted at</Label><Input type="date" value={form.accepted_at} onChange={(e) => setForm({ ...form, accepted_at: e.target.value })} /></div>
              </div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes about this proposal" /></div>
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
