// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { CheckCircle, XCircle, Eye, Receipt, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/payment-proofs")({
  component: PaymentProofs,
});

type PaymentProof = {
  id: string;
  payment_id: string | null;
  tenant_id: string | null;
  lease_id: string | null;
  payer_name: string;
  payment_provider: "mtn_momo" | "airtel_money" | "bank_transfer" | "other";
  transaction_reference: string;
  amount: number;
  payment_date: string;
  proof_image_url: string;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
};

const providerBadge = (provider: PaymentProof["payment_provider"]) => {
  const styles: Record<string, string> = {
    mtn_momo: "bg-yellow-100 text-yellow-800 border-yellow-300",
    airtel_money: "bg-red-100 text-red-800 border-red-300",
    bank_transfer: "bg-gray-100 text-gray-800 border-gray-300",
    other: "bg-blue-100 text-blue-800 border-blue-300",
  };
  const labels: Record<string, string> = {
    mtn_momo: "MTN MoMo",
    airtel_money: "Airtel Money",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[provider] || styles.other}`}
    >
      {labels[provider] || provider}
    </span>
  );
};

const statusBadge = (status: PaymentProof["status"]) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    verified: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });

function PaymentProofs() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const [tab, setTab] = useState<"pending" | "verified" | "rejected">("pending");
  if (!isStaff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const [detailProof, setDetailProof] = useState<PaymentProof | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: proofs = [], isLoading } = useQuery({
    queryKey: ["payment-proofs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_proofs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PaymentProof[];
    },
  });

  const pendingProofs = proofs.filter((p) => p.status === "pending");
  const verifiedProofs = proofs.filter((p) => p.status === "verified");
  const rejectedProofs = proofs.filter((p) => p.status === "rejected");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const verifiedThisMonth = verifiedProofs.filter((p) => p.verified_at && p.verified_at >= startOfMonth);

  const pendingTotal = pendingProofs.reduce((sum, p) => sum + Number(p.amount), 0);
  const verifiedMonthTotal = verifiedThisMonth.reduce((sum, p) => sum + Number(p.amount), 0);

  const currentTabProofs = tab === "pending" ? pendingProofs : tab === "verified" ? verifiedProofs : rejectedProofs;

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_proofs")
        .update({
          status: "verified",
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
      toast.success("Payment proof verified");
    },
    onError: (err) => {
      toast.error((err as any)?.message || "Failed to verify");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("payment_proofs")
        .update({
          status: "rejected",
          rejection_reason: reason,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
      toast.success("Payment proof rejected");
      setRejectOpen(false);
      setRejectId(null);
      setRejectReason("");
    },
    onError: (err) => {
      toast.error((err as any)?.message || "Failed to reject");
    },
  });

  const handleReject = () => {
    if (!rejectId || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectId, reason: rejectReason.trim() });
  };

  return (
    <div className="space-y-6 p-6">
      <PageTour route="/payment-proofs" role={role} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Payment Proofs</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Receipt className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProofs.length}</div>
            <p className="text-xs text-muted-foreground">{formatUGX(pendingTotal)} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verified This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">{formatUGX(verifiedMonthTotal)} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedProofs.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border-b">
        <div className="flex gap-4">
          {(["pending", "verified", "rejected"] as const).map((t) => {
            const count =
              t === "pending" ? pendingProofs.length : t === "verified" ? verifiedProofs.length : rejectedProofs.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <EntityCardGrid
        data={currentTabProofs}
        isLoading={isLoading}
        searchFields={["payer_name", "transaction_reference"]}
        keyExtractor={(item) => item.id}
        titleField="payer_name"
        subtitleField="transaction_reference"
        statusField="status"
        metricFields={[
          { key: "amount", label: "Amount", format: "currency" },
          { key: "payment_date", label: "Date", format: "date" },
        ]}
        emptyMessage={`No ${tab} payment proofs.`}
        cardActions={(proof) => (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setDetailProof(proof)}>
                  <Eye className="h-3 w-3 mr-1" /> View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Payment Proof Detail</DialogTitle>
                </DialogHeader>
                {detailProof && (
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold">Payment Info</h3></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Payer Name</Label>
                          <p className="font-medium">{detailProof.payer_name}</p>
                        </div>
                        <div>
                          <Label>Provider</Label>
                          <div className="mt-1">{providerBadge(detailProof.payment_provider)}</div>
                        </div>
                        <div>
                          <Label>Transaction Reference</Label>
                          <p className="font-mono text-xs">{detailProof.transaction_reference}</p>
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <p className="font-semibold">{formatUGX(Number(detailProof.amount))}</p>
                        </div>
                        <div>
                          <Label>Payment Date</Label>
                          <p>{formatDate(detailProof.payment_date)}</p>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <div className="mt-1">{statusBadge(detailProof.status)}</div>
                        </div>
                      </div>
                    </div>
                    {detailProof.notes && (
                      <div>
                        <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold">Notes</h3></div>
                        <p>{detailProof.notes}</p>
                      </div>
                    )}
                    <div>
                      <div className="border-b pb-2 mb-3"><h3 className="text-sm font-semibold">Proof Details</h3></div>
                      {detailProof.proof_image_url && (
                        <div className="mb-3">
                          <Label>Proof Image</Label>
                          <img
                            src={detailProof.proof_image_url}
                            alt="Payment proof"
                            className="mt-1 rounded border max-h-64 object-contain"
                          />
                        </div>
                      )}
                      {detailProof.rejection_reason && (
                        <div className="mb-2">
                          <Label>Rejection Reason</Label>
                          <p className="mt-1 text-red-600">{detailProof.rejection_reason}</p>
                        </div>
                      )}
                      {detailProof.verified_at && (
                        <div className="text-xs text-muted-foreground">
                          Verified at: {new Date(detailProof.verified_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {proof.status === "pending" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => verifyMutation.mutate(proof.id)}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verify
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setRejectId(proof.id);
                    setRejectReason("");
                    setRejectOpen(true);
                  }}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </>
        )}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Proof</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Rejection Details</h3></div>
              <div>
                <Label htmlFor="reject-reason">Reason for Rejection *</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a detailed reason for rejection. This will be shared with the tenant."
                  className="mt-1"
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">Clearly explain why the proof was rejected so the tenant can resubmit with corrections.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
