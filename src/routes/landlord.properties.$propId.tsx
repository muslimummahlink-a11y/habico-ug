import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, ArrowLeft, DoorOpen, MapPin } from "lucide-react";

export const Route = createFileRoute("/landlord/properties/$propId")({
  component: LandlordPropertyDetail,
});

function LandlordPropertyDetail() {
  const { propId } = Route.useParams();
  const { user } = useAuth();

  const { data: property, isLoading } = useQuery({
    queryKey: ["landlord-property-detail", propId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select(
          "id, name, location, property_type, description, amenities, utilities, created_at, units!inner(id, unit_number, monthly_rent, status, floor_number)"
        )
        .eq("id", propId)
        .eq("owner_id", user?.id)
        .single();
      if (!data) throw notFound();
      return data as any;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-4 py-16 text-center text-muted-foreground">
        <Building2 className="mx-auto h-10 w-10" />
        <p className="font-medium">Property not found</p>
        <Button asChild variant="outline">
          <Link to="/landlord/properties">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Properties
          </Link>
        </Button>
      </div>
    );
  }

  const unitCount = property.units?.length ?? 0;
  const occupied = (property.units ?? []).filter((u: any) => u.status === "occupied").length;
  const statusLabel = unitCount > 0 && occupied === unitCount ? "occupied" : unitCount > 0 ? "partial" : "vacant";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/landlord/properties" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Properties
            </Link>
          </div>
          <h1 className="display text-3xl font-bold">{property.name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {property.location || "Location not set"}
          </p>
        </div>
        <Badge variant={statusLabel === "occupied" ? "default" : statusLabel === "partial" ? "secondary" : "outline"}>
          {statusLabel === "occupied" ? "Fully occupied" : statusLabel === "partial" ? "Partially occupied" : "Vacant"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Units</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{unitCount}</div></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Occupied</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{occupied}</div></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Type</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold capitalize">{property.property_type || "Property"}</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Units</CardTitle>
        </CardHeader>
        <CardContent>
          {unitCount === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <DoorOpen className="mx-auto mb-2 h-8 w-8" />
              <p className="font-medium">No units yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(property.units ?? []).map((unit: any) => (
                <div key={unit.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Unit {unit.unit_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Floor {unit.floor_number || "—"} · UGX {Number(unit.monthly_rent ?? 0).toLocaleString()}/mo
                    </p>
                  </div>
                  <Badge variant={unit.status === "occupied" ? "default" : unit.status === "maintenance" ? "secondary" : "outline"}>
                    {unit.status || "vacant"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {property.description && (
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{property.description}</p></CardContent>
        </Card>
      )}
    </div>
  );
}