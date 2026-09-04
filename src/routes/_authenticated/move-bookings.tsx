// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/use-company-id";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { CalendarCheck, CheckCircle2, XCircle, Clock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/move-bookings")({
  head: () => ({ meta: [{ title: "Move Bookings — Habico Portal" }] }),
  component: MoveBookingsPage,
});

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function MoveBookingsPage() {
  const qc = useQueryClient();
  const role = useHighestRole();
  const { data: companyId, isLoading: companyLoading } = useCompanyId();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["move-bookings", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data }: any = await supabase
        .from("move_bookings" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
    enabled: !!companyId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error }: any = await supabase.from("move_bookings" as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["move-bookings", companyId] });
      toast.success("Booking status updated");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update"),
  });

  if (companyLoading) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">Loading company...</p></div>;
  }
  if (!companyId) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">No company configured. Contact your administrator.</p></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTour route="/move-bookings" role={role} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Services</div>
          <h1 className="display text-3xl font-bold">Move Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage customer move-in and move-out booking requests</p>
        </div>
        <CalendarCheck className="h-8 w-8 text-muted-foreground" />
      </div>

      <EntityCardGrid
        data={bookings}
        isLoading={isLoading}
        searchFields={["customer_name", "customer_phone"]}
        filterField="status"
        filterOptions={[
          { label: "Pending", value: "pending" },
          { label: "Confirmed", value: "confirmed" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ]}
        keyExtractor={(item) => item.id}
        titleField="customer_name"
        subtitleField="customer_phone"
        statusField="status"
        metricFields={[
          { key: "preferred_date", label: "Date", format: "date" },
          { key: "total_price", label: "Amount", format: "currency" },
        ]}
        emptyMessage="No bookings yet"
        cardActions={(b) => (
          <>
            {b.status === "pending" && (
              <>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "confirmed" })}>Confirm</Button>
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "cancelled" })}>Cancel</Button>
              </>
            )}
            {b.status === "confirmed" && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "in_progress" })}>Start</Button>
            )}
            {b.status === "in_progress" && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => updateStatus.mutate({ id: b.id, status: "completed" })}>Complete</Button>
            )}
          </>
        )}
      />
    </div>
  );
}
