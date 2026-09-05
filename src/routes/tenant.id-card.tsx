import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/tenant/id-card")({
  component: TenantIdCard,
});

function TenantIdCard() {
  const { user } = useAuth();

  const { data: card, isLoading } = useQuery({
    queryKey: ["tenant-portal-id-card", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("rental_id_cards")
        .select(
          "*, tenants!inner(id, full_name, email), units!left(id, unit_number, floor_number, properties(id, name, location))"
        )
        .eq("tenants.auth_user_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as any[];
      return list.find((c) => c.status === "active") ?? list[0] ?? null;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">ID Card</h1>
        <p className="text-sm text-muted-foreground">Your rental identification card details</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Rental ID Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !card ? (
            <div className="py-12 text-center text-muted-foreground">
              <CreditCard className="mx-auto mb-3 h-10 w-10" />
              <p className="font-medium">No ID card issued</p>
              <p className="text-sm">Contact your property manager to get your rental ID card</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Card Number</p>
                  <p className="font-mono text-lg font-semibold">{card.card_number}</p>
                </div>
                <Badge variant={card.status === "active" ? "default" : "secondary"}>{card.status || "unknown"}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{card.tenants?.full_name || card.tenants?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{card.tenants?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="font-medium">{card.units?.unit_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Floor</p>
                  <p className="font-medium">{card.units?.floor_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Property</p>
                  <p className="font-medium">{card.units?.properties?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{card.units?.properties?.location || "—"}</p>
                </div>
              </div>
              {card.access_pin && (
                <div className="flex items-center gap-2 rounded-lg border bg-accent/5 p-3 text-sm">
                  <KeyRound className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">Access PIN:</span>
                  <span className="font-mono font-semibold">{card.access_pin}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}