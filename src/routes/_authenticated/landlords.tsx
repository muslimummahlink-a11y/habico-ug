import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building2, Plus, Trash2, Landmark, KeyRound, Copy, Printer, Check, X, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { createLandlord } from "@/lib/createLandlord.functions";
import { resetLandlordPassword } from "@/lib/resetLandlordPassword.functions";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/landlords")({
  head: () => ({ meta: [{ title: "Landlords — Habico Portal" }] }),
  component: LandlordsPage,
});

interface OwnerWithProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  propertyCount: number;
  properties: { id: string; name: string }[];
}

function LandlordsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", phone: "", password: "" });

  const { data: landlords = [], isLoading } = useQuery({
    queryKey: ["landlords"],
    queryFn: async () => {
      const { data: ownerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "owner");
      const ids = (ownerRoles ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (ids.length === 0) return [];

      const [profilesRes, propsRes] = await Promise.all([
        supabase.from("profiles").select("*").in("id", ids),
        supabase.from("properties").select("id,name,owner_id").in("owner_id", ids),
      ]);

      const profiles = (profilesRes.data as any[]) ?? [];
      const allProps = (propsRes.data as any[]) ?? [];

      return profiles.map((p: any) => {
        const ownerProps = allProps.filter((pr: any) => pr.owner_id === p.id);
        return {
          user_id: p.id,
          full_name: p.full_name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          propertyCount: ownerProps.length,
          properties: ownerProps.map((pr: any) => ({ id: pr.id, name: pr.name })),
        };
      }) as OwnerWithProfile[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      try {
        const result = await createLandlord({
          data: {
            email: form.email,
            full_name: form.full_name,
            phone: form.phone || undefined,
            password: form.password || undefined,
          },
        });
        if (!result.success) throw new Error(result.error);
        return result;
      } catch (err: any) {
        if (err?.message?.includes("SUPABASE_SERVICE_ROLE_KEY") || err?.message?.includes("Supabase environment variable")) {
          throw new Error("Server not configured: missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in your Vercel project environment variables.");
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Landlord created successfully");
      setAddOpen(false);
      setForm({ email: "", full_name: "", phone: "", password: "" });
      qc.invalidateQueries({ queryKey: ["landlords"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create landlord. Check server configuration."),
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "owner");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Landlord role removed");
      qc.invalidateQueries({ queryKey: ["landlords"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const [resetFor, setResetFor] = useState<OwnerWithProfile | null>(null);
  const [newPw, setNewPw] = useState("");
  const [issuedPw, setIssuedPw] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!resetFor) throw new Error("No landlord selected");
      const res = await resetLandlordPassword({
        data: { user_id: resetFor.user_id, password: newPw || undefined },
      });
      if (!res.success) throw new Error(res.error);
      return res.password;
    },
    onSuccess: (pw) => {
      setIssuedPw(pw);
      setNewPw("");
      toast.success("Password updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const [manageFor, setManageFor] = useState<OwnerWithProfile | null>(null);
  const [linkPropId, setLinkPropId] = useState("");

  const { data: unlinkedProps = [] } = useQuery({
    queryKey: ["unlinked-properties"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id,name").is("owner_id", null);
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: !!manageFor,
  });

  const linkMutation = useMutation({
    mutationFn: async ({ propertyId, ownerId }: { propertyId: string; ownerId: string }) => {
      const { error } = await supabase.from("properties").update({ owner_id: ownerId }).eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property linked");
      setLinkPropId("");
      qc.invalidateQueries({ queryKey: ["landlords"] });
      qc.invalidateQueries({ queryKey: ["unlinked-properties"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase.from("properties").update({ owner_id: null }).eq("id", propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property unlinked");
      qc.invalidateQueries({ queryKey: ["landlords"] });
      qc.invalidateQueries({ queryKey: ["unlinked-properties"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });

  const editMutation = useMutation({
    mutationFn: async ({ userId, ...data }: { userId: string; full_name: string; email: string; phone: string }) => {
      const { error } = await supabase.from("profiles").update(data).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Landlord updated");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["landlords"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function startEdit(l: OwnerWithProfile) {
    setEditForm({ full_name: l.full_name, email: l.email, phone: l.phone });
    setEditingId(l.user_id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <PageTour route="/landlords" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Property Owners</div>
          <h1 className="display text-3xl font-bold">Landlords</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {landlords.length} registered landlord{landlords.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {landlords.length > 0 && (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Print List
            </Button>
          )}
        {isStaff && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />Add Landlord
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Register a new landlord</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Mugisha" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. landlord@email.com" />
                  <p className="mt-1 text-xs text-muted-foreground">This will be the landlord's login email.</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +256 700 000 000" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to auto-generate" />
                  <p className="mt-1 text-xs text-muted-foreground">If left blank, a random password will be generated.</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => addMutation.mutate()} disabled={!form.full_name || !form.email || addMutation.isPending}>
                  {addMutation.isPending ? "Creating..." : "Create Landlord Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading landlords...</div>
      ) : landlords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Landmark className="h-10 w-10 text-muted-foreground" />
            <div className="font-medium">No landlords registered yet</div>
            <div className="text-sm text-muted-foreground">Add your first landlord to link them to properties.</div>
          </CardContent>
        </Card>
      ) : (
        <div id="print-area" className="rounded-lg border">
          <div className="hidden print:block p-6 text-center border-b">
            <h2 className="text-lg font-bold">Landlords List — Habico</h2>
            <p className="text-sm text-muted-foreground">{landlords.length} registered landlord{landlords.length === 1 ? "" : "s"}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Properties</TableHead>
                {isStaff && <TableHead className="text-right no-print">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {landlords.map((l) => (
                <TableRow key={l.user_id}>
                  <TableCell className="font-medium">
                    {editingId === l.user_id ? (
                      <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="h-8 text-sm" />
                    ) : (
                      l.full_name || "Unnamed"
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === l.user_id ? (
                      <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8 text-sm" />
                    ) : (
                      <span className="text-muted-foreground">{l.email}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === l.user_id ? (
                      <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-8 text-sm" />
                    ) : (
                      <span className="text-muted-foreground">{l.phone || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent print:bg-gray-200 print:text-gray-800">
                      {l.propertyCount}
                    </span>
                  </TableCell>
                  {isStaff && (
                    <TableCell className="text-right no-print">
                      {editingId === l.user_id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600"
                            onClick={() => editMutation.mutate({ userId: l.user_id, ...editForm })}
                            disabled={editMutation.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(l)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setManageFor(l); setLinkPropId(""); }}>
                            <Building2 className="h-3.5 w-3.5 mr-1" /> Properties
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setIssuedPw(null); setNewPw(""); setResetFor(l); }}>
                            <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset PW
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Remove landlord?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the <strong>owner</strong> role from {l.full_name || l.email}. Their profile and linked properties will not be deleted.
                              </AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeMutation.mutate(l.user_id)} className="bg-destructive text-destructive-foreground">
                                Remove Role
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {landlords.length > 0 && (
        <Card className="shadow-card no-print">
          <CardHeader>
            <CardTitle className="display text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>Each landlord has an <strong>owner</strong> role account. They can log in and see their own properties, tenants, and financial reports.</p>
            <p>Use the <strong>Properties</strong> button to link or unlink properties directly to a landlord.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!manageFor} onOpenChange={(o) => { if (!o) { setManageFor(null); setLinkPropId(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Properties — {manageFor?.full_name || manageFor?.email}</DialogTitle>
          </DialogHeader>
          {manageFor && (
            <div className="space-y-4">
              {manageFor.properties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No properties linked yet.</p>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked Properties</Label>
                  {manageFor.properties.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">{p.name}</span>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive h-7"
                        onClick={() => unlinkMutation.mutate(p.id)}
                        disabled={unlinkMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Unlink
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Link a Property</Label>
                <div className="mt-2 flex items-end gap-2">
                  <div className="flex-1">
                    <Select value={linkPropId} onValueChange={setLinkPropId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedProps.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                        {unlinkedProps.length === 0 && (
                          <SelectItem value="_none" disabled>No unlinked properties available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => linkMutation.mutate({ propertyId: linkPropId, ownerId: manageFor.user_id })}
                    disabled={!linkPropId || linkMutation.isPending}
                  >
                    {linkMutation.isPending ? "Linking..." : "Link"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetFor} onOpenChange={(o) => { if (!o) { setResetFor(null); setIssuedPw(null); setNewPw(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password — {resetFor?.full_name || resetFor?.email}</DialogTitle>
          </DialogHeader>
          {issuedPw ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">New password set. Share it securely — it will not be shown again.</p>
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 font-mono text-sm">
                <span className="flex-1 break-all">{issuedPw}</span>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(issuedPw); toast.success("Copied"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Passwords are stored encrypted and cannot be viewed. You can set a new one here, or leave blank to auto-generate.
              </p>
              <div>
                <Label>New password</Label>
                <Input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Leave blank to auto-generate" />
              </div>
            </div>
          )}
          <DialogFooter>
            {issuedPw ? (
              <Button onClick={() => { setResetFor(null); setIssuedPw(null); }}>Done</Button>
            ) : (
              <Button onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
                {resetMutation.isPending ? "Updating..." : "Set new password"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
