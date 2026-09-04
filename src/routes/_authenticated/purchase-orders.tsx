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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart, Trash2, ChevronRight, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/purchase-orders")({
  head: () => ({ meta: [{ title: "Purchase Orders — Habico Portal" }] }),
  component: PurchaseOrdersPage,
});

const statusFlow = ["draft", "pending", "approved", "ordered", "received"];

function PurchaseOrdersPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const blankForm = { supplier_id: "", project_id: "", items: [{ description: "", quantity: 1, unit_price: 0, received_quantity: 0 }] };
  const [form, setForm] = useState(blankForm);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-pick"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-pick"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const totalAmount = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const create = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("purchase_orders")
        .select("order_number")
        .order("created_at", { ascending: false })
        .limit(1);
      const lastNum = existing?.[0]?.order_number ?? "PO-00000";
      const seq = String(Number(lastNum.replace("PO-", "")) + 1).padStart(5, "0");
      const orderNumber = `PO-${seq}`;
      const { error } = await supabase.from("purchase_orders").insert({
        order_number: orderNumber,
        supplier_id: form.supplier_id,
        project_id: form.project_id || null,
        items: form.items,
        total_amount: totalAmount,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase order created");
      setOpen(false);
      setForm(blankForm);
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const advanceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase-orders"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unit_price: 0, received_quantity: 0 }] });
  };

  const removeItem = (idx: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    (items[idx] as any)[field] = value;
    setForm({ ...form, items });
  };

  const nextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const prevStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    return idx > 0 ? statusFlow[idx - 1] : null;
  };

  const cfg = workflowConfigs["purchase-orders"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/purchase-orders" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Procurement</div>
          <h1 className="display text-3xl font-bold">Purchase Orders</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <EntityCardGrid
        data={orders}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["order_number", "supplier_name"]}
        filterField="status"
        filterOptions={statusFlow.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
        keyExtractor={(item) => item.id}
        titleField="po_number"
        subtitleField="supplier_name"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={isStaff ? () => { setForm(blankForm); setOpen(true); } : undefined}
        createLabel="New Purchase Order"
        workflowButtons={(item) => {
          const prev = prevStatus(item.status);
          const next = nextStatus(item.status);
          const buttons = [];
          if (prev) buttons.push({ label: `← ${prev}`, variant: "ghost" as const, onClick: () => advanceStatus.mutate({ id: item.id, status: prev }) });
          if (next) buttons.push({ label: `${next} →`, variant: "outline" as const, onClick: () => advanceStatus.mutate({ id: item.id, status: next }) });
          return buttons;
        }}
        cardActions={() => isStaff ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen(true)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          </>
        ) : undefined}
      />

      {orders.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="display">Item details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((o: any) => {
                const items: any[] = o.items ?? [];
                if (items.length === 0) return null;
                return (
                  <details key={o.id} className="group rounded-lg border border-border">
                    <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium hover:bg-muted/50">
                      <span>{o.order_number} — {o.suppliers?.name}</span>
                      <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                    </summary>
                    <div className="border-t border-border p-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Ordered</TableHead>
                            <TableHead className="text-right">Received</TableHead>
                            <TableHead className="text-right">Unit price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item: any, i: number) => {
                            const ordered = Number(item.quantity ?? 0);
                            const received = Number(item.received_quantity ?? 0);
                            const unitPrice = Number(item.unit_price ?? 0);
                            return (
                              <TableRow key={i}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{ordered}</TableCell>
                                <TableCell className="text-right">
                                  <span className={received < ordered ? "text-warning-foreground font-medium" : "text-success font-medium"}>
                                    {received}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">UGX {unitPrice.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-medium">UGX {(ordered * unitPrice).toLocaleString()}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </details>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create purchase order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">PO Info</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Supplier *</Label>
                  <SearchableSelect
                    value={form.supplier_id}
                    onValueChange={(v) => setForm({ ...form, supplier_id: v })}
                    placeholder="Select supplier…"
                    options={[
                      { value: "", label: "Select supplier…" },
                      ...suppliers.map((s: any) => ({ value: s.id, label: s.name }))
                    ]}
                  />
                </div>
                <div>
                  <Label>Project (optional)</Label>
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
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Items & Budget</h3></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Items</Label>
                  <Button size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3" /> Add item</Button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex items-end gap-2 rounded-lg border border-border p-3">
                      <div className="flex-1">
                        <Label className="text-xs">Description *</Label>
                        <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Item description" />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs">Unit price</Label>
                        <Input type="number" min={0} step={100} value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", Number(e.target.value))} />
                      </div>
                      <div className="w-24 text-right">
                        <Label className="text-xs">Total</Label>
                        <div className="mt-1.5 text-sm font-semibold">UGX {(item.quantity * item.unit_price).toLocaleString()}</div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" disabled={form.items.length <= 1} onClick={() => removeItem(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total amount</div>
                <div className="text-xl font-bold">UGX {totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={!form.supplier_id || form.items.some((i) => !i.description) || create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
