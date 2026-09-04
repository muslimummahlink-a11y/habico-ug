import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Image as ImageIcon, Camera, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LocationSelector } from "@/components/location-selector";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/project-photos")({
  head: () => ({ meta: [{ title: "Project Photos — Habico Portal" }] }),
  component: ProjectPhotosPage,
});

const categoryOptions = ["general", "progress", "milestone", "safety", "quality"];

const categoryColor: Record<string, string> = {
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  milestone: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  safety: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  quality: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

function ProjectPhotosPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: "", image_url: "", caption: "", photo_date: "",
    location: "", category: "general",
  });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["project_photos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_photos").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => setForm({
    project_id: "", image_url: "", caption: "", photo_date: "",
    location: "", category: "general",
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      project_id: p.project_id ?? "", image_url: p.image_url ?? "", caption: p.caption ?? "",
      photo_date: p.photo_date ?? "", location: p.location ?? "", category: p.category ?? "general",
    });
    setOpen(true);
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_photos").insert({
        project_id: form.project_id, image_url: form.image_url, caption: form.caption || null,
        photo_date: form.photo_date, location: form.location || null, category: form.category,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Photo added"); setOpen(false); resetForm(); qc.invalidateQueries({ queryKey: ["project_photos"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_photos").update({
        project_id: form.project_id, image_url: form.image_url, caption: form.caption || null,
        photo_date: form.photo_date, location: form.location || null, category: form.category,
      }).eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Photo updated"); setOpen(false); setEditing(null); resetForm(); qc.invalidateQueries({ queryKey: ["project_photos"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const deletePhoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Photo deleted"); setDeleteId(null); qc.invalidateQueries({ queryKey: ["project_photos"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const totalPhotos = photos.length;
  const categoriesUsed = new Set(photos.map((p: any) => p.category)).size;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/project-photos" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Site Documentation</div>
          <h1 className="display text-3xl font-bold">Project Photos</h1>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditing(null); resetForm(); } setOpen(v); }}>
            <DialogTrigger asChild><Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-2 h-4 w-4" />{editing ? "Edit photo" : "Add photo"}</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Edit photo details" : "Add a site photo"}</DialogTitle></DialogHeader>
              <div className="space-y-5">
                <div>
                  <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Required Information</span></div>
                  <div><Label>Project ID <span className="text-destructive">*</span></Label><Input value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} placeholder="e.g. a1b2c3d4-..." /></div>
                  <FileUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Image *" accept="image/*" maxSizeMB={5} />
                  <div className="mt-3"><Label>Photo date <span className="text-destructive">*</span></Label><Input type="date" value={form.photo_date} onChange={(e) => setForm({ ...form, photo_date: e.target.value })} /></div>
                </div>
                <div>
                  <div className="mb-3 border-b pb-1"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photo Details</span></div>
                  <div><Label>Caption</Label><Textarea rows={2} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Brief description of what the photo shows..." /></div>
                  <div className="mt-3"><Label>Location</Label><LocationSelector value={form.location} onChange={(v) => setForm({ ...form, location: v })} /></div>
                  <div className="mt-3"><Label>Category</Label>
                    <SearchableSelect
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                      placeholder="Select category"
                      options={categoryOptions.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={() => (editing ? update : create).mutate()} disabled={!form.project_id || !form.image_url || !form.photo_date || create.isPending || update.isPending}>
                  {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Save changes" : "Add photo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ConstructionWorkflow />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Photos</CardTitle><Camera className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPhotos}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Categories</CardTitle><Layers className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{categoriesUsed}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="display">Photo gallery</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : photos.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No photos yet. {isStaff ? "Add your first site photo." : ""}</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((p: any) => (
                <Card key={p.id} className={cn("overflow-hidden", isStaff && "cursor-pointer")} onClick={() => isStaff && openEdit(p)}>
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.caption ?? "Site photo"} className="h-full w-full object-cover transition-transform hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/50" /></div>
                    )}
                  </div>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium">{p.caption ?? "Untitled"}</p>
                      {isStaff && (
                        <AlertDialog open={deleteId === p.id} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}>
                              <span className="sr-only">Delete</span>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete photo?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{p.caption ?? "Untitled"}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e: any) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={(e: any) => { e.stopPropagation(); deletePhoto.mutate(p.id); }} disabled={deletePhoto.isPending}>
                                {deletePhoto.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge className={cn("border-0", categoryColor[p.category])} variant="outline">{p.category}</Badge>
                      {p.photo_date && <span>{p.photo_date}</span>}
                      {p.location && <span className="truncate">{p.location}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
