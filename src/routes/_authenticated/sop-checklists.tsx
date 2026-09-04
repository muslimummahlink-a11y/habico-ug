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
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ClipboardList, CheckCircle2, Circle, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/sop-checklists")({
  head: () => ({ meta: [{ title: "SOP Checklists — Habico Portal" }] }),
  component: SopChecklistsPage,
});

function SopChecklistsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "" });
  const [detailChecklist, setDetailChecklist] = useState<any>(null);
  const [itemForm, setItemForm] = useState("");

  const resetForm = () => {
    setForm({ title: "", description: "", category: "" });
    setEditing(null);
  };

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["sop-checklists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sop_checklists").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["sop-checklist-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sop_checklist_items").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const getItems = (checklistId: string) =>
    allItems.filter((i: any) => i.checklist_id === checklistId);

  const totalItems = allItems.length;
  const completedItems = allItems.filter((i: any) => i.is_checked).length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const openEdit = (cl: any) => {
    setEditing(cl);
    setForm({ title: cl.title ?? "", description: cl.description ?? "", category: cl.category ?? "" });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sop_checklists").insert({
        title: form.title, description: form.description || null, category: form.category || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checklist created"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["sop-checklists"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sop_checklists").update({
        title: form.title, description: form.description || null, category: form.category || null,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checklist updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["sop-checklists"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sop_checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Checklist deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["sop-checklists"] }); qc.invalidateQueries({ queryKey: ["sop-checklist-items"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const addItem = useMutation({
    mutationFn: async (checklistId: string) => {
      const items = getItems(checklistId);
      const maxSort = items.reduce((max: number, i: any) => Math.max(max, i.sort_order ?? 0), 0);
      const { error } = await supabase.from("sop_checklist_items").insert({
        checklist_id: checklistId, item: itemForm, sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Item added"); setItemForm(""); qc.invalidateQueries({ queryKey: ["sop-checklist-items"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleItem = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase.from("sop_checklist_items").update({
        is_checked: !item.is_checked, checked_at: !item.is_checked ? new Date().toISOString() : null,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sop-checklist-items"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sop_checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Item removed"); qc.invalidateQueries({ queryKey: ["sop-checklist-items"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const categoryOptions = [...new Set(checklists.map((cl: any) => cl.category).filter(Boolean))].map((c: string) => ({ label: c, value: c }));

  const detailItems = detailChecklist ? getItems(detailChecklist.id) : [];
  const detailChecked = detailItems.filter((i: any) => i.is_checked).length;
  const detailProgress = detailItems.length > 0 ? Math.round((detailChecked / detailItems.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/sop-checklists" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">SOP Checklists</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Checklists</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{checklists.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Items</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{completedItems}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completion Rate</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{completionRate}%</div></CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={checklists}
        isLoading={isLoading}
        searchFields={["title", "description", "category"]}
        filterField={categoryOptions.length > 0 ? "category" : undefined}
        filterOptions={categoryOptions.length > 0 ? categoryOptions : undefined}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="description"
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="New Checklist"
        cardActions={(item) => {
          const items = getItems(item.id);
          return (
            <>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setDetailChecklist(item); setItemForm(""); }}>
                <ClipboardList className="mr-1 h-3 w-3" /> Items ({items.length})
              </Button>
              {isStaff && (
                <>
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
                      <AlertDialogHeader><AlertDialogTitle>Delete checklist?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}" and all its items. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del.mutate(item.id)} disabled={del.isPending}>
                          {del.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </>
          );
        }}
      />

      <Dialog open={!!detailChecklist} onOpenChange={(v) => { if (!v) { setDetailChecklist(null); setItemForm(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailChecklist?.title ?? "Checklist Items"}</DialogTitle>
          </DialogHeader>
          {detailChecklist && (
            <div className="space-y-4">
              {detailChecklist.description && <p className="text-sm text-muted-foreground">{detailChecklist.description}</p>}
              {detailChecklist.category && <Badge variant="outline">{detailChecklist.category}</Badge>}
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">{detailChecked}/{detailItems.length} completed</div>
                {detailItems.length > 0 && <Progress value={detailProgress} className="h-2 flex-1" />}
              </div>
              {detailItems.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No items yet.</div>
              ) : (
                <div className="space-y-1">
                  {detailItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                      <button onClick={() => toggleItem.mutate(item)} className="shrink-0">
                        {item.is_checked ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <span className={item.is_checked ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>{item.item}</span>
                      {isStaff && (
                        <Button size="sm" variant="ghost" className="h-6 px-1 text-muted-foreground hover:text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isStaff && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); if (itemForm.trim()) addItem.mutate(detailChecklist.id); }}
                >
                  <Input
                    placeholder="Add new item…"
                    value={itemForm}
                    onChange={(e) => setItemForm(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={!itemForm.trim() || addItem.isPending}>
                    {addItem.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    Add
                  </Button>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit checklist" : "Create a checklist"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Checklist Information</h3></div>
              <div><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Checklist title" /></div>
              <div className="mt-3"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Purpose and scope of this checklist" /></div>
              <div className="mt-3"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Safety, Quality, Inspection" /></div>
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
