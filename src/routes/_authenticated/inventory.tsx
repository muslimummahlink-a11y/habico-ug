// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { workflowConfigs } from "@/lib/workflow-actions";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, AlertTriangle, Layers, Search, Plus, Minus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

const CATEGORIES = [
  "building_materials",
  "plumbing",
  "electrical",
  "finishing",
  "safety",
  "tools",
  "other",
] as const;

const UNITS = ["piece", "kg", "meter", "liter", "bag", "box", "roll"] as const;

function InventoryPage() {
  const { user } = useAuth();
  const role = useHighestRole();
  const queryClient = useQueryClient();
  const isStaff = user?.role === "staff" || user?.role === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "tools",
    unit: "piece",
    quantity: 0,
    min_stock_level: 0,
    unit_cost: 0,
    selling_price: 0,
    supplier_id: "",
    location: "",
    sku: "",
    notes: "",
  });

  const [adjustForm, setAdjustForm] = useState({
    adjustment: 0,
    reason: "",
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*, suppliers(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers", "dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const totalItems =
    inventory?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0;
  const totalValue =
    inventory?.reduce(
      (sum, i) => sum + (i.quantity || 0) * (i.unit_cost || 0),
      0
    ) ?? 0;
  const lowStockItems =
    inventory?.filter((i) => (i.quantity ?? 0) <= (i.min_stock_level ?? 0))
      .length ?? 0;
  const categoriesCount = new Set(inventory?.map((i) => i.category)).size;

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("inventory").insert([
        {
          name: values.name,
          description: values.description,
          category: values.category,
          unit: values.unit,
          quantity: values.quantity,
          min_stock_level: values.min_stock_level,
          unit_cost: values.unit_cost,
          selling_price: values.selling_price,
          supplier_id: values.supplier_id || null,
          location: values.location,
          sku: values.sku,
          notes: values.notes,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item created");
      setCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form & { id: string }) => {
      const { error } = await supabase
        .from("inventory")
        .update({
          name: values.name,
          description: values.description,
          category: values.category,
          unit: values.unit,
          quantity: values.quantity,
          min_stock_level: values.min_stock_level,
          unit_cost: values.unit_cost,
          selling_price: values.selling_price,
          supplier_id: values.supplier_id || null,
          location: values.location,
          sku: values.sku,
          notes: values.notes,
        })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item updated");
      setEditOpen(false);
      setSelectedItem(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Inventory item deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({
      id,
      adjustment,
      reason,
    }: {
      id: string;
      adjustment: number;
      reason: string;
    }) => {
      const item = inventory?.find((i) => i.id === id);
      if (!item) throw new Error("Item not found");
      const newQty = (item.quantity ?? 0) + adjustment;
      if (newQty < 0) throw new Error("Quantity cannot be negative");
      const { error } = await supabase
        .from("inventory")
        .update({ quantity: newQty })
        .eq("id", id);
      if (error) throw error;
      const { error: logError } = await supabase
        .from("inventory_adjustments")
        .insert([
          {
            inventory_id: id,
            previous_quantity: item.quantity,
            adjustment,
            new_quantity: newQty,
            reason,
            adjusted_by: user?.id,
          },
        ]);
      if (logError) throw logError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock adjusted");
      setAdjustOpen(false);
      setSelectedItem(null);
      setAdjustForm({ adjustment: 0, reason: "" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function resetForm() {
    setForm({
      name: "",
      description: "",
      category: "tools",
      unit: "piece",
      quantity: 0,
      min_stock_level: 0,
      unit_cost: 0,
      selling_price: 0,
      supplier_id: "",
      location: "",
      sku: "",
      notes: "",
    });
  }

  function openEdit(item: any) {
    setSelectedItem(item);
    setForm({
      name: item.name ?? "",
      description: item.description ?? "",
      category: item.category ?? "tools",
      unit: item.unit ?? "piece",
      quantity: item.quantity ?? 0,
      min_stock_level: item.min_stock_level ?? 0,
      unit_cost: item.unit_cost ?? 0,
      selling_price: item.selling_price ?? 0,
      supplier_id: item.supplier_id ?? "",
      location: item.location ?? "",
      sku: item.sku ?? "",
      notes: item.notes ?? "",
    });
    setEditOpen(true);
  }

  function openAdjust(item: any) {
    setSelectedItem(item);
    setAdjustForm({ adjustment: 0, reason: "" });
    setAdjustOpen(true);
  }

  function formatUGX(amount: number) {
    return `UGX ${(amount ?? 0).toLocaleString()}`;
  }

  if (!isStaff) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  const cfg = workflowConfigs.inventory;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/inventory" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Inventory</div>
          <h1 className="display text-3xl font-bold">Inventory</h1>
        </div>
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUGX(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", lowStockItems > 0 && "text-destructive")}>
              {lowStockItems}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoriesCount}</div>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={inventory ?? []}
        isLoading={isLoading}
        workflow={cfg}
        searchFields={["name", "sku", "description"]}
        filterField="status"
        filterOptions={Object.entries(cfg.statuses).map(([k, v]) => ({ label: v.label, value: k }))}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="category"
        statusField="status"
        metricFields={cfg.metricFields}
        onCreateNew={() => { resetForm(); setCreateOpen(true); }}
        createLabel="Add Item"
        cardActions={(item) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openAdjust(item)}>
              <Minus className="mr-1 h-3 w-3" /> Adjust
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => {
              if (window.confirm(`Delete "${item.name}"? This action cannot be undone.`)) {
                deleteMutation.mutate(item.id);
              }
            }}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </>
        )}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Inventory Item</DialogTitle>
            <DialogDescription>Add a new item to the inventory</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Item Details</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Stock keeping unit" />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the item" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <SearchableSelect
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                    placeholder="Select category"
                    options={CATEGORIES.map((cat) => ({ value: cat, label: cat.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measure</Label>
                  <SearchableSelect
                    value={form.unit}
                    onValueChange={(v) => setForm({ ...form, unit: v })}
                    placeholder="Select unit"
                    options={UNITS.map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Pricing</h3></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Unit Cost (UGX)</Label>
                  <Input id="unit_cost" type="number" min={0} value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price (UGX)</Label>
                  <Input id="selling_price" type="number" min={0} value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} placeholder="0" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Total value: <strong>{formatUGX(form.quantity * form.unit_cost)}</strong>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Supplier & Location</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <SearchableSelect
                    value={form.supplier_id}
                    onValueChange={(v) => setForm({ ...form, supplier_id: v })}
                    placeholder="Select supplier"
                    options={suppliers?.map((s) => ({ value: s.id, label: s.name })) ?? []}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Warehouse A, Shelf 3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="min_stock_level">Min Stock Level</Label>
                  <Input id="min_stock_level" type="number" min={0} value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })} placeholder="Alert threshold" />
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div className="space-y-2">
                <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about this item" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => {
              if (!form.name) { toast.error("Name is required"); return; }
              createMutation.mutate(form);
            }} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setSelectedItem(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update item details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Item Details</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sku">SKU</Label>
                  <Input id="edit-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Stock keeping unit" />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the item" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <SearchableSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} placeholder="Select category" options={CATEGORIES.map((cat) => ({ value: cat, label: cat.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit of Measure</Label>
                  <SearchableSelect value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })} placeholder="Select unit" options={UNITS.map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))} />
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Pricing</h3></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input id="edit-quantity" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit_cost">Unit Cost (UGX) *</Label>
                  <Input id="edit-unit_cost" type="number" min={0} value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-selling_price">Selling Price (UGX)</Label>
                  <Input id="edit-selling_price" type="number" min={0} value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} placeholder="0" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Total value: <strong>{formatUGX(form.quantity * form.unit_cost)}</strong>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Supplier & Location</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier_id">Supplier</Label>
                  <SearchableSelect value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })} placeholder="Select supplier" options={suppliers?.map((s) => ({ value: s.id, label: s.name })) ?? []} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Storage Location</Label>
                  <Input id="edit-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Warehouse A, Shelf 3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-min_stock_level">Min Stock Level</Label>
                  <Input id="edit-min_stock_level" type="number" min={0} value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })} placeholder="Alert threshold" />
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Notes</h3></div>
              <div className="space-y-2">
                <Input id="edit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about this item" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setSelectedItem(null); resetForm(); }}>Cancel</Button>
            <Button onClick={() => {
              if (!form.name) { toast.error("Name is required"); return; }
              updateMutation.mutate({ ...form, id: selectedItem.id });
            }} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={(open) => { setAdjustOpen(open); if (!open) { setSelectedItem(null); setAdjustForm({ adjustment: 0, reason: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>{selectedItem ? `Current quantity: ${selectedItem.quantity} ${selectedItem.unit}` : "Adjust inventory quantity"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment">Adjustment (+ to add, - to remove)</Label>
              <Input id="adjustment" type="number" value={adjustForm.adjustment} onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: Number(e.target.value) })} placeholder="e.g. 5 or -3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g. Damaged, restock, returned" />
            </div>
            {selectedItem && (
              <div className="text-sm text-muted-foreground">
                New quantity will be: <strong>{(selectedItem.quantity ?? 0) + adjustForm.adjustment}</strong>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAdjustOpen(false); setSelectedItem(null); setAdjustForm({ adjustment: 0, reason: "" }); }}>Cancel</Button>
            <Button onClick={() => {
              if (adjustForm.adjustment === 0) { toast.error("Adjustment must be non-zero"); return; }
              if (!adjustForm.reason) { toast.error("Reason is required"); return; }
              adjustMutation.mutate({ id: selectedItem.id, adjustment: adjustForm.adjustment, reason: adjustForm.reason });
            }} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? "Adjusting..." : "Adjust Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
