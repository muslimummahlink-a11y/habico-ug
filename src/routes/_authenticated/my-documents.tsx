import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/my-documents")({
  head: () => ({ meta: [{ title: "My Documents — Habico Portal" }] }),
  component: MyDocumentsPage,
});

function useDocuments(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-documents", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("related_type", "tenant")
        .eq("related_id", tenantId)
        .order("created_at", { ascending: false });
      return (data as any[]) ?? [];
    },
    enabled: !!tenantId,
  });
}

function MyDocumentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: documents, isLoading } = useDocuments(user?.id ?? "");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [docType, setDocType] = useState("");

  const upload = useMutation({
    mutationFn: async () => {
      if (!title || !fileUrl) throw new Error("Title and file are required");
      const { error } = await supabase.from("documents").insert({
        title,
        file_url: fileUrl,
        doc_type: docType || null,
        related_type: "tenant",
        related_id: user!.id,
        uploaded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setUploadOpen(false);
      setTitle("");
      setFileUrl("");
      setDocType("");
      qc.invalidateQueries({ queryKey: ["tenant-documents"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document removed");
      qc.invalidateQueries({ queryKey: ["tenant-documents"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading documents\u2026</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Tenant Portal</p>
          <h1 className="display text-3xl font-bold">My Documents</h1>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rent Receipt" />
              </div>
              <div>
                <Label>Type</Label>
                <Input className="mt-1.5" value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="e.g. receipt, contract, id" />
              </div>
              <div>
                <Label>File *</Label>
                <FileUpload value={fileUrl} onChange={setFileUrl} label="Select file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" maxSizeMB={10} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button onClick={() => upload.mutate()} disabled={!title || !fileUrl || upload.isPending}>
                {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {(!documents || documents.length === 0) ? (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            No documents uploaded yet. Click the button above to upload your first document.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {(documents as any[]).map((doc: any) => (
            <Card key={doc.id} className="shadow-card">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-accent/10 p-2">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.doc_type ?? "General"} &middot; {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.file_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        <Download className="mr-1 h-3 w-3" /> View
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(doc.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
