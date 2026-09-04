// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wrench, Image, X } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/create-notification";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

const statusColors: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-gray-100 text-gray-800",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-800",
};

const categoryLabels: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  appliance: "Appliance",
  structural: "Structural",
  pest_control: "Pest Control",
  cleaning: "Cleaning",
  landscaping: "Landscaping",
  general: "General",
  other: "Other",
};

function MaintenancePage() {
  const { user } = useAuth();
  const role = useHighestRole();
  const isStaff = role === "staff" || role === "admin";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("general");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [reportedBy, setReportedBy] = useState("");

  const [editStatus, setEditStatus] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editEstimatedCost, setEditEstimatedCost] = useState("");
  const [editActualCost, setEditActualCost] = useState("");
  const [editContractorName, setEditContractorName] = useState("");
  const [editContractorPhone, setEditContractorPhone] = useState("");
  const [editResolutionNotes, setEditResolutionNotes] = useState("");

  const { data: tenantRecord } = useQuery({
    queryKey: ["tenant-record", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("tenants").select("id").eq("auth_user_id", user.id).maybeSingle();
      return (data as any) ?? null;
    },
    enabled: !!user && !isStaff,
  });

  const { data: leases } = useQuery({
    queryKey: ["leases", tenantRecord?.id],
    queryFn: async () => {
      if (!user || isStaff || !tenantRecord?.id) return [];
      const { data } = await supabase
        .from("leases")
        .select("id, unit_id, units!inner(id, name, property_id, properties!inner(id, name))")
        .eq("tenant_id", tenantRecord.id)
        .eq("status", "active");
      return (data as any) || [];
    },
    enabled: !!user && !isStaff && !!tenantRecord?.id,
  });

  const { data: allUnits } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data } = await supabase
        .from("units")
        .select("id, name, property_id, properties(name)");
      return (data as any) || [];
    },
    enabled: isStaff,
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["maintenance_requests"],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_requests")
        .select("*, units!inner(id, name, property_id, properties!inner(id, name))")
        .order("created_at", { ascending: false });

      if (!isStaff && user) {
        const { data: tRec } = await supabase
          .from("tenants")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        const actualTenantId = (tRec as any)?.id;
        if (actualTenantId) {
          const { data: userLeases } = await supabase
            .from("leases")
            .select("unit_id")
            .eq("tenant_id", actualTenantId)
            .eq("status", "active");
          const unitIds = (userLeases as any)?.map((l: any) => l.unit_id) || [];
          if (unitIds.length > 0) {
            query = query.in("unit_id", unitIds);
          } else {
            query = query.eq("unit_id", -1);
          }
        } else {
          query = query.eq("unit_id", -1);
        }
      }

      const { data } = await query;
      return (data as any) || [];
    },
  });

  const { data: imagesMap } = useQuery({
    queryKey: ["maintenance_images"],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_images")
        .select("*")
        .order("created_at", { ascending: true });
      const rows = (data as any) || [];
      const map: Record<string, any[]> = {};
      for (const row of rows) {
        if (!map[row.request_id]) map[row.request_id] = [];
        map[row.request_id].push(row);
      }
      return map;
    },
  });

  const openCount = requests?.filter((r: any) => r.status === "open").length || 0;
  const inProgressCount = requests?.filter((r: any) => r.status === "in_progress").length || 0;
  const now = new Date();
  const completedThisMonth =
    requests?.filter((r: any) => {
      if (r.status !== "resolved") return false;
      const d = new Date(r.resolved_at || r.updated_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length || 0;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        unit_id: unitId,
        title,
        description,
        priority,
        category,
        status: "open",
        created_by: user?.id,
      };
      if (isStaff && estimatedCost) payload.estimated_cost = parseFloat(estimatedCost);
      if (isStaff && reportedBy) payload.reported_by = reportedBy;
      const { error } = await supabase.from("maintenance_requests").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests"] });
      setDialogOpen(false);
      setUnitId("");
      setTitle("");
      setDescription("");
      setPriority("normal");
      setCategory("general");
      setEstimatedCost("");
      setReportedBy("");
      toast.success("Maintenance request created");
      if (user) createNotification(user.id, "Maintenance request created",
        `${title} — ${priority} priority`,
        "/maintenance", "warning");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to create request");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingRequest) return;
      const payload: any = {};
      if (editStatus) payload.status = editStatus;
      if (editCategory) payload.category = editCategory;
      if (editScheduledDate) payload.scheduled_date = editScheduledDate;
      if (editEstimatedCost) payload.estimated_cost = parseFloat(editEstimatedCost);
      if (editActualCost) payload.actual_cost = parseFloat(editActualCost);
      if (editContractorName) payload.contractor_name = editContractorName;
      if (editContractorPhone) payload.contractor_phone = editContractorPhone;
      if (editResolutionNotes) payload.resolution_notes = editResolutionNotes;
      if (editStatus === "resolved") payload.resolved_at = new Date().toISOString();
      const { error } = await supabase
        .from("maintenance_requests")
        .update(payload)
        .eq("id", editingRequest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests"] });
      setEditOpen(false);
      setEditingRequest(null);
      toast.success("Request updated");
      if (user && editStatus) createNotification(user.id, `Maintenance ${editStatus}`,
        editingRequest?.title ? `${editingRequest.title} → ${editStatus}` : undefined,
        "/maintenance", editStatus === "resolved" ? "success" : "info");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to update request");
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ requestId, url }: { requestId: string; url: string }) => {
      const { error } = await supabase.from("maintenance_images").insert({
        request_id: requestId,
        url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_images"] });
      toast.success("Image added");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to add image");
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase.from("maintenance_images").delete().eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_images"] });
      toast.success("Image removed");
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to remove image");
    },
  });

  function openEdit(request: any) {
    setEditingRequest(request);
    setEditStatus(request.status);
    setEditCategory(request.category || "");
    setEditScheduledDate(request.scheduled_date?.split("T")[0] || "");
    setEditEstimatedCost(request.estimated_cost?.toString() || "");
    setEditActualCost(request.actual_cost?.toString() || "");
    setEditContractorName(request.contractor_name || "");
    setEditContractorPhone(request.contractor_phone || "");
    setEditResolutionNotes(request.resolution_notes || "");
    setEditOpen(true);
  }

  return (
    <div className="space-y-6 p-6">
      <PageTour route="/maintenance" role={role} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{completedThisMonth}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading && <p className="text-muted-foreground">Loading...</p>}
        {!isLoading && requests?.length === 0 && (
          <p className="text-muted-foreground">No maintenance requests found.</p>
        )}
        {requests?.map((req: any) => {
          const images = imagesMap?.[req.id] || [];
          return (
            <Card key={req.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{req.title}</h3>
                      {req.category && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          {categoryLabels[req.category] || req.category}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColors[req.status] || ""}`}>
                        {req.status.replace("_", " ")}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[req.priority] || ""}`}>
                        {req.priority}
                      </span>
                    </div>
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{req.units?.name} - {req.units?.properties?.name}</span>
                      {req.estimated_cost && (
                        <span>Est: UGX {Number(req.estimated_cost).toLocaleString()}</span>
                      )}
                      {req.actual_cost && (
                        <span>Actual: UGX {Number(req.actual_cost).toLocaleString()}</span>
                      )}
                      {req.scheduled_date && (
                        <span>Scheduled: {new Date(req.scheduled_date).toLocaleDateString()}</span>
                      )}
                      {req.contractor_name && (
                        <span>Contractor: {req.contractor_name}</span>
                      )}
                    </div>
                    {images.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {images.slice(0, 4).map((img: any) => (
                          <button
                            key={img.id}
                            className="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0 hover:ring-2 hover:ring-ring transition-all"
                            onClick={() => setLightboxUrl(img.url)}
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {images.length > 4 && (
                          <span className="text-xs text-muted-foreground ml-1">+{images.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {isStaff && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(req)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Request Details</h3></div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mt-title">Title *</Label>
                  <Input id="mt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking kitchen faucet" />
                  <p className="mt-1 text-xs text-muted-foreground">Brief, descriptive title of the issue.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mt-desc">Description</Label>
                  <Textarea id="mt-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail. Include any relevant information such as when it started, severity, etc." rows={3} />
                  <p className="mt-1 text-xs text-muted-foreground">Detailed description helps the maintenance team assess and prioritize the issue.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Location</h3></div>
              <div className="space-y-2">
                <Label htmlFor="mt-unit">Unit *</Label>
                <SearchableSelect
                  value={unitId}
                  onValueChange={setUnitId}
                  placeholder="Select unit"
                  options={isStaff
                    ? (allUnits ?? []).map((u: any) => ({ value: u.id, label: `${u.name} - ${u.properties?.name}` }))
                    : (leases ?? []).map((l: any) => ({ value: l.unit_id, label: `${l.units?.name} - ${l.units?.properties?.name}` }))
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">The unit where the issue is located.</p>
              </div>
            </div>
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Classification</h3></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <SearchableSelect
                    value={priority}
                    onValueChange={setPriority}
                    placeholder="Select priority"
                    options={[
                      { value: "low", label: "Low" },
                      { value: "normal", label: "Normal" },
                      { value: "high", label: "High" },
                      { value: "urgent", label: "Urgent" },
                    ]}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Urgent for safety hazards, High for major damage, Normal/Low for routine issues.</p>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <SearchableSelect
                    value={category}
                    onValueChange={setCategory}
                    placeholder="Select category"
                    options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                  />
                </div>
              </div>
            </div>
            {isStaff && (
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Additional Information</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Cost (UGX)</Label>
                    <Input
                      type="number"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="e.g. 200000"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Preliminary cost estimate for budget planning.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Reported By</Label>
                    <Input
                      value={reportedBy}
                      onChange={(e) => setReportedBy(e.target.value)}
                      placeholder="Name of reporter"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!unitId || !title || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          {editingRequest && (
            <div className="space-y-5">
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Status &amp; Classification</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <SearchableSelect
                      value={editStatus}
                      onValueChange={setEditStatus}
                      placeholder="Select status"
                      options={[
                        { value: "open", label: "Open" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "resolved", label: "Resolved" },
                        { value: "cancelled", label: "Cancelled" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <SearchableSelect
                      value={editCategory}
                      onValueChange={setEditCategory}
                      placeholder="Select category"
                      options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Scheduling</h3></div>
                <div className="space-y-2">
                  <Label>Scheduled Date</Label>
                  <Input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Date when maintenance work is scheduled to begin.</p>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Costs &amp; Contractor</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Cost (UGX)</Label>
                    <Input
                      type="number"
                      value={editEstimatedCost}
                      onChange={(e) => setEditEstimatedCost(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Cost (UGX)</Label>
                    <Input
                      type="number"
                      value={editActualCost}
                      onChange={(e) => setEditActualCost(e.target.value)}
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Final cost after completion.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>Contractor Name</Label>
                    <Input
                      value={editContractorName}
                      onChange={(e) => setEditContractorName(e.target.value)}
                      placeholder="e.g. John's Plumbing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contractor Phone</Label>
                    <Input
                      value={editContractorPhone}
                      onChange={(e) => setEditContractorPhone(e.target.value)}
                      placeholder="e.g. +256 700 123456"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Resolution</h3></div>
                <div className="space-y-2">
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={editResolutionNotes}
                    onChange={(e) => setEditResolutionNotes(e.target.value)}
                    placeholder="Describe the work performed, parts used, and any follow-up needed…"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Detailed notes on what was done to resolve this request.</p>
                </div>
              </div>

              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Photos</h3></div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Maintenance Photos
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(imagesMap?.[editingRequest.id] || []).map((img: any) => (
                      <div key={img.id} className="relative group">
                        <button
                          className="w-20 h-20 rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-ring transition-all"
                          onClick={() => setLightboxUrl(img.url)}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                        <button
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteImageMutation.mutate(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FileUpload
                    value=""
                    onChange={(url) => { if (url) uploadImageMutation.mutate({ requestId: editingRequest.id, url }); }}
                    label="Add Photo"
                    accept="image/*"
                    maxSizeMB={5}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Add photos of the issue or completed work for documentation.</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
