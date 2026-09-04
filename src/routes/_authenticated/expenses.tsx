// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Habico Portal" }] }),
  component: ExpensesPage,
});

const statusOptions = ["pending", "approved", "rejected"];

function ExpensesPage() {
  const role = useHighestRole();
  const { user } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("");
  const [form, setForm] = useState({ category_id: "", employee_id: "", project_id: "", amount: "0", description: "", expense_date: new Date().toISOString().slice(0, 10), receipt_image_url: "", status: "pending" });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", catFilter],
    queryFn: async () => {
      let q = supabase.from("expenses").select("*, expense_categories(name), employees(full_name), projects(name)");
      if (catFilter) q = q.eq("category_id", catFilter);
      const { data, error } = await q.order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("expense_categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-pick"], enabled: isStaff,
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("full_name");
      return data ?? [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-pick"], enabled: isStaff,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("name");
      return data ?? [];
    },
  });

  const resetForm = () => setForm({ category_id: "", employee_id: "", project_id: "", amount: "0", description: "", expense_date: new Date().toISOString().slice(0, 10), receipt_image_url: "", status: "pending" });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      category_id: p.category_id ?? "", employee_id: p.employee_id ?? "", project_id: p.project_id ?? "",
      amount: String(p.amount ?? "0"), description: p.description ?? "", expense_date: p.expense_date ?? "",
      receipt_image_url: p.receipt_image_url ?? "", status: p.status ?? "pending",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses").insert({
        category_id: form.category_id || null,
        employee_id: form.employee_id || null,
        project_id: form.project_id || null,
        amount: Number(form.amount),
        description: form.description || null,
        expense_date: form.expense_date,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Expense recorded"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses").update({
        category_id: form.category_id || null,
        employee_id: form.employee_id || null,
        project_id: form.project_id || null,
        amount: Number(form.amount),
        description: form.description || null,
        expense_date: form.expense_date,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Expense updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Expense deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["expenses"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalAmount = expenses.reduce((s: number, p: any) => s + Number(p.amount), 0);

  const cfg = workflowConfigs.expenses;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/expenses" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Finance</div>
          <h1 className="display text-3xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">UGX {totalAmount.toLocaleString()}</span></p>
        </div>
      </div>

      <ConstructionWorkflow />

      <EntityCardGrid
        data={expenses}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["description"]}
        filterField="status"
        filterOptions={statusOptions.map((s) => ({ label: s.replace("_", " "), value: s }))}
        extraFilters={[{ label: "Category", value: "", field: "category_id" }]}
        keyExtractor={(item) => item.id}
        titleField="description"
        subtitleField="category"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { resetForm(); setOpen(true); } : undefined}
        createLabel="Add Expense"
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
            <AlertDialog open={deleteId === item.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete expense?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this expense. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove.mutate(item.id)} disabled={remove.isPending}>
                    {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : undefined}
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit expense" : "Record an expense"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Expense Info</h3></div>
              <div className="space-y-3">
                <div><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was this expense for?" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (UGX) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
                  <div><Label>Date *</Label><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Category & Project</h3></div>
              <div className="space-y-3">
                <div><Label>Category</Label>
                  <SearchableSelect
                    value={form.category_id}
                    onValueChange={(v) => setForm({ ...form, category_id: v })}
                    placeholder="Select category…"
                    options={[
                      { value: "", label: "Select category…" },
                      ...categories.map((c: any) => ({ value: c.id, label: c.name }))
                    ]}
                  />
                </div>
                <div><Label>Employee</Label>
                  <SearchableSelect
                    value={form.employee_id}
                    onValueChange={(v) => setForm({ ...form, employee_id: v })}
                    placeholder="Select employee…"
                    options={[
                      { value: "", label: "Select employee…" },
                      ...employees.map((e: any) => ({ value: e.id, label: e.full_name }))
                    ]}
                  />
                </div>
                <div><Label>Project</Label>
                  <SearchableSelect
                    value={form.project_id}
                    onValueChange={(v) => setForm({ ...form, project_id: v })}
                    placeholder="Select project…"
                    options={[
                      { value: "", label: "Select project…" },
                      ...projects.map((p: any) => ({ value: p.id, label: p.name }))
                    ]}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Receipt</h3></div>
              <FileUpload value={form.receipt_image_url} onChange={(url) => setForm({ ...form, receipt_image_url: url })} label="Receipt image" accept="image/*" maxSizeMB={5} />
            </div>
          </div>
          <DialogFooter><Button onClick={() => (editing ? update : create).mutate()} disabled={!form.amount || Number(form.amount) <= 0 || create.isPending || update.isPending}>
            {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Record"}
          </Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
