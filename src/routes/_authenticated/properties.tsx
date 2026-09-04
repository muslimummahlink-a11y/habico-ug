import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole, useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Building2, MapPin, Pencil, Archive, Trash2, Loader2, Search, SlidersHorizontal, Home, User, List, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/create-notification";
import { LocationSelector } from "@/components/location-selector";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/properties")({
  head: () => ({ meta: [{ title: "Properties — Habico Portal" }] }),
  component: PropertiesPage,
});

const PROPERTY_TYPE_OPTIONS = ["residential", "commercial", "industrial", "land", "mixed_use"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ") }));
const UNIT_TYPE_OPTIONS = ["residential", "commercial", "retail", "office", "warehouse", "storage"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));
const EMPTY_UNIT = { unit_number: "", unit_type: "residential", floor_number: "", size_sqm: "", monthly_rent: "0", bedrooms: "1", bathrooms: "1", deposit_amount: "0", status: "vacant", photos: {} as Record<string, string> };

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

function PropertiesPage() {
  const role = useHighestRole();
  const { user } = useAuth();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ name: "", address: "", location: "", city: "", property_type: "residential", description: "", image_url: "", owner_id: "", landlord_share_percent: "90" });
  const [unitOpen, setUnitOpen] = useState(false);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [manageUnitsPropId, setManageUnitsPropId] = useState<string>("");
  const [showManageUnits, setShowManageUnits] = useState(false);
  const [unitPropertyId, setUnitPropertyId] = useState<string>("");
  const [unitForm, setUnitForm] = useState(EMPTY_UNIT);

  const { data: owners } = useQuery({
    queryKey: ["property-owners"],
    queryFn: async () => {
      const { data: ownerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "owner");
      const ids = (ownerRoles ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data: ownerProfiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (ownerProfiles ?? []) as any[];
    },
  });
  const ownerMap = new Map((owners ?? []).map((o: any) => [o.id, o.full_name || o.email?.split("@")[0] || "Unknown"]));

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", role, user?.id],
    queryFn: async () => {
      let query = supabase.from("properties").select("*, units(id,unit_number,unit_type,bedrooms,bathrooms,monthly_rent,deposit_amount,status,floor_number,size_sqm,photos)");
      if (role === "owner" && user) query = query.eq("owner_id", user.id);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    total: properties.length,
    units: (properties as any[]).reduce((s, p) => s + (p.units ?? []).length, 0),
    occupied: (properties as any[]).reduce((s, p) => s + (p.units ?? []).filter((u: any) => u.status === "occupied").length, 0),
  };

  const filtered = properties.filter((p: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || p.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("properties").insert({ ...form, owner_id: form.owner_id || null, property_type: form.property_type || "residential", landlord_share_percent: Number(form.landlord_share_percent) || 90 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property created"); setOpen(false);
      setForm({ name: "", address: "", location: "", city: "", property_type: "residential", description: "", image_url: "", owner_id: "", landlord_share_percent: "90" });
      qc.invalidateQueries({ queryKey: ["properties"] });
      if (user) createNotification(user.id, "Property created",
        form.name || "New property", "/properties", "info");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editingProp) return;
      const { error } = await supabase.from("properties").update({ ...form, owner_id: form.owner_id || null, landlord_share_percent: Number(form.landlord_share_percent) || 90 }).eq("id", editingProp.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Property updated"); setEditOpen(false); setEditingProp(null); qc.invalidateQueries({ queryKey: ["properties"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Property unpublished"); qc.invalidateQueries({ queryKey: ["properties"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const publish = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").update({ is_active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Property published"); qc.invalidateQueries({ queryKey: ["properties"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data: unitsToDelete } = await supabase.from("units").select("id").eq("property_id", id);
      if (unitsToDelete && unitsToDelete.length > 0) {
        const unitIds = unitsToDelete.map((u: any) => u.id);
        await supabase.from("leases").delete().in("unit_id", unitIds);
        await supabase.from("maintenance_requests").delete().in("unit_id", unitIds);
        await supabase.from("rental_id_cards").delete().in("unit_id", unitIds);
        const { error: unitErr } = await supabase.from("units").delete().eq("property_id", id);
        if (unitErr) throw unitErr;
      }
      await supabase.from("rental_listing_banners").delete().eq("property_id", id);
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Property deleted"); qc.invalidateQueries({ queryKey: ["properties"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const createUnit = useMutation({
    mutationFn: async () => {
      if (!unitPropertyId) throw new Error("Select a property");
      const { error } = await supabase.from("units").insert({
        property_id: unitPropertyId,
        unit_number: unitForm.unit_number,
        unit_type: unitForm.unit_type,
        floor_number: unitForm.floor_number ? Number(unitForm.floor_number) : null,
        size_sqm: unitForm.size_sqm ? Number(unitForm.size_sqm) : null,
        monthly_rent: Number(unitForm.monthly_rent),
        bedrooms: Number(unitForm.bedrooms),
        bathrooms: Number(unitForm.bathrooms),
        deposit_amount: Number(unitForm.deposit_amount),
        status: unitForm.status,
        photos: unitForm.photos,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unit added");
      setUnitOpen(false);
      setUnitForm(EMPTY_UNIT);
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["units", unitPropertyId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateUnit = useMutation({
    mutationFn: async () => {
      if (!editingUnit) return;
      const { error } = await supabase.from("units").update({
        unit_number: unitForm.unit_number,
        unit_type: unitForm.unit_type,
        floor_number: unitForm.floor_number ? Number(unitForm.floor_number) : null,
        size_sqm: unitForm.size_sqm ? Number(unitForm.size_sqm) : null,
        monthly_rent: Number(unitForm.monthly_rent),
        bedrooms: Number(unitForm.bedrooms),
        bathrooms: Number(unitForm.bathrooms),
        deposit_amount: Number(unitForm.deposit_amount),
        status: unitForm.status,
        photos: unitForm.photos,
      }).eq("id", editingUnit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unit updated");
      setEditUnitOpen(false);
      setEditingUnit(null);
      setUnitForm(EMPTY_UNIT);
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteUnit = useMutation({
    mutationFn: async (unitId: string) => {
      const { error } = await supabase.from("units").delete().eq("id", unitId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unit deleted");
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function openAddUnit(propertyId: string) {
    setUnitPropertyId(propertyId);
    setUnitForm(EMPTY_UNIT);
    setUnitOpen(true);
  }

  function openEditUnit(u: any) {
    setEditingUnit(u);
    setUnitForm({
      unit_number: u.unit_number,
      unit_type: u.unit_type ?? "residential",
      floor_number: u.floor_number?.toString() ?? "",
      size_sqm: u.size_sqm?.toString() ?? "",
      monthly_rent: u.monthly_rent?.toString() ?? "0",
      bedrooms: u.bedrooms?.toString() ?? "1",
      bathrooms: u.bathrooms?.toString() ?? "1",
      deposit_amount: u.deposit_amount?.toString() ?? "0",
      status: u.status ?? "vacant",
      photos: u.photos ?? {},
    });
    setEditUnitOpen(true);
  }

  function openEdit(p: any) {
    setEditingProp(p);
    setForm({ name: p.name, address: p.address ?? "", location: p.location ?? "", city: (p as any).city ?? "", property_type: p.property_type ?? "residential", description: p.description ?? "", image_url: p.image_url ?? "", owner_id: p.owner_id ?? "", landlord_share_percent: String(p.landlord_share_percent ?? 90) });
    setEditOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/properties" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Portfolio</div>
          <h1 className="display text-3xl font-bold">Properties</h1>
        </div>
        {isStaff && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={properties.length === 0} onClick={() => openAddUnit(unitPropertyId || (properties[0] as any)?.id || "")}>
              <Home className="mr-2 h-4 w-4" />Add unit
            </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-2 h-4 w-4" />Add property</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>New property</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Property Details</h3></div>
                  <div className="space-y-3">
                    <div><Label>Property Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunset Apartments, Hilltop Estate" /><p className="mt-1 text-xs text-muted-foreground">Official name of the property as used in lease agreements.</p></div>
                    <div><Label>Property Type *</Label>
                      <SearchableSelect
                        value={form.property_type}
                        onValueChange={(v) => setForm({ ...form, property_type: v })}
                        placeholder="Select type"
                        options={PROPERTY_TYPE_OPTIONS}
                      />
                    </div>
                    <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief overview of the property, key features, amenities, etc." rows={3} /><p className="mt-1 text-xs text-muted-foreground">Describe the property's key features, number of units, and unique selling points.</p></div>
                  </div>
                </div>
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Location &amp; Contact</h3></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Street Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Plot 42, Kampala Road" /></div>
                    <div className="col-span-2"><LocationSelector value={form.location} onChange={(v) => setForm({ ...form, location: v })} /></div>
                  </div>
                </div>
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Landlord / Owner</h3></div>
                  <div className="space-y-3">
                    <div>
                      <Label>Property Owner *</Label>
                      <SearchableSelect
                        value={form.owner_id}
                        onValueChange={(v) => setForm({ ...form, owner_id: v })}
                        placeholder="Select landlord"
                        options={(owners ?? []).length === 0 ? [{ value: "", label: "No landlords found" }] : (owners ?? []).map((o: any) => ({ value: o.id, label: o.full_name || o.email?.split("@")[0] }))}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Select the landlord who owns this property. Landlords must have an account with the <strong>owner</strong> role.</p>
                    </div>
                    <div>
                      <Label>Landlord Share (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={form.landlord_share_percent}
                        onChange={(e) => setForm({ ...form, landlord_share_percent: e.target.value })}
                        placeholder="90"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Percentage of collected rent that goes to the landlord. The company retains the difference as commission.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Media</h3></div>
                  <FileUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Image" accept="image/*" maxSizeMB={5} />
                </div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.name || !form.owner_id || create.isPending}>Create Property</Button></DialogFooter>
        </DialogContent>
      </Dialog>

        </div>
      )}
    </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Properties</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.units}</div><div className="text-xs text-muted-foreground">Total Units</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.units ? Math.round((stats.occupied / stats.units) * 100) : 0}%</div><div className="text-xs text-muted-foreground">Occupancy Rate</div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <SearchableSelect
            value={typeFilter}
            onValueChange={setTypeFilter}
            placeholder="All types"
            options={[
              { value: "all", label: "All types" },
              ...PROPERTY_TYPE_OPTIONS,
            ]}
            className="w-44"
          />
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingProp(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit property</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Property Details</h3></div>
              <div className="space-y-3">
                <div><Label>Property Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">Official name of the property as used in lease agreements.</p></div>
                <div><Label>Property Type</Label>
                  <SearchableSelect
                    value={form.property_type}
                    onValueChange={(v) => setForm({ ...form, property_type: v })}
                    placeholder="Select type"
                    options={PROPERTY_TYPE_OPTIONS}
                  />
                </div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief overview of the property, key features, amenities, etc." rows={3} /></div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Location &amp; Contact</h3></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Street Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                <div className="col-span-2"><LocationSelector value={form.location} onChange={(v) => setForm({ ...form, location: v })} /></div>
              </div>
            </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Landlord / Owner</h3></div>
                <div className="space-y-3">
                  <div>
                    <Label>Property Owner</Label>
                    <SearchableSelect
                      value={form.owner_id}
                      onValueChange={(v) => setForm({ ...form, owner_id: v })}
                      placeholder="Select landlord"
                      options={(owners ?? []).length === 0 ? [{ value: "", label: "No landlords found" }] : (owners ?? []).map((o: any) => ({ value: o.id, label: o.full_name || o.email?.split("@")[0] }))}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Select the landlord who owns this property. Landlords must have an account with the <strong>owner</strong> role.</p>
                  </div>
                  <div>
                    <Label>Landlord Share (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.landlord_share_percent}
                      onChange={(e) => setForm({ ...form, landlord_share_percent: e.target.value })}
                      placeholder="90"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Percentage of collected rent that goes to the landlord. The company retains the difference as commission.</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Media</h3></div>
              <FileUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Image" accept="image/*" maxSizeMB={5} />
            </div>
          </div>
          <DialogFooter><Button onClick={() => update.mutate()} disabled={!form.name || update.isPending}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={unitOpen} onOpenChange={(v) => { setUnitOpen(v); if (!v) setUnitForm(EMPTY_UNIT); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>New unit</DialogTitle><DialogDescription>Add a unit directly into one of your properties.</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Property *</Label>
              <SearchableSelect
                value={unitPropertyId}
                onValueChange={setUnitPropertyId}
                placeholder="Select a property"
                options={(properties as any[]).map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unit number *</Label><Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} placeholder="e.g. A1, 101" /></div>
              <div><Label>Type</Label>
                <SearchableSelect
                  value={unitForm.unit_type}
                  onValueChange={(v) => setUnitForm({ ...unitForm, unit_type: v })}
                  placeholder="Select type"
                  options={UNIT_TYPE_OPTIONS}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Floor</Label><Input type="number" value={unitForm.floor_number} onChange={(e) => setUnitForm({ ...unitForm, floor_number: e.target.value })} /></div>
              <div><Label>Size (sqm)</Label><Input type="number" value={unitForm.size_sqm} onChange={(e) => setUnitForm({ ...unitForm, size_sqm: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bedrooms</Label><Input type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })} /></div>
              <div><Label>Bathrooms</Label><Input type="number" value={unitForm.bathrooms} onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly rent (UGX)</Label><Input type="number" value={unitForm.monthly_rent} onChange={(e) => setUnitForm({ ...unitForm, monthly_rent: e.target.value })} /></div>
              <div><Label>Deposit (UGX)</Label><Input type="number" value={unitForm.deposit_amount} onChange={(e) => setUnitForm({ ...unitForm, deposit_amount: e.target.value })} /></div>
            </div>
            <div><Label>Photos &amp; Videos</Label>
              <div className="grid grid-cols-2 gap-3">
                {(UNIT_PHOTO_FIELDS[unitForm.unit_type] ?? UNIT_PHOTO_FIELDS.residential).map((f) => (
                  <React.Fragment key={f.key}>
                    <FileUpload
                      value={unitForm.photos?.[f.key + "_photo"] ?? ""}
                      onChange={(url) => setUnitForm({ ...unitForm, photos: { ...unitForm.photos, [f.key + "_photo"]: url } })}
                      accept="image/*,video/*" maxSizeMB={20}
                      label={f.label + " Photo"}
                    />
                    {f.hasVideo && (
                      <FileUpload
                        value={unitForm.photos?.[f.key + "_video"] ?? ""}
                        onChange={(url) => setUnitForm({ ...unitForm, photos: { ...unitForm.photos, [f.key + "_video"]: url } })}
                        accept="video/*" maxSizeMB={50}
                        label={f.label + " Video"}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Upload photos and walkthrough videos of each room.</p>
            </div>
            <div><Label>Status</Label>
              <SearchableSelect
                value={unitForm.status}
                onValueChange={(v) => setUnitForm({ ...unitForm, status: v })}
                placeholder="Select status"
                options={[
                  { value: "vacant", label: "Vacant" },
                  { value: "occupied", label: "Occupied" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
            </div>
          </div>
          <DialogFooter><Button onClick={() => createUnit.mutate()} disabled={!unitForm.unit_number || !unitPropertyId || createUnit.isPending}>Create Unit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageUnits} onOpenChange={(v) => { setShowManageUnits(v); if (!v) { setManageUnitsPropId(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Manage units</DialogTitle><DialogDescription>{properties?.find((p: any) => p.id === manageUnitsPropId)?.name}</DialogDescription></DialogHeader>
          <div className="space-y-2">
            {(properties?.find((p: any) => p.id === manageUnitsPropId)?.units ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No units for this property yet.</div>
            ) : (
              (properties?.find((p: any) => p.id === manageUnitsPropId)?.units ?? []).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">{u.unit_number}</div>
                    <div className="text-xs text-muted-foreground">{u.unit_type ?? "—"} · {u.bedrooms != null ? `${u.bedrooms} bed` : "—"} · UGX {u.monthly_rent != null ? Number(u.monthly_rent).toLocaleString() : "—"}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                      u.status === "vacant" ? "bg-green-100 text-green-700" :
                      u.status === "occupied" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{u.status}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setShowManageUnits(false); openEditUnit(u); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete unit?</AlertDialogTitle><AlertDialogDescription>Permanently delete {u.unit_number}? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteUnit.mutate(u.id)} disabled={deleteUnit.isPending} className="bg-destructive text-destructive-foreground">{deleteUnit.isPending ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Deleting</> : "Delete"}</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" className="mt-2 w-full" onClick={() => { setShowManageUnits(false); openAddUnit(manageUnitsPropId); }}><Plus className="mr-2 h-4 w-4" />Add unit</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editUnitOpen} onOpenChange={(v) => { setEditUnitOpen(v); if (!v) { setEditingUnit(null); setUnitForm(EMPTY_UNIT); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit unit</DialogTitle><DialogDescription>{editingUnit?.unit_number}</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unit number *</Label><Input value={unitForm.unit_number} onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })} placeholder="e.g. A1, 101" /></div>
              <div><Label>Type</Label>
                <SearchableSelect
                  value={unitForm.unit_type}
                  onValueChange={(v) => setUnitForm({ ...unitForm, unit_type: v })}
                  placeholder="Select type"
                  options={UNIT_TYPE_OPTIONS}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Floor</Label><Input type="number" value={unitForm.floor_number} onChange={(e) => setUnitForm({ ...unitForm, floor_number: e.target.value })} /></div>
              <div><Label>Size (sqm)</Label><Input type="number" value={unitForm.size_sqm} onChange={(e) => setUnitForm({ ...unitForm, size_sqm: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bedrooms</Label><Input type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value })} /></div>
              <div><Label>Bathrooms</Label><Input type="number" value={unitForm.bathrooms} onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly rent (UGX)</Label><Input type="number" value={unitForm.monthly_rent} onChange={(e) => setUnitForm({ ...unitForm, monthly_rent: e.target.value })} /></div>
              <div><Label>Deposit (UGX)</Label><Input type="number" value={unitForm.deposit_amount} onChange={(e) => setUnitForm({ ...unitForm, deposit_amount: e.target.value })} /></div>
            </div>
            <div><Label>Photos &amp; Videos</Label>
              <div className="grid grid-cols-2 gap-3">
                {(UNIT_PHOTO_FIELDS[unitForm.unit_type] ?? UNIT_PHOTO_FIELDS.residential).map((f) => (
                  <React.Fragment key={f.key}>
                    <FileUpload
                      value={unitForm.photos?.[f.key + "_photo"] ?? ""}
                      onChange={(url) => setUnitForm({ ...unitForm, photos: { ...unitForm.photos, [f.key + "_photo"]: url } })}
                      accept="image/*,video/*" maxSizeMB={20}
                      label={f.label + " Photo"}
                    />
                    {f.hasVideo && (
                      <FileUpload
                        value={unitForm.photos?.[f.key + "_video"] ?? ""}
                        onChange={(url) => setUnitForm({ ...unitForm, photos: { ...unitForm.photos, [f.key + "_video"]: url } })}
                        accept="video/*" maxSizeMB={50}
                        label={f.label + " Video"}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Upload photos and walkthrough videos of each room.</p>
            </div>
            <div><Label>Status</Label>
              <SearchableSelect
                value={unitForm.status}
                onValueChange={(v) => setUnitForm({ ...unitForm, status: v })}
                placeholder="Select status"
                options={[
                  { value: "vacant", label: "Vacant" },
                  { value: "occupied", label: "Occupied" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />
            </div>
          </div>
          <DialogFooter><Button onClick={() => updateUnit.mutate()} disabled={!unitForm.unit_number || updateUnit.isPending}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <div className="font-medium">{search || typeFilter !== "all" ? "No matching properties" : "No properties yet"}</div>
          <div className="text-sm text-muted-foreground">{isStaff && !search ? "Add your first property to begin." : "Try a different search."}</div>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p: any) => {
            const units = p.units ?? [];
            const occ = units.filter((u: any) => u.status === "occupied").length;
            return (
              <div key={p.id} className="group relative">
                <Link to="/properties/$id" params={{ id: p.id }}>
                  <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-soft">
                    {p.image_url && <img src={p.image_url} alt={p.name} className="h-36 w-full rounded-t-xl object-cover" />}
                    <CardContent className={p.image_url ? "p-4" : "p-6"}>
                      <div className="flex items-start justify-between">
                        {!p.image_url && <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>}
                        <div className="flex gap-1">
                          {p.is_active === false && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Unpublished</span>}
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{p.property_type ?? "—"}</span>
                        </div>
                      </div>
                      <h3 className="mt-4 display text-lg font-bold">{p.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{p.city || p.location || p.address || "—"}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{p.owner_id ? ownerMap.get(p.owner_id) ?? "Unknown" : "No landlord linked"}</div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Units</span>
                        <span className="font-semibold">{occ}/{units.length} occupied</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {isStaff && (
                  <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                    <Button size="icon" variant="secondary" className="h-7 w-7" title="Add unit" onClick={(e) => { e.preventDefault(); openAddUnit(p.id); }}><Plus className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="secondary" className="h-7 w-7" title="Manage units" onClick={(e) => { e.preventDefault(); setManageUnitsPropId(p.id); setShowManageUnits(true); }}><List className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.preventDefault(); openEdit(p); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    {p.is_active !== false ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => e.stopPropagation()} title="Unpublish"><EyeOff className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Unpublish property?</AlertDialogTitle><AlertDialogDescription>This will hide {p.name} from the public listings page. Units and lease history are preserved.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => archive.mutate(p.id)} className="bg-destructive text-destructive-foreground">Unpublish</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.preventDefault(); publish.mutate(p.id); }} title="Publish"><Eye className="h-3.5 w-3.5" /></Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete property?</AlertDialogTitle><AlertDialogDescription>Permanently delete {p.name} and all its units. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(p.id)} disabled={remove.isPending} className="bg-destructive text-destructive-foreground">{remove.isPending ? <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Deleting</> : "Delete"}</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
