import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, FolderOpen } from "lucide-react";

export const Route = createFileRoute("/tenant/documents")({
  component: TenantDocuments,
});

function TenantDocuments() {
  const { user } = useAuth();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["tenant-portal-documents", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("related_type", "tenant")
        .eq("related_id", user.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground">Files shared with you by your property manager</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">My Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <FolderOpen className="h-10 w-10" />
              <p className="font-medium">No documents yet</p>
              <p className="text-sm">Uploaded contracts and notices will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-accent/10 p-2">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.title || "Untitled document"}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.doc_type || "Document"} · {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  {doc.file_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        <Download className="mr-1 h-3.5 w-3.5" /> View
                      </a>
                    </Button>
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