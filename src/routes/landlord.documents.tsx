import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Plus, Search, File, Folder } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/landlord/documents")({
  component: LandlordDocuments,
});

function LandlordDocuments() {
  const { user } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [search, setSearch] = useState("");

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", user?.id).order("name");
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["landlord-documents", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*, properties!inner(id, name, owner_id)")
        .eq("properties.owner_id", user?.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!title || !fileUrl) throw new Error("Title and file required");
      const { error } = await supabase.from("documents").insert({
        title,
        file_url: fileUrl,
        doc_type: docType || null,
        related_type: "property",
        related_id: properties[0]?.id,
        uploaded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setUploadOpen(false);
      setTitle("");
      setFileUrl("");
      setDocType("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Document deleted"),
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = documents.filter((d: any) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.doc_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">Manage property documents and files</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setUploadOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-full rounded-md border border-input bg-background p-2 text-sm" />
        </div>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title *</Label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lease Agreement" className="w-full rounded-md border border-input bg-background p-2 text-sm" /></div>
            <div className="space-y-2"><Label>Type</Label><input type="text" value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g. lease, receipt, contract" className="w-full rounded-md border border-input bg-background p-2 text-sm" /></div>
            <div className="space-y-2"><Label>File *</Label><input type="file" onChange={(e) => { const f = e.target.files[0]; if (f) setFileUrl(URL.createObjectURL(f)); }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button onClick={() => upload.mutate()} disabled={!title || !fileUrl || upload.isPending}>{upload.isPending ? "Uploading..." : "Upload"}</Button></div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-card">
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><FileText className="mx-auto mb-3 h-10 w-10" /><p className="font-medium">No documents yet</p><p className="text-sm">Upload your first document</p></div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((doc: any) => (
                <Card key={doc.id} className="shadow-card">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-accent/10 p-2"><FileText className="h-5 w-5 text-accent" /></div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.doc_type ?? "General"} · {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {doc.file_url && <Button asChild variant="outline" size="sm"><a href={doc.file_url} target="_blank" rel="noreferrer"><Download className="mr-1 h-3 w-3" /> View</a></Button>}
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(doc.id)}><FileText className="h-4 w-4 text-red-500" /></Button>
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