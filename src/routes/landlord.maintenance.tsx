import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Loader2, Clock, CheckCircle, Plus, AlertTriangle, Building2, Home, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/landlord/maintenance")({
  component: LandlordMaintenance,
});

const maintenanceStatusLabel: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Completed",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
  rejected: "Rejected",
};

function LandlordMaintenance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [status, setStatus] = useState("pending");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  const { data: requests = [] } = useQuery({
    queryKey: ["landlord-maintenance", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*, units!inner(unit_number, property_id, properties(name, location, owner_id)), tenants(full_name, phone, email)")
        .eq("units.properties.owner_id", user?.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: requestImages = {} } = useQuery({
    queryKey: ["landlord-maintenance-images", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_images")
        .select("*")
        .order("created_at", { ascending: true });

      const grouped: Record<string, any[]> = {};
      for (const row of (data ?? []) as any[]) {
        const requestId = row.maintenance_request_id || row.request_id;
        if (!requestId) continue;
        grouped[requestId] = grouped[requestId] || [];
        grouped[requestId].push({ ...row, image_type: row.image_type || row.type || "general" });
      }
      return grouped;
    },
    enabled: !!user,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["landlord-vendors", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, phone, email").eq("role", "vendor");
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status: newStatus, assignedTo: vendorId, notes: resolutionNotes }: { id: string; status: string; assignedTo?: string; notes?: string }) => {
      const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (vendorId) updates.assigned_to = vendorId;
      if (resolutionNotes) updates.resolution_notes = resolutionNotes;
      const { error } = await supabase.from("maintenance_requests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["landlord-maintenance"] }); toast.success("Request updated"); setAssignModalOpen(false); },
    onError: (e) => toast.error((e as Error).message),
  });

  const statusColors = { pending: "secondary", in_progress: "default", completed: "default", resolved: "default", rejected: "destructive" } as const;
  const priorityColors = { low: "secondary", medium: "default", high: "default", urgent: "destructive" } as const;

  const renderPhotoStrip = (images: any[] = []) => {
    if (!images.length) return <p className="text-xs text-muted-foreground">No photos uploaded yet.</p>;
    return (
      <div className="flex flex-wrap gap-2">
        {images.slice(0, 4).map((img: any) => (
          <img key={img.id} src={img.image_url || img.url} alt={img.image_type || "Maintenance photo"} className="h-16 w-16 rounded-md object-cover border border-border" />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Maintenance</h1>
        <p className="text-sm text-muted-foreground">Manage maintenance requests across your properties</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Wrench className="mx-auto mb-2 h-8 w-8" /><p>No maintenance requests</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Property / Unit</TableHead><TableHead>Tenant</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Assigned To</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {requests.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell><div><p className="font-medium">{r.units?.properties?.name}</p><p className="text-sm text-muted-foreground">Unit {r.units?.unit_number}</p></div></TableCell>
                      <TableCell><div><p className="font-medium">{r.tenants?.full_name}</p><p className="text-sm text-muted-foreground">{r.tenants?.phone}</p></div></TableCell>
                      <TableCell><Badge variant={r.priority === "urgent" ? "destructive" : r.priority === "high" ? "default" : r.priority === "medium" ? "default" : "secondary"}>{r.priority}</Badge></TableCell>
                      <TableCell><Badge variant={r.status === "completed" || r.status === "resolved" ? "default" : r.status === "in_progress" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{maintenanceStatusLabel[r.status] || r.status}</Badge></TableCell>
                      <TableCell>{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{r.assigned_to ? "Assigned" : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.status !== "completed" && r.status !== "resolved" && r.status !== "rejected" && (
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(r); setStatus("in_progress"); setAssignModalOpen(true); }}><Clock className="mr-1 h-3 w-3" /> Assign</Button>
                          )}
                          {(r.status === "in_progress" || r.status === "open") && (
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => { setSelectedRequest(r); setStatus("resolved"); setAssignModalOpen(true); }}><CheckCircle className="mr-1 h-3 w-3" /> Complete</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {requests.map((request: any) => {
            const images = requestImages[request.id] || [];
            const beforeImages = images.filter((img: any) => (img.image_type || "general") === "before");
            const afterImages = images.filter((img: any) => (img.image_type || "general") === "after");

            return (
              <Card key={request.id} className="shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{request.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{request.units?.properties?.name} · Unit {request.units?.unit_number}</p>
                    </div>
                    <Badge variant={request.status === "resolved" || request.status === "completed" ? "default" : request.status === "in_progress" ? "secondary" : request.status === "rejected" ? "destructive" : "outline"}>
                      {maintenanceStatusLabel[request.status] || request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>{request.description}</p>
                  </div>

                  {(request.status === "resolved" || request.status === "completed") && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      <div className="flex items-center gap-2 font-medium"><CheckCircle className="h-4 w-4" /> Work completed</div>
                      <p className="mt-2">{request.resolution_notes || "The maintenance team has completed the work and marked it as finished."}</p>
                      {request.actual_cost && <p className="mt-2">Actual cost: UGX {Number(request.actual_cost).toLocaleString()}</p>}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground">Tenant:</span> {request.tenants?.full_name || "—"}</div>
                    <div><span className="font-medium text-foreground">Priority:</span> {request.priority}</div>
                    <div><span className="font-medium text-foreground">Created:</span> {format(new Date(request.created_at), "MMM d, yyyy")}</div>
                    <div><span className="font-medium text-foreground">Assigned:</span> {request.assigned_to ? "Vendor assigned" : "Not assigned"}</div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Before</p>
                      {renderPhotoStrip(beforeImages)}
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">After</p>
                      {renderPhotoStrip(afterImages)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogTrigger asChild><Button variant="ghost" size="sm" className="hidden"><Plus className="mr-1 h-3 w-3" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Completed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Assign Vendor (Optional)</Label><Select value={assignedTo} onValueChange={setAssignedTo}><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger><SelectContent>{vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.full_name} ({v.phone})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Notes / Resolution</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resolution details..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignModalOpen(false); setSelectedRequest(null); setStatus("pending"); setAssignedTo(""); setNotes(""); }}>Cancel</Button>
            <Button onClick={() => { updateMutation.mutate({ id: selectedRequest?.id, status, assignedTo, notes }); setSelectedRequest(null); }} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}