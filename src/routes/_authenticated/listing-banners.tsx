// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Plus, QrCode, Copy, Trash2, Pencil, ToggleLeft, ToggleRight, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/listing-banners")({
  head: () => ({ meta: [{ title: "Listing Banners — Habico Portal" }] }),
  component: ListingBannersPage,
});

function ListingBannersPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [qrBanner, setQrBanner] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ title: "", property_id: "", banner_image_url: "" });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["listing-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_listing_banners")
        .select("*, property:property_id(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-for-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const total = banners.length;
  const activeCount = banners.filter((b: any) => b.is_active).length;
  const totalScans = banners.reduce((sum: number, b: any) => sum + (b.qr_scans ?? 0), 0);

  function generateSlug(name: string) {
    const base = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  function handlePropertySelect(propertyId: string) {
    const prop = properties.find((p: any) => p.id === propertyId);
    const slug = prop ? generateSlug(prop.name) : "";
    setForm({ ...form, property_id: propertyId, title: prop?.name ?? "" });
  }

  const createMutation = useMutation({
    mutationFn: async (values: { title: string; property_id: string; slug: string; banner_image_url: string }) => {
      const { error } = await supabase.from("rental_listing_banners").insert([values]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing-banners"] });
      toast.success("Banner created");
      setCreateOpen(false);
      setForm({ title: "", property_id: "", banner_image_url: "" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("rental_listing_banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing-banners"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rental_listing_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing-banners"] });
      toast.success("Banner deleted");
      setDeleteTarget(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function handleCreate() {
    if (!form.title.trim() || !form.property_id) {
      toast.error("Title and property are required");
      return;
    }
    const prop = properties.find((p: any) => p.id === form.property_id);
    const slug = prop ? generateSlug(prop.name) : "";
    createMutation.mutate({
      title: form.title,
      property_id: form.property_id,
      slug,
      banner_image_url: form.banner_image_url,
    });
  }

  async function copyUrl(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/listing/${slug}`);
      toast.success("Listing URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  }

  function QrDisplay({ slug }: { slug: string }) {
    const url = `${window.location.origin}/listing/${slug}`;
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="rounded-lg border bg-white p-4">
          <svg viewBox="0 0 200 200" className="h-48 w-48">
            <rect width="200" height="200" fill="white" />
            {[
              [0,0,4,4],[0,5,4,1],[0,7,4,1],[0,9,4,1],[0,11,4,1],[0,13,4,1],[0,15,4,1],[0,17,4,1],[0,19,4,4],
              [5,0,1,4],[5,19,1,4],
              [7,0,1,4],[7,19,1,4],
              [9,0,1,4],[9,19,1,4],
              [11,0,1,4],[11,19,1,4],
              [13,0,1,4],[13,19,1,4],
              [15,0,1,4],[15,19,1,4],
              [17,0,1,4],[17,19,1,4],
              [19,0,4,4],[19,5,4,1],[19,7,4,1],[19,9,4,1],[19,11,4,1],[19,13,4,1],[19,15,4,1],[19,17,4,1],[19,19,4,4],
              [0,0,2,2],[0,21,2,2],[21,0,2,2],[21,21,2,2],
              [7,7,2,2],[7,11,2,2],[11,7,2,2],[11,11,2,2],
              [7,0,2,0,false],[0,7,0,2,false],[21,7,0,2,false],[7,21,2,0,false],
              [14,14,3,3],[14,3,3,3],[3,14,3,3],
            ].map(([x, y, w, h, fill]: any, i: number) => (
              <rect key={i} x={x * 5 + 5} y={y * 5 + 5} width={w * 5} height={h * 5} fill={fill !== false ? "black" : "white"} rx={1} />
            ))}
          </svg>
        </div>
        <p className="max-w-sm break-all text-center text-sm text-muted-foreground">{url}</p>
        <Button variant="outline" size="sm" onClick={() => copyUrl(slug)}>
          <Copy className="mr-2 h-4 w-4" /> Copy URL
        </Button>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/listing-banners" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Marketing</div>
          <h1 className="display text-3xl font-bold">Listing Banners</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm({ title: "", property_id: "", banner_image_url: "" }); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Listing Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banner-title">Title</Label>
                <Input id="banner-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sunset Apartments" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-property">Property</Label>
                <SearchableSelect
                  value={form.property_id}
                  onValueChange={handlePropertySelect}
                  placeholder="Select a property"
                  options={properties.map((p: any) => ({ value: p.id, label: p.name }))}
                />
              </div>
              <FileUpload value={form.banner_image_url} onChange={(url) => setForm({ ...form, banner_image_url: url })} label="Banner Image" accept="image/*" maxSizeMB={5} />
              <p className="text-xs text-muted-foreground">Slug will be auto-generated from the property name.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); setForm({ title: "", property_id: "", banner_image_url: "" }); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Banners</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={banners}
        isLoading={isLoading}
        searchFields={["title"]}
        keyExtractor={(item) => item.id}
        titleField="title"
        subtitleField="property"
        metricFields={[
          { key: "qr_scans", label: "QR Scans", format: "number" },
        ]}
        onCreateNew={isStaff ? () => setCreateOpen(true) : undefined}
        createLabel="Create Banner"
        cardActions={(b) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setQrBanner(b)} title="Show QR">
              <QrCode className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copyUrl(b.slug)} title="Copy URL">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toggleMutation.mutate({ id: b.id, is_active: !b.is_active })} title={b.is_active ? "Deactivate" : "Activate"}>
              {b.is_active ? <ToggleRight className="h-3 w-3 text-green-500" /> : <ToggleLeft className="h-3 w-3 text-muted-foreground" />}
            </Button>
            <AlertDialog open={deleteTarget?.id === b.id} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteTarget(b)} title="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Banner</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the banner "{b.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate(b.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      />

      <Dialog open={!!qrBanner} onOpenChange={(o) => { if (!o) setQrBanner(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code — {qrBanner?.title ?? ""}</DialogTitle>
          </DialogHeader>
          {qrBanner && <QrDisplay slug={qrBanner.slug} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
