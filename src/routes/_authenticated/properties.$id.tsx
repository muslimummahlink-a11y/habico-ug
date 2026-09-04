import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Home, Pencil, Trash2, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/properties/$id")({
  head: () => ({ meta: [{ title: "Property — Habico Portal" }] }),
  component: PropertyDetail,
});

const UNIT_TYPE_OPTIONS = ["residential", "commercial", "retail", "office", "warehouse", "storage"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

const UNIT_PHOTO_FIELDS: Record<string, { key: string; label: string; hasVideo: boolean }[]> = {
  residential: [
    { key: "bedroom", label: "Bedroom", hasVideo: true },
    { key: "bathroom", label: "Bathroom", hasVideo: true },
    { key: "living_room", label: "Living Room", hasVideo: true },
    { key: "kitchen", label: "Kitchen", hasVideo: true },
  ],
  commercial: [
    { key: "storefront", label: "Storefront", hasVideo: true },
    { key: "interior", label: "Interior Space", hasVideo: true },
    { key: "restroom", label: "Restroom", hasVideo: true },
    { key: "break_room", label: "Break Room", hasVideo: true },
  ],
  retail: [
    { key: "storefront", label: "Storefront", hasVideo: true },
    { key: "showroom", label: "Showroom", hasVideo: true },
    { key: "restroom", label: "Restroom", hasVideo: true },
    { key: "back_storage", label: "Storage / Back Room", hasVideo: true },
  ],
  office: [
    { key: "reception", label: "Entrance / Reception", hasVideo: true },
    { key: "workspace", label: "Workspace", hasVideo: true },
    { key: "restroom", label: "Restroom / Kitchenette", hasVideo: true },
    { key: "conference", label: "Conference Room", hasVideo: true },
  ],
  warehouse: [
    { key: "exterior", label: "Exterior", hasVideo: true },
    { key: "main_floor", label: "Main Floor", hasVideo: true },
    { key: "loading_bay", label: "Loading Bay", hasVideo: true },
    { key: "storage", label: "Storage Area", hasVideo: true },
  ],
  storage: [
    { key: "exterior", label: "Exterior", hasVideo: true },
    { key: "interior", label: "Interior", hasVideo: true },
    { key: "security", label: "Security Features", hasVideo: true },
  ],
};

function PropertyDetail() {
  const { id } = Route.useParams();
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ unit_number: "", unit_type: "residential", floor_number: "", size_sqm: "", monthly_rent: "0", bedrooms: "1", bathrooms: "1", deposit_amount: "0", status: "vacant", photos: {} as Record<string, string> });

  const { data: property } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("*").eq("property_id", id).order("unit_number");
      if (error) throw error;
      return data;
    },
  });

  const filtered = statusFilter === "all" ? units : units.filter((u: any) => u.status === statusFilter);
  const occ = units.filter((u: any) => u.status === "occupied").length;
  const maint = units.filter((u: any) => u.status === "maintenance").length;
  const vacant = units.filter((u: any) => u.status === "vacant").length;

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("units").insert({
        property_id: id, unit_number: form.unit_number, unit_type: form.unit_type,
        floor_number: form.floor_number ? Number(form.floor_number) : null,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
        monthly_rent: Number(form.monthly_rent), bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms), deposit_amount: Number(form.deposit_amount),
        status: form.status, photos: form.photos,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Unit added"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["units", id] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editingUnit) return;
      const { error } = await supabase.from("units").update({
        unit_number: form.unit_number, unit_type: form.unit_type,
        floor_number: form.floor_number ? Number(form.floor_number) : null,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
        monthly_rent: Number(form.monthly_rent), bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms), deposit_amount: Number(form.deposit_amount),
        status: form.status, photos: form.photos,
      }).eq("id", editingUnit.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Unit updated"); setEditOpen(false); setEditingUnit(null); qc.invalidateQueries({ queryKey: ["units", id] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (unitId: string) => {
      const { error } = await supabase.from("units").delete().eq("id", unitId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Unit deleted"); qc.invalidateQueries({ queryKey: ["units", id] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  function resetForm() {
    setForm({ unit_number: "", unit_type: "residential", floor_number: "", size_sqm: "", monthly_rent: "0", bedrooms: "1", bathrooms: "1", deposit_amount: "0", status: "vacant", photos: {} });
  }

  function openEdit(u: any) {
    setEditingUnit(u);
    setForm({
      unit_number: u.unit_number, unit_type: (u as any).unit_type ?? "residential",
      floor_number: (u as any).floor_number?.toString() ?? "", size_sqm: (u as any).size_sqm?.toString() ?? "",
      monthly_rent: u.monthly_rent.toString(), bedrooms: u.bedrooms?.toString() ?? "1",
      bathrooms: u.bathrooms?.toString() ?? "1", deposit_amount: (u as any).deposit_amount?.toString() ?? "0",
      status: u.status, photos: (u as any).photos ?? {},
    });
    setEditOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link to="/properties" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to properties</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Property</div>
          <h1 className="display text-3xl font-bold">{property?.name ?? "Loading…"}</h1>
          <p className="text-sm text-muted-foreground">{property?.address}{(property as any)?.city ? `, ${(property as any).city}` : ""}{property?.location ? ` · ${property.location}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold">{units.length}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-success">{vacant}</div><div className="text-xs text-muted-foreground">Vacant</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-primary">{occ}</div><div className="text-xs text-muted-foreground">Occupied</div></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="text-xl font-bold text-warning-foreground">{maint}</div><div className="text-xs text-muted-foreground">Maintenance</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="display">Units</CardTitle>
            <SearchableSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="All"
              options={[
                { value: "all", label: "All" },
                { value: "vacant", label: "Vacant" },
                { value: "occupied", label: "Occupied" },
                { value: "maintenance", label: "Maintenance" },
              ]}
              className="w-36"
            />
          </div>
          {isStaff && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add unit</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>New unit</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Unit number *</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} /></div>
                    <div><Label>Type</Label>
                      <SearchableSelect
                        value={form.unit_type}
                        onValueChange={(v) => setForm({ ...form, unit_type: v })}
                        placeholder="Select type"
                        options={UNIT_TYPE_OPTIONS}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Floor</Label><Input type="number" value={form.floor_number} onChange={(e) => setForm({ ...form, floor_number: e.target.value })} /></div>
                    <div><Label>Size (sqm)</Label><Input type="number" value={form.size_sqm} onChange={(e) => setForm({ ...form, size_sqm: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
                    <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Monthly rent (UGX)</Label><Input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} /></div>
                    <div><Label>Deposit (UGX)</Label><Input type="number" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} /></div>
                  </div>
                  <div><Label>Status</Label>
                    <SearchableSelect
                      value={form.status}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                      placeholder="Select status"
                      options={[
                        { value: "vacant", label: "Vacant" },
                        { value: "occupied", label: "Occupied" },
                        { value: "maintenance", label: "Maintenance" },
                      ]}
                    />
                  </div>
                  <div><Label>Photos &amp; Videos</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(UNIT_PHOTO_FIELDS[form.unit_type] ?? UNIT_PHOTO_FIELDS.residential).map((f) => (
                        <React.Fragment key={f.key}>
                          <FileUpload
                            value={form.photos?.[f.key + "_photo"] ?? ""}
                            onChange={(url) => setForm({ ...form, photos: { ...form.photos, [f.key + "_photo"]: url } })}
                            accept="image/*,video/*" maxSizeMB={20}
                            label={f.label + " Photo"}
                          />
                          {f.hasVideo && (
                            <FileUpload
                              value={form.photos?.[f.key + "_video"] ?? ""}
                              onChange={(url) => setForm({ ...form, photos: { ...form.photos, [f.key + "_video"]: url } })}
                              accept="video/*" maxSizeMB={50}
                              label={f.label + " Video"}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Upload photos and walkthrough videos of each room.</p>
                  </div>
                </div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.unit_number || create.isPending}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingUnit(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Edit unit</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Unit number *</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} /></div>
                  <div><Label>Type</Label>
                    <SearchableSelect
                      value={form.unit_type}
                      onValueChange={(v) => setForm({ ...form, unit_type: v })}
                      placeholder="Select type"
                      options={UNIT_TYPE_OPTIONS}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Floor</Label><Input type="number" value={form.floor_number} onChange={(e) => setForm({ ...form, floor_number: e.target.value })} /></div>
                  <div><Label>Size (sqm)</Label><Input type="number" value={form.size_sqm} onChange={(e) => setForm({ ...form, size_sqm: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
                  <div><Label>Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Monthly rent (UGX)</Label><Input type="number" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} /></div>
                  <div><Label>Deposit (UGX)</Label><Input type="number" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} /></div>
                </div>
                <div><Label>Status</Label>
                  <SearchableSelect
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    placeholder="Select status"
                    options={[
                      { value: "vacant", label: "Vacant" },
                      { value: "occupied", label: "Occupied" },
                      { value: "maintenance", label: "Maintenance" },
                    ]}
                  />
                </div>
                <div><Label>Photos &amp; Videos</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(UNIT_PHOTO_FIELDS[form.unit_type] ?? UNIT_PHOTO_FIELDS.residential).map((f) => (
                      <React.Fragment key={f.key}>
                        <FileUpload
                          value={form.photos?.[f.key + "_photo"] ?? ""}
                          onChange={(url) => setForm({ ...form, photos: { ...form.photos, [f.key + "_photo"]: url } })}
                          accept="image/*,video/*" maxSizeMB={20}
                          label={f.label + " Photo"}
                        />
                        {f.hasVideo && (
                          <FileUpload
                            value={form.photos?.[f.key + "_video"] ?? ""}
                            onChange={(url) => setForm({ ...form, photos: { ...form.photos, [f.key + "_video"]: url } })}
                            accept="video/*" maxSizeMB={50}
                            label={f.label + " Video"}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Upload photos and walkthrough videos of each room.</p>
                </div>
              </div>
              <DialogFooter><Button onClick={() => update.mutate()} disabled={!form.unit_number || update.isPending}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No units{statusFilter !== "all" ? ` with status "${statusFilter}"` : " yet"}.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((u: any) => (
                <div key={u.id} className="group relative rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Home className="h-4 w-4 text-primary" /><span className="font-semibold">Unit {u.unit_number}</span></div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "occupied" ? "bg-success/15 text-success" : u.status === "maintenance" ? "bg-warning/20 text-warning-foreground" : "bg-secondary text-muted-foreground"}`}>{u.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{u.bedrooms ?? "—"} bed · {u.bathrooms ?? "—"} bath</span>
                    {(u as any).unit_type && <span>{(u as any).unit_type}</span>}
                    {(u as any).floor_number != null && <span>Floor {(u as any).floor_number}</span>}
                    {(u as any).size_sqm && <span>{(u as any).size_sqm} sqm</span>}
                  </div>
                  <div className="mt-1 text-sm font-semibold">UGX {Number(u.monthly_rent).toLocaleString()}/mo</div>
                  {(u as any).deposit_amount > 0 && <div className="text-xs text-muted-foreground">Deposit: UGX {Number((u as any).deposit_amount).toLocaleString()}</div>}
                  {isStaff && (
                    <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                      <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="secondary" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete unit?</AlertDialogTitle><AlertDialogDescription>Unit {u.unit_number} will be permanently removed. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(u.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
