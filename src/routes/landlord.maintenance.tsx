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

  const statusColors = { pending: "secondary", in_progress: "default", completed: "default", rejected: "destructive" } as const;
  const priorityColors = { low: "secondary", medium: "default", high: "default", urgent: "destructive" } as const;

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
                      <TableCell><Badge variant={r.status === "completed" ? "default" : r.status === "in_progress" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge></TableCell>
                      <TableCell>{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{r.assigned_to ? "Assigned" : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.status !== "completed" && r.status !== "rejected" && (
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(r); setStatus("in_progress"); setAssignModalOpen(true); }}><Clock className="mr-1 h-3 w-3" /> Assign</Button>
                          )}
                          {r.status === "in_progress" && (
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => { setSelectedRequest(r); setStatus("completed"); setAssignModalOpen(true); }}><CheckCircle className="mr-1 h-3 w-3" /> Complete</Button>
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

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogTrigger asChild><Button variant="ghost" size="sm" className="hidden"><Plus className="mr-1 h-3 w-3" /></Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div>
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