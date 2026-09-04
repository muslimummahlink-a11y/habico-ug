// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, FolderTree, Loader2, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/sop-forms")({
  head: () => ({ meta: [{ title: "SOP Forms — Habico Portal" }] }),
  component: SopFormsPage,
});

function SopFormsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", form_config: "{}" });
  const [printForm, setPrintForm] = useState<any>(null);

  const resetForm = () => {
    setForm({ title: "", description: "", category: "", form_config: "{}" });
    setEditing(null);
  };

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["sop-forms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sop_forms").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const categories = [...new Set(forms.map((f: any) => f.category).filter(Boolean))];
  const categoryOptions = categories.map((c: string) => ({ label: c, value: c }));

  const openEdit = (f: any) => {
    setEditing(f);
    setForm({
      title: f.title ?? "",
      description: f.description ?? "",
      category: f.category ?? "",
      form_config: typeof f.form_config === "string" ? f.form_config : JSON.stringify(f.form_config ?? {}, null, 2),
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      let parsed: any = {};
      try { parsed = JSON.parse(form.form_config); } catch { throw new Error("Invalid JSON in form_config"); }
      const { error } = await supabase.from("sop_forms").insert({
        title: form.title, description: form.description || null, category: form.category || null, form_config: parsed,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Form created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["sop-forms"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      let parsed: any = {};
      try { parsed = JSON.parse(form.form_config); } catch { throw new Error("Invalid JSON in form_config"); }
      const { error } = await supabase.from("sop_forms").update({
        title: form.title, description: form.description || null, category: form.category || null, form_config: parsed,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Form updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["sop-forms"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sop_forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Form deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["sop-forms"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/sop-forms" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">SOP Forms</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Forms</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{forms.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Categories</CardTitle><FolderTree className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {categories.map((c: any) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">With Config</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.filter((f: any) => f.form_config && Object.keys(f.form_config).length > 0).length}</div>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={forms}
        isLoading={isLoading}
        searchFields={["title", "description", "category"]}
        filterField={categoryOptions.length > 0 ? "category" : undefined}
        filterOptions={categoryOptions.length > 0 ? categoryOptions : undefined}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="description"
        metricFields={[
          { key: "category", label: "Category" },
          { key: "updated_at", label: "Updated", format: "date" },
        ]}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Form"
        cardActions={(item) => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPrintForm(item)}>
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
                <AlertDialogHeader><AlertDialogTitle>Delete form?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate(item.id)} disabled={del.isPending}>
                    {del.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit form" : "Create a form"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Form Information</h3></div>
              <div><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Form title" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Purpose and usage of this form" /></div>
              <div className="mt-3"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Safety, Quality Control, Inspection" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Configuration</h3></div>
              <div>
                <Label>Form Config (JSON)</Label>
                <p className="text-xs text-muted-foreground mb-2">Define form fields as a JSON array of field objects</p>
                <Textarea
                  rows={12}
                  className="font-mono text-xs"
                  value={form.form_config}
                  onChange={(e) => setForm({ ...form, form_config: e.target.value })}
                  placeholder={`[\n  {\n    "label": "Field Name",\n    "type": "text",\n    "required": true\n  }\n]`}
                />
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

      {/* Print Preview Dialog */}
      <Dialog open={!!printForm} onOpenChange={(v) => { if (!v) setPrintForm(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" /> Print Preview
            </DialogTitle>
          </DialogHeader>
          {printForm && (
            <div id="sop-print-area" className="space-y-4">
              {/* Header */}
              <div className="border-b-2 border-primary pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary p-2"><FileText className="h-6 w-6 text-primary-foreground" /></div>
                  <div>
                    <h2 className="text-xl font-bold">{printForm.title}</h2>
                    {printForm.category && <Badge variant="secondary" className="mt-1">{printForm.category}</Badge>}
                  </div>
                </div>
                {printForm.description && <p className="mt-3 text-sm text-muted-foreground">{printForm.description}</p>}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Form Fields</h3>
                {(() => {
                  let fields: any[] = [];
                  try {
                    const config = typeof printForm.form_config === "string"
                      ? JSON.parse(printForm.form_config)
                      : printForm.form_config;
                    if (Array.isArray(config)) fields = config;
                    else if (config?.fields) fields = config.fields;
                  } catch { return <p className="text-sm text-destructive">Invalid form configuration</p>; }

                  if (fields.length === 0) return <p className="text-sm text-muted-foreground italic">No fields configured</p>;

                  return fields.map((field: any, i: number) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{field.label || field.name || `Field ${i + 1}`}</span>
                        {field.required && <span className="text-xs text-destructive">*Required</span>}
                        {field.type && <Badge variant="outline" className="text-xs ml-auto">{field.type}</Badge>}
                      </div>
                      {field.description && <p className="mt-1 text-xs text-muted-foreground">{field.description}</p>}
                      {field.options && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {field.options.map((opt: string, j: number) => (
                            <div key={j} className="flex items-center gap-1 text-sm">
                              <div className="h-4 w-4 rounded border" /> {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {!field.options && (
                        <div className="mt-2 h-8 rounded border bg-muted/30" />
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Signature Section */}
              <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="h-px bg-foreground w-full mb-1" />
                    <p className="text-xs text-muted-foreground">Completed By (Signature & Date)</p>
                  </div>
                  <div>
                    <div className="h-px bg-foreground w-full mb-1" />
                    <p className="text-xs text-muted-foreground">Verified By (Signature & Date)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            <Button onClick={() => {
              const printContent = document.getElementById("sop-print-area");
              if (!printContent) return;
              const win = window.open("", "_blank", "width=800,height=600");
              if (!win) return;
              win.document.write(`
                <html><head><title>${printForm?.title || "SOP Form"}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
                  h2 { font-size: 20px; margin-bottom: 4px; }
                  h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
                  .border-b-2 { border-bottom: 2px solid #0d4a45; padding-bottom: 16px; margin-bottom: 16px; }
                  .rounded-lg { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
                  .font-semibold { font-weight: 600; }
                  .text-destructive { color: #dc2626; }
                  .bg-muted\\/30 { background: #f1f5f9; height: 32px; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 8px; }
                  .border-t { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; }
                  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                  .h-px { height: 1px; background: #1e293b; margin-bottom: 4px; }
                  .text-xs { font-size: 12px; }
                  .text-muted-foreground { color: #64748b; }
                  .flex { display: flex; align-items: center; gap: 8px; }
                  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; border: 1px solid #e2e8f0; font-size: 11px; }
                  @media print { body { padding: 20px; } }
                </style></head><body>${printContent.innerHTML}</body></html>
              `);
              win.document.close();
              win.focus();
              setTimeout(() => { win.print(); win.close(); }, 500);
            }}>
              <Printer className="mr-1 h-4 w-4" /> Print Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
