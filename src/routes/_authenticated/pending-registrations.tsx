// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, Clock, Loader2, Mail, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { verifyRegistrationPayment } from "@/lib/verifyRegistrationPayment.functions";
import { resendLicenseEmail } from "@/lib/resendLicenseEmail.functions";

export const Route = createFileRoute("/_authenticated/pending-registrations")({
  head: () => ({ meta: [{ title: "Pending Registrations — Habico Portal" }] }),
  component: PendingRegistrationsPage,
});

type PendingRegistration = {
  id: string;
  plan_id: string | null;
  transaction_id: string;
  amount: number;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  admin_name: string;
  admin_email: string;
  admin_phone: string | null;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

function PendingRegistrationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const [detailReg, setDetailReg] = useState<PendingRegistration | null>(null);
  const [verifyingReg, setVerifyingReg] = useState<PendingRegistration | null>(null);
  const [verifyTid, setVerifyTid] = useState("");
  const [rejectReg, setRejectReg] = useState<PendingRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (!isStaff) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>;
  }

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["pending-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pending_registrations" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PendingRegistration[];
    },
  });

  const pending = registrations.filter((r) => r.status === "pending");
  const verified = registrations.filter((r) => r.status === "verified");
  const rejected = registrations.filter((r) => r.status === "rejected");

  const verifyMutation = useMutation({
    mutationFn: async ({ id, tid }: { id: string; tid: string }) => {
      const result = await verifyRegistrationPayment({ data: { pendingId: id, transactionId: tid } });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      toast.success("Registration verified and company created!");
      setVerifyingReg(null);
      setVerifyTid("");
    },
    onError: (err) => toast.error((err as any)?.message || "Verification failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.from("pending_registrations" as any).update({
        status: "rejected",
        rejection_reason: reason,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      toast.success("Registration rejected");
      setRejectReg(null);
      setRejectReason("");
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to reject"),
  });

  const handleReject = () => {
    if (!rejectReg || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectReg.id, reason: rejectReason.trim() });
  };

  const resendMutation = useMutation({
    mutationFn: async (adminEmail: string) => {
      const result = await resendLicenseEmail({ data: { adminEmail } });
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => toast.success("License email resent!"),
    onError: (err) => toast.error((err as any)?.message || "Failed to resend email"),
  });

  const dash = "\u2014";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pending Registrations</h1>
          <p className="text-sm text-muted-foreground">Verify mobile money payments and activate new companies</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground">
              UGX {pending.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verified.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejected.length}</div>
          </CardContent>
        </Card>
      </div>

      <EntityCardGrid
        data={registrations}
        isLoading={isLoading}
        searchFields={["company_name", "admin_name", "admin_email", "transaction_id"]}
        filterField="status"
        filterOptions={[
          { label: "Pending", value: "pending" },
          { label: "Verified", value: "verified" },
          { label: "Rejected", value: "rejected" },
        ]}
        keyExtractor={(item) => item.id}
        titleField="company_name"
        subtitleField="admin_name"
        statusField="status"
        metricFields={[
          { key: "amount", label: "Amount", format: "currency" },
          { key: "transaction_id", label: "Transaction ID" },
        ]}
        emptyMessage="No registrations found"
        cardActions={(item) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDetailReg(item)}>
              <Eye className="mr-1 h-3 w-3" /> View
            </Button>
            {item.status === "pending" && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setVerifyingReg(item); setVerifyTid(""); }}>
                  <CheckCircle className="mr-1 h-3 w-3" /> Verify
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => { setRejectReg(item); setRejectReason(""); }}>
                  <XCircle className="mr-1 h-3 w-3" /> Reject
                </Button>
              </>
            )}
            {item.status === "verified" && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => resendMutation.mutate(item.admin_email)} disabled={resendMutation.isPending}>
                {resendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="mr-1 h-3 w-3" />} Resend
              </Button>
            )}
          </>
        )}
      />

      <Dialog open={!!detailReg} onOpenChange={(v) => { if (!v) setDetailReg(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registration Details</DialogTitle></DialogHeader>
          {detailReg && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold">Company Info</h3></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Company</Label><p className="font-medium">{detailReg.company_name}</p></div>
                  <div><Label>Email</Label><p>{detailReg.company_email || dash}</p></div>
                  <div><Label>Phone</Label><p>{detailReg.company_phone || dash}</p></div>
                  <div><Label>Address</Label><p>{detailReg.company_address || dash}</p></div>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold">Admin Account</h3></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><p className="font-medium">{detailReg.admin_name}</p></div>
                  <div><Label>Email</Label><p>{detailReg.admin_email}</p></div>
                  <div><Label>Phone</Label><p>{detailReg.admin_phone || dash}</p></div>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold">Payment</h3></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Transaction ID</Label><p className="font-mono text-xs">{detailReg.transaction_id}</p></div>
                  <div><Label>Amount</Label><p className="font-semibold">UGX {Number(detailReg.amount).toLocaleString()}</p></div>
                  <div><Label>Submitted</Label><p>{new Date(detailReg.created_at).toLocaleString()}</p></div>
                </div>
              </div>
              {detailReg.rejection_reason && (
                <div>
                  <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold text-red-600">Rejection Reason</h3></div>
                  <p>{detailReg.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!verifyingReg} onOpenChange={(o) => { if (!o) { setVerifyingReg(null); setVerifyTid(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verify Payment</DialogTitle></DialogHeader>
          {verifyingReg && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Registrant TID: <strong className="font-mono">{verifyingReg.transaction_id}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Enter the matching TID from your own mobile money confirmation message.
              </p>
              <div>
                <Label>Your Transaction ID (TID)</Label>
                <Input
                  className="mt-1.5 font-mono"
                  value={verifyTid}
                  onChange={(e) => setVerifyTid(e.target.value)}
                  placeholder="Enter TID from your phone"
                  maxLength={20}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVerifyingReg(null)}>Cancel</Button>
                <Button
                  onClick={() => verifyMutation.mutate({ id: verifyingReg.id, tid: verifyTid })}
                  disabled={!verifyTid || verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify &amp; Complete Registration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectReg} onOpenChange={(o) => { if (!o) { setRejectReg(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Registration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason for Rejection</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why the payment could not be verified"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejectReg(null); setRejectReason(""); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || rejectMutation.isPending}>
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
