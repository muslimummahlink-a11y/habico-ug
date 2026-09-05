import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Wrench, Loader2, AlertTriangle, CheckCircle, Plus, Clock, Download, Image } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/tenant/maintenance")({
  component: TenantMaintenance,
});

function TenantMaintenance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [fileUrl, setFileUrl] = useState("");

  const { data: lease } = useQuery({
    queryKey: ["tenant-lease", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return null;
      const { data } = await supabase
        .from("leases")
        .select("*, units!inner(unit_number, floor_number, monthly_rent, properties(name, location, owner_id))")
        .eq("id", tenant.lease_id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["tenant-maintenance", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return [];
      const { data: leaseData } = await supabase.from("leases").select("unit_id").eq("id", tenant.lease_id).single();
      if (!leaseData) return [];
      const { data } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("unit_id", leaseData.unit_id)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) throw new Error("No active lease");
      const { data: leaseData } = await supabase.from("leases").select("unit_id").eq("id", tenant.lease_id).single();
      if (!leaseData) throw new Error("No unit found");
      if (!title.trim()) throw new Error("Title is required");
      if (!description.trim()) throw new Error("Description is required");

      const { error } = await supabase.from("maintenance_requests").insert({
        unit_id: leaseData.unit_id,
        tenant_id: tenant.id,
        title,
        description,
        priority,
        status: "pending",
        images: fileUrl ? [fileUrl] : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-maintenance"] });
      toast.success("Maintenance request submitted");
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setFileUrl("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const statusColors = {
    pending: "secondary",
    in_progress: "default",
    completed: "default",
    rejected: "destructive",
  } as const;

  const priorityColors = {
    low: "secondary",
    medium: "default",
    high: "default",
    urgent: "destructive",
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground">Report and track maintenance issues for your unit</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" /> Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Report Maintenance Issue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Issue Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking kitchen faucet" />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                    <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
                    <SelectItem value="high">High - Significant issue</SelectItem>
                    <SelectItem value="urgent">Urgent - Safety/health hazard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Attach Photo (Optional)</Label>
                <FileUpload value={fileUrl} onChange={setFileUrl} label="Upload photo" accept="image/*" maxSizeMB={5} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Submitting...</span> : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3"><Wrench className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{requests.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-yellow-100 p-3"><Clock className="h-6 w-6 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{requests.filter((r: any) => r.status === "pending").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3"><Wrench className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{requests.filter((r: any) => r.status === "in_progress").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{requests.filter((r: any) => r.status === "completed").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No maintenance requests yet</p>
              <p className="text-sm text-muted-foreground">Click "Report Issue" to create your first request</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "completed" ? "default" : r.status === "in_progress" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                          {r.status?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.priority === "urgent" ? "destructive" : r.priority === "high" ? "default" : r.priority === "medium" ? "default" : "secondary"}>
                          {r.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{format(new Date(r.updated_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast.info(`Details: ${r.description}`)}>View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}