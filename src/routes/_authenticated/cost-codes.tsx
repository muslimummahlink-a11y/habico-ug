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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Hash, FolderTree, CheckCircle2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/cost-codes")({
  head: () => ({ meta: [{ title: "Cost Codes — Habico Portal" }] }),
  component: CostCodesPage,
});

function CostCodesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", category: "", is_active: true });

  const resetForm = () => {
    setForm({ code: "", name: "", description: "", category: "", is_active: true });
    setEditing(null);
  };

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["cost-codes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cost_codes").select("*").order("code", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const activeCodes = codes.filter((c: any) => c.is_active).length;
  const uniqueCategories = [...new Set(codes.map((c: any) => c.category).filter(Boolean))];
  const categoryOptions = uniqueCategories.map((c: string) => ({ label: c, value: c }));

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code ?? "",
      name: c.name ?? "",
      description: c.description ?? "",
      category: c.category ?? "",
      is_active: c.is_active ?? true,
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cost_codes").insert({
        code: form.code, name: form.name, description: form.description || null,
        category: form.category || null, is_active: form.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cost code created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["cost-codes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cost_codes").update({
        code: form.code, name: form.name, description: form.description || null,
        category: form.category || null, is_active: form.is_active,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cost code updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["cost-codes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleActive = useMutation({
    mutationFn: async (c: any) => {
      const { error } = await supabase.from("cost_codes").update({ is_active: !c.is_active }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cost-codes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cost_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cost code deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["cost-codes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/cost-codes" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Finance</div>
          <h1 className="display text-3xl font-bold">Cost Codes</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Codes</CardTitle><Hash className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{codes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Active</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{activeCodes}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Categories</CardTitle><FolderTree className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCategories.length}</div>
            {uniqueCategories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {uniqueCategories.map((c: any) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={codes}
        isLoading={isLoading}
        searchFields={["name", "code", "description", "category"]}
        filterField={categoryOptions.length > 0 ? "category" : undefined}
        filterOptions={categoryOptions.length > 0 ? categoryOptions : undefined}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="code"
        metricFields={[
          { key: "category", label: "Category" },
          { key: "description", label: "Description" },
        ]}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Cost Code"
        cardActions={(item) => isStaff ? (
          <>
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={item.is_active}
                onCheckedChange={() => toggleActive.mutate(item)}
                className="mr-1"
              />
            </div>
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
                <AlertDialogHeader><AlertDialogTitle>Delete cost code?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.code} — {item.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit cost code" : "Create a cost code"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Code Information</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code <span className="text-destructive">*</span></Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 01-010" /></div>
                <div><Label>Name <span className="text-destructive">*</span></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name of the cost code" /></div>
              </div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this cost code covers" /></div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Classification</h3></div>
              <div><Label>Category <span className="text-destructive">*</span></Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Labour, Materials, Equipment" /></div>
              <div className="flex items-center gap-2 mt-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Inactive cost codes will be hidden from selection lists</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.code || !form.name || create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
