// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useRecordActions } from "@/hooks/use-record-actions";
import { Trash2, Edit2, Copy2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/demo-actions")({
  head: () => ({ meta: [{ title: "Demo — Record Actions" }] }),
  component: DemoActionsPage,
});

interface Lead {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  source: string;
  created_at: string;
}

function DemoActionsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leads
  const { data: fetchedLeads, refetch } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      setLeads(data as Lead[]);
      setLoading(false);
    },
    enabled: false, // Will manually trigger
  });

  // Refetch on mount
  useState(() => {
    refetch();
    return () => {};
  });

  const { deleteMutation, editMutation, copyMutation } = useRecordActions({ table: "leads" });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Record Actions Demo</h1>

      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse bg-card rounded-lg shadow">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Contact</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Email</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Phone</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">No leads found</td>
              </tr>
            ) : leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="p-3">{lead.contact_name}</td>
                <td className="p-3">{lead.contact_email}</td>
                <td className="p-3">{lead.contact_phone}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded ${lead.status === "won" ? "bg-green-100 text-green-800" : lead.status === "lost" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="p-3">
                  <RecordActions
                    item={lead}
                    table="leads"
                    onDeleteConfirm={() => {
                      if (deleteMutation.isPending) return;
                      if (window.confirm("Are you sure you want to delete this lead?")) {
                        deleteMutation.mutate(lead.id);
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action status display */}
      <div className="mt-4 space-y-2 text-sm">
        <div>
          <span className="font-medium">Delete:</span> {deleteMutation.isPending ? (
            <span>Deleting...</span>
          ) : (
            <span onClick={() => deleteMutation.mutate(leads[0]?.id ?? "")} className="underline cursor-pointer text-primary hover:text-primary-foreground">
              Click to delete first item
            </span>
          )}
        </div>
        <div>
          <span className="font-medium">Edit:</span> {editMutation.isPending ? (
            <span>Updating...</span>
          ) : (
            <span onClick={() => editMutation.mutate(leads[0]?.id ?? { id: leads[0]?.id, data: { ...leads[0] } })} className="underline cursor-pointer text-primary hover:text-primary-foreground">
              Click to edit first item
            </span>
          )}
        </div>
        <div>
          <span className="font-medium">Copy:</span> {copyMutation.isPending ? (
            <span>Copying...</span>
          ) : (
            <span onClick={() => copyMutation.mutate(leads[0]?.id ?? "")} className="underline cursor-pointer text-primary hover:text-primary-foreground">
              Click to copy first item
            </span>
          )}
        </div>
      </div>
    </div>
  );
}