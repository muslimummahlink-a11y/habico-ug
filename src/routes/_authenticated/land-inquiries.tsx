// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Phone, Mail, MessageSquare, Loader2, MapPin, Home, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/land-inquiries")({
  head: () => ({ meta: [{ title: "Land Inquiries — Habico Portal" }] }),
  component: LandInquiriesPage,
});

type Inquiry = {
  id: string;
  property_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: "new" | "contacted" | "resolved" | "archived";
  created_at: string;
  properties?: { name: string; location: string | null } | null;
};

function LandInquiriesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["land-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("land_inquiries")
        .select("*, properties(name, location)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Inquiry[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("land_inquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-inquiries"] });
      toast.success("Inquiry updated");
      setSelected(null);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="mb-6">
        <h1 className="display text-2xl font-bold">Land Inquiries</h1>
        <p className="text-sm text-muted-foreground">Manage inquiries from the Land for Sale page</p>
      </div>

      <EntityCardGrid
        data={inquiries}
        isLoading={isLoading}
        searchFields={["name", "phone", "email"]}
        filterField="status"
        filterOptions={[
          { label: "New", value: "new" },
          { label: "Contacted", value: "contacted" },
          { label: "Resolved", value: "resolved" },
          { label: "Archived", value: "archived" },
        ]}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="phone"
        statusField="status"
        metricFields={[
          { key: "phone", label: "Phone" },
          { key: "created_at", label: "Date", format: "date" },
        ]}
        emptyMessage="No inquiries found"
        cardActions={(item) => (
          <>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setSelected(item)}>
              <MessageSquare className="mr-1 h-3 w-3" /> Details
            </Button>
            {item.status === "new" && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => updateStatus.mutate({ id: item.id, status: "contacted" })}>
                Mark Contacted
              </Button>
            )}
            {item.status === "contacted" && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => updateStatus.mutate({ id: item.id, status: "resolved" })}>
                Resolve
              </Button>
            )}
          </>
        )}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Inquiry Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>Phone:</strong> <a href={`tel:${selected.phone}`} className="text-accent hover:underline">{selected.phone}</a></div>
              {selected.email && <div><strong>Email:</strong> <a href={`mailto:${selected.email}`} className="text-accent hover:underline">{selected.email}</a></div>}
              {selected.properties && <div><strong>Property:</strong> {selected.properties.name}{selected.properties.location ? ` - ${selected.properties.location}` : ""}</div>}
              {selected.message && <div><strong>Message:</strong><p className="mt-1 rounded bg-muted p-2">{selected.message}</p></div>}
              <div className="flex gap-2 pt-2">
                {selected.status === "new" && <Button size="sm" onClick={() => updateStatus.mutate({ id: selected.id, status: "contacted" })}>Mark Contacted</Button>}
                {selected.status === "contacted" && <Button size="sm" onClick={() => updateStatus.mutate({ id: selected.id, status: "resolved" })}>Mark Resolved</Button>}
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: selected.id, status: "archived" })}>Archive</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
