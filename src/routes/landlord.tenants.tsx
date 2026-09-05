import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, AlertTriangle, CheckCircle, Building2, Home, CreditCard, Mail, Phone, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/landlord/tenants")({
  component: LandlordTenants,
});

function LandlordTenants() {
  const { user } = useAuth();

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, units!inner(id, unit_number, monthly_rent, status, leases!inner(tenant_id, monthly_rent, outstanding_balance, status, start_date, end_date, tenants(full_name, phone, email, id_type, id_number, emergency_contact_name, emergency_contact_phone)))")
        .eq("owner_id", user?.id);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const allTenants = properties.flatMap((prop: any) =>
    (prop.units ?? []).flatMap((unit: any) =>
      (unit.leases ?? []).map((lease: any) => ({
        ...lease.tenants,
        unit_number: unit.unit_number,
        unit_id: unit.id,
        property_id: prop.id,
        property_name: prop.name,
        property_location: prop.location,
        monthly_rent: lease.monthly_rent,
        outstanding_balance: lease.outstanding_balance,
        lease_status: lease.status,
        lease_start: lease.start_date,
        lease_end: lease.end_date,
      }))
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl font-bold">Tenants</h1>
        <p className="text-sm text-muted-foreground">Manage and view all tenants across your properties</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Tenants ({allTenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allTenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8" />
              <p>No tenants found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Lease Status</TableHead>
                    <TableHead>Lease Period</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTenants.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.full_name ?? "—"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.property_name}</p>
                          <p className="text-sm text-muted-foreground">Unit {t.unit_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {t.phone}</div>
                          <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {t.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">UGX {Number(t.monthly_rent ?? 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={Number(t.outstanding_balance ?? 0) > 0 ? "destructive" : "default"}>
                          {Number(t.outstanding_balance ?? 0) > 0 ? `UGX ${Number(t.outstanding_balance).toLocaleString()}` : "Clear"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.lease_status === "active" ? "default" : t.lease_status === "ended" ? "secondary" : "destructive"}>
                          {t.lease_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{t.lease_start ? format(new Date(t.lease_start), "MMM d, yyyy") : "—"} → {t.lease_end ? format(new Date(t.lease_end), "MMM d, yyyy") : "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View Details</Button>
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