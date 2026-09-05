import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { Building2, Plus, Trash2, Edit, Home, DollarSign, Users, Loader2, Image, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/landlord/properties")({
  component: LandlordProperties,
});

function LandlordProperties() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", property_type: "residential", description: "", amenities: [], utilities: [] });
  const [search, setSearch] = useState("");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, location, property_type, description, amenities, utilities, created_at, units!inner(id, unit_number, monthly_rent, status, floor_number)")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("properties").insert({ ...values, owner_id: user?.id, amenities: values.amenities || [], utilities: values.utilities || [] });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["landlord-properties"] }); toast.success("Property created"); setModalOpen(false); setForm({ name: "", location: "", property_type: "residential", description: "", amenities: [], utilities: [] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & typeof form) => {
      const { error } = await supabase.from("properties").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["landlord-properties"] }); toast.success("Property updated"); setEditingId(null); setForm({ name: "", location: "", property_type: "residential", description: "", amenities: [], utilities: [] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("properties").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["landlord-properties"] }); toast.success("Property deleted"); },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtered = properties.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">Properties</h1>
          <p className="text-sm text-muted-foreground">Manage your property portfolio</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-2 h-4 w-4" /> Add Property</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit Property" : "Add Property"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Sunrise Apartments" /></div>
              <div className="space-y-2"><Label>Location *</Label><Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g. Kampala, Nakawa" /></div>
              <div className="space-y-2"><Label>Property Type</Label><Select value={form.property_type} onValueChange={(v) => setForm({...form, property_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="mixed">Mixed Use</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Property description..." rows={3} /></div>
              <div className="space-y-2"><Label>Amenities (comma-separated)</Label><Input value={form.amenities.join(", ")} onChange={(e) => setForm({...form, amenities: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})} placeholder="e.g. Parking, Security, Pool, Gym" /></div>
              <div className="space-y-2"><Label>Utilities Included</Label><Input value={form.utilities.join(", ")} onChange={(e) => setForm({...form, utilities: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})} placeholder="e.g. Water, Electricity, Internet" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModalOpen(false); setEditingId(null); setForm({ name: "", location: "", property_type: "residential", description: "", amenities: [], utilities: [] }); }}>Cancel</Button>
              <Button onClick={() => editingId ? updateMutation.mutate({ id: editingId!, ...form }) : createMutation.mutate(form)} disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" /></div>
      </div>

      <Card className="shadow-card">
        <CardContent>
          {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Building2 className="mx-auto mb-3 h-10 w-10" /><p className="font-medium">No properties yet</p><p className="text-sm">Click "Add Property" to add your first property</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Property</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Units</TableHead><TableHead>Total Rent</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((p: any) => {
                    const units = p.units ?? [];
                    const totalRent = units.reduce((s: number, u: any) => s + Number(u.monthly_rent ?? 0), 0);
                    const occupied = units.filter((u: any) => u.status === "occupied").length;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.location}</TableCell>
                        <TableCell><Badge variant="outline">{p.property_type}</Badge></TableCell>
                        <TableCell>{p.units?.length ?? 0}</TableCell>
                        <TableCell className="font-semibold">UGX {totalRent.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setForm({ name: p.name, location: p.location, property_type: p.property_type, description: p.description || "", amenities: p.amenities || [], utilities: p.utilities || [] }); setEditingId(p.id); }}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => { if (confirm("Delete this property?")) deleteMutation.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}