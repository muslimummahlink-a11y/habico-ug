import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { useCompanyId } from "@/hooks/use-company-id";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StripePaymentForm } from "@/components/ui/stripe-payment-form";
import { createPaymentIntent } from "@/lib/createPaymentIntent.functions";
import { recordStripePayment } from "@/lib/recordStripePayment.functions";
import {
  Building2, Users, Receipt, Wrench, TrendingUp, AlertTriangle,
  ArrowRight, Home, FileText, Calendar, DollarSign, MapPin, Landmark, Link2, CreditCard, Loader2,
  Crown, Check, X, Clock, HardHat, ClipboardList, Gauge,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Habico Portal" }] }),
  component: Dashboard,
});

function GradientMetricCard({
  icon: Icon, label, value, gradient, progress,
}: {
  icon: any; label: string; value: string; gradient: string; progress?: number;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-card">
      <div className={`relative p-6 ${gradient}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/80">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className="rounded-full bg-white/20 p-3">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-2 bg-white/20 [&>*]:bg-white" />
            <p className="text-xs text-white/70">{progress}%</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function useStaffDashboardData() {
  return useQuery({
    queryKey: ["staff-dashboard"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [propsRes, unitsRes, leasesRes, mrRes, ownerRolesRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("units").select("id,status"),
        supabase.from("leases")
          .select("*, units(unit_number, properties(name))")
          .order("created_at", { ascending: false }),
        supabase.from("maintenance_requests").select("id,status"),
        supabase.from("user_roles").select("user_id").eq("role", "owner"),
      ]);

      const propertiesCount = propsRes.count ?? 0;
      const allUnits = (unitsRes.data as any) ?? [];
      const totalUnits = allUnits.length;
      const occupiedUnits = allUnits.filter((u: any) => u.status === "occupied").length;
      const vacantUnits = totalUnits - occupiedUnits;
      const openMR = ((mrRes.data as any) ?? []).filter(
        (m: any) => m.status === "open" || m.status === "in_progress",
      ).length;

      const allLeases = (leasesRes.data as any) ?? [];
      const activeLeases = allLeases.filter((l: any) => l.status === "active");
      const activeLeasesCount = activeLeases.length;
      const expectedRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);

      const tenantIds = [...new Set(activeLeases.map((l: any) => l.tenant_id).filter(Boolean))] as string[];
      let profileMap = new Map<string, any>();
      if (tenantIds.length > 0) {
        const { data: tenantList } = await supabase
          .from("tenants")
          .select("id, full_name, email")
          .in("id", tenantIds);
        profileMap = new Map((tenantList as any[])?.map((t: any) => [t.id, t]) ?? []);
      }

      const activeLeaseIds = activeLeases.map((l: any) => l.id);
      let collectedThisMonth = 0;
      let recentPayments: any[] = [];
      let outstandingBalances: any[] = [];

      if (activeLeaseIds.length > 0) {
        const { data: paymentsRaw } = await supabase
          .from("payments")
          .select("*, leases!inner(monthly_rent, tenant_id, units(unit_number, properties(name)))")
          .in("lease_id", activeLeaseIds)
          .order("payment_date", { ascending: false })
          .limit(10);

        const allPayments = (paymentsRaw as any) ?? [];

        const curMonthPayments = allPayments.filter((p: any) => {
          const d = new Date(p.payment_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        collectedThisMonth = curMonthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

        recentPayments = allPayments.slice(0, 5).map((p: any) => {
          const tenantProfile = profileMap.get(p.leases?.tenant_id);
          return {
            date: p.payment_date,
            tenantName: tenantProfile?.full_name || tenantProfile?.email?.split("@")[0] || "Unknown",
            amount: Number(p.amount),
            method: p.method,
            unit: p.leases?.units
              ? `${p.leases.units.properties?.name} \u00b7 ${p.leases.units.unit_number}`
              : "",
          };
        });

        const paymentsByLease: Record<string, number> = {};
        for (const p of curMonthPayments) {
          paymentsByLease[p.lease_id] = (paymentsByLease[p.lease_id] || 0) + Number(p.amount);
        }

        outstandingBalances = activeLeases
          .map((l: any) => {
            const paid = paymentsByLease[l.id] || 0;
            const profile = profileMap.get(l.tenant_id);
            const elapsed = l.start_date ? Math.floor((now.getTime() - new Date(l.start_date).getTime()) / (30.44 * 86400000)) : 0;
            const covered = Number(l.deposit_months ?? 0);
            const balanceDue = covered >= elapsed ? 0 : Math.max(0, Number(l.monthly_rent) - paid);
            return {
              tenantName: profile?.full_name || profile?.email?.split("@")[0] || "Unknown",
              unit: `${l.units?.properties?.name} \u00b7 ${l.units?.unit_number}`,
              monthlyRent: Number(l.monthly_rent),
              balanceDue,
            };
          })
          .filter((l: any) => l.balanceDue > 0);
      }

      const activeTenantsCount = new Set(activeLeases.map((l: any) => l.tenant_id)).size;

      const expiringLeases = activeLeases
        .filter((l: any) => {
          if (!l.end_date) return false;
          const end = new Date(l.end_date);
          return end >= now && end <= thirtyDaysFromNow;
        })
        .map((l: any) => {
          const profile = profileMap.get(l.tenant_id);
          return {
            tenantName: profile?.full_name || profile?.email?.split("@")[0] || "Unknown",
            unit: `${l.units?.properties?.name} \u00b7 ${l.units?.unit_number}`,
            expiryDate: l.end_date,
            daysRemaining: Math.ceil((new Date(l.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          };
        });

      const collectionRate = expectedRent > 0 ? Math.round((collectedThisMonth / expectedRent) * 100) : 0;
      const uncollected = expectedRent - collectedThisMonth;

      const ownerIds = (ownerRolesRes.data as any[] ?? []).map((r: any) => r.user_id).filter(Boolean);
      let ownerProfiles: any[] = [];
      let ownerProperties: any[] = [];
      if (ownerIds.length > 0) {
        const [profilesRes, ownerPropsRes] = await Promise.all([
          supabase.from("profiles").select("*").in("id", ownerIds),
          supabase.from("properties").select("*").in("owner_id", ownerIds),
        ]);
        ownerProfiles = (profilesRes.data as any) ?? [];
        ownerProperties = (ownerPropsRes.data as any) ?? [];
      }

      return {
        propertiesCount,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        activeLeasesCount,
        activeTenantsCount,
        expectedRent,
        collectedThisMonth,
        collectionRate,
        uncollected,
        recentPayments,
        expiringLeases,
        openMR,
        outstandingBalances,
        ownerProfiles,
        ownerProperties,
      } as any;
    },
  });
}

function useCompanyDashboardData(companyId: string) {
  return useQuery({
    queryKey: ["company-dashboard", companyId],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [planRes, propsRes, unitsRes, leasesRes, mrRes] = await Promise.all([
        supabase.rpc("get_company_plan_status"),
        supabase.from("properties").select("id,owner_id,name,city", { count: "exact", head: false }).eq("company_id", companyId),
        supabase.from("units").select("id,status").eq("company_id", companyId),
        supabase.from("leases")
          .select("*, units!inner(company_id, unit_number, properties(name))")
          .eq("units.company_id", companyId)
          .order("created_at", { ascending: false }),
        supabase.from("maintenance_requests").select("id,status").eq("company_id", companyId),
      ]);

      const planStatus = (planRes.data as any[])?.[0] ?? null;
      const allProperties = (propsRes.data as any) ?? [];
      const propertiesCount = allProperties.length;
      const ownerIds = [...new Set(allProperties.map((p: any) => p.owner_id).filter(Boolean))] as string[];

      let ownerProfiles: any[] = [];
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id,full_name,email,phone").in("id", ownerIds);
        ownerProfiles = (profiles as any) ?? [];
      }

      const landlordList = ownerProfiles.map((prof: any) => ({
        id: prof.id,
        name: prof.full_name || prof.email?.split("@")[0] || "Unknown",
        phone: prof.phone,
        email: prof.email,
        propertiesCount: allProperties.filter((p: any) => p.owner_id === prof.id).length,
        properties: allProperties.filter((p: any) => p.owner_id === prof.id).map((p: any) => ({ id: p.id, name: p.name, city: p.city })),
      }));

      const allUnits = (unitsRes.data as any) ?? [];
      const totalUnits = allUnits.length;
      const occupiedUnits = allUnits.filter((u: any) => u.status === "occupied").length;
      const vacantUnits = totalUnits - occupiedUnits;
      const openMR = ((mrRes.data as any) ?? []).filter(
        (m: any) => m.status === "open" || m.status === "in_progress",
      ).length;

      const allLeases = (leasesRes.data as any) ?? [];
      const activeLeases = allLeases.filter((l: any) => l.status === "active");
      const activeLeasesCount = activeLeases.length;
      const expectedRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);

      const tenantIds = [...new Set(activeLeases.map((l: any) => l.tenant_id).filter(Boolean))] as string[];
      let profileMap = new Map<string, any>();
      if (tenantIds.length > 0) {
        const { data: tenantList } = await supabase
          .from("tenants")
          .select("id, full_name, email")
          .in("id", tenantIds);
        profileMap = new Map((tenantList as any[])?.map((t: any) => [t.id, t]) ?? []);
      }

      const activeLeaseIds = activeLeases.map((l: any) => l.id);
      let collectedThisMonth = 0;
      let recentPayments: any[] = [];
      let outstandingBalances: any[] = [];

      if (activeLeaseIds.length > 0) {
        const { data: paymentsRaw } = await supabase
          .from("payments")
          .select("*, leases!inner(monthly_rent, tenant_id, units!inner(company_id, unit_number, properties(name)))")
          .eq("leases.units.company_id", companyId)
          .in("lease_id", activeLeaseIds)
          .order("payment_date", { ascending: false })
          .limit(10);

        const allPayments = (paymentsRaw as any) ?? [];

        const curMonthPayments = allPayments.filter((p: any) => {
          const d = new Date(p.payment_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        collectedThisMonth = curMonthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

        recentPayments = allPayments.slice(0, 5).map((p: any) => {
          const tenantProfile = profileMap.get(p.leases?.tenant_id);
          return {
            date: p.payment_date,
            tenantName: tenantProfile?.full_name || tenantProfile?.email?.split("@")[0] || "Unknown",
            amount: Number(p.amount),
            method: p.method,
            unit: p.leases?.units
              ? `${p.leases.units.properties?.name} \u00b7 ${p.leases.units.unit_number}`
              : "",
          };
        });

        const paymentsByLease: Record<string, number> = {};
        for (const p of curMonthPayments) {
          paymentsByLease[p.lease_id] = (paymentsByLease[p.lease_id] || 0) + Number(p.amount);
        }

        outstandingBalances = activeLeases
          .map((l: any) => {
            const paid = paymentsByLease[l.id] || 0;
            const profile = profileMap.get(l.tenant_id);
            const elapsed = l.start_date ? Math.floor((now.getTime() - new Date(l.start_date).getTime()) / (30.44 * 86400000)) : 0;
            const covered = Number(l.deposit_months ?? 0);
            const balanceDue = covered >= elapsed ? 0 : Math.max(0, Number(l.monthly_rent) - paid);
            return {
              tenantName: profile?.full_name || profile?.email?.split("@")[0] || "Unknown",
              unit: `${l.units?.properties?.name} \u00b7 ${l.units?.unit_number}`,
              monthlyRent: Number(l.monthly_rent),
              balanceDue,
            };
          })
          .filter((l: any) => l.balanceDue > 0);
      }

      const activeTenantsCount = new Set(activeLeases.map((l: any) => l.tenant_id)).size;

      const expiringLeases = activeLeases
        .filter((l: any) => {
          if (!l.end_date) return false;
          const end = new Date(l.end_date);
          return end >= now && end <= thirtyDaysFromNow;
        })
        .map((l: any) => {
          const profile = profileMap.get(l.tenant_id);
          return {
            tenantName: profile?.full_name || profile?.email?.split("@")[0] || "Unknown",
            unit: `${l.units?.properties?.name} \u00b7 ${l.units?.unit_number}`,
            expiryDate: l.end_date,
            daysRemaining: Math.ceil((new Date(l.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          };
        });

      const collectionRate = expectedRent > 0 ? Math.round((collectedThisMonth / expectedRent) * 100) : 0;
      const uncollected = expectedRent - collectedThisMonth;

      return {
        planStatus,
        propertiesCount,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        activeLeasesCount,
        activeTenantsCount,
        expectedRent,
        collectedThisMonth,
        collectionRate,
        uncollected,
        recentPayments,
        expiringLeases,
        openMR,
        outstandingBalances,
        ownerCount: ownerIds.length,
        landlordList,
      } as any;
    },
  });
}

function useTenantDashboardData(authUserId: string) {
  return useQuery({
    queryKey: ["tenant-dashboard", authUserId],
    queryFn: async () => {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();
      const tenantId = (tenant as any)?.id;
      if (!tenantId) {
        return { leases: [], payments: [], maintenanceRequests: [], unreadCount: 0, outstandingBalance: 0 } as any;
      }

      const [leasesRes, mrRes, msgRes] = await Promise.all([
        supabase.from("leases")
          .select("*, units(unit_number, properties(name))")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false }),
        supabase.from("maintenance_requests")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false }),
        supabase.from("rental_messages")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("is_read", false),
      ]);

      const leases = (leasesRes.data as any) ?? [];
      const activeLeaseIds = leases.filter((l: any) => l.status === "active").map((l: any) => l.id);

      let payments: any[] = [];
      let activeLease: any = null;
      if (activeLeaseIds.length > 0) {
        activeLease = leases.find((l: any) => l.status === "active");
        const { data: pData } = await supabase
          .from("payments")
          .select("*, leases!inner(monthly_rent, units(unit_number, properties(name)))")
          .in("lease_id", activeLeaseIds)
          .order("payment_date", { ascending: false })
          .limit(10);
        payments = (pData as any) ?? [];
      }

      const unreadCount = msgRes.count ?? 0;
      let outstandingBalance = 0;
      if (activeLease) {
        const elapsed = activeLease.start_date ? Math.floor((Date.now() - new Date(activeLease.start_date).getTime()) / (30.44 * 86400000)) : 0;
        const covered = Number(activeLease.deposit_months ?? 0);
        outstandingBalance = covered >= elapsed ? 0 : Number(activeLease.outstanding_balance ?? 0);
      }

      return { leases, payments, maintenanceRequests: (mrRes.data as any) ?? [], unreadCount, outstandingBalance } as any;
    },
    enabled: !!authUserId,
  });
}

function StaffDashboard() {
  const { data: d, isLoading } = useStaffDashboardData();
  const { user } = useAuth();
  const role = useHighestRole();

  if (isLoading || !d) {
    return <div className="text-sm text-muted-foreground">Loading dashboard data\u2026</div>;
  }

  const occupancyRate = d.totalUnits > 0 ? Math.round((d.occupiedUnits / d.totalUnits) * 100) : 0;

  const daysColor = (days: number) => {
    if (days <= 7) return "text-red-600 font-semibold";
    if (days <= 14) return "text-amber-600 font-semibold";
    return "text-green-600 font-semibold";
  };

  const rateColor = d.collectionRate >= 80
    ? "text-green-600"
    : d.collectionRate >= 50
      ? "text-amber-600"
      : "text-red-600";

  const rateBarColor = d.collectionRate >= 80
    ? "[&>*]:bg-green-500"
    : d.collectionRate >= 50
      ? "[&>*]:bg-amber-500"
      : "[&>*]:bg-red-500";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/dashboard" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Staff Dashboard</p>
          <h1 className="display text-3xl font-bold md:text-4xl">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/properties">Manage properties</Link></Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/payments">Record payment</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GradientMetricCard icon={Building2} label="Properties" value={String(d.propertiesCount)} gradient="bg-gradient-to-br from-blue-600 to-blue-800" />
        <GradientMetricCard icon={Users} label="Occupancy Rate" value={`${d.occupiedUnits}/${d.totalUnits}`} gradient="bg-gradient-to-br from-green-500 to-green-700" progress={occupancyRate} />
        <GradientMetricCard icon={Receipt} label="This Month Collections" value={`UGX ${d.collectedThisMonth.toLocaleString()}`} gradient="bg-gradient-to-br from-teal-500 to-teal-700" progress={d.collectionRate} />
        <GradientMetricCard icon={Wrench} label="Open Maintenance" value={String(d.openMR)} gradient="bg-gradient-to-br from-orange-500 to-orange-700" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Collections &amp; Dues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Expected rent this month</span>
              <span className="font-semibold">UGX {d.expectedRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Collected this month</span>
              <span className="font-semibold text-green-600">UGX {d.collectedThisMonth.toLocaleString()}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Collection rate</span>
                <span className={`font-semibold ${rateColor}`}>{d.collectionRate}%</span>
              </div>
              <Progress value={d.collectionRate} className={`h-2 ${rateBarColor}`} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Uncollected amount</span>
              <span className="font-semibold text-red-600">UGX {Math.max(0, d.uncollected).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Units</span>
              <span className="font-semibold">{d.totalUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Occupied</span>
              <span className="font-semibold text-green-600">{d.occupiedUnits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vacant</span>
              <span className="font-semibold text-amber-600">{d.vacantUnits}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Leases</span>
                <span className="font-semibold">{d.activeLeasesCount}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-muted-foreground">Active Tenants</span>
                <span className="font-semibold">{d.activeTenantsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              About Habico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">Our Office</p>
                <p className="text-muted-foreground">Habico Property Managers Limited<br />Kampala, Uganda</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">What We Do</p>
                <p className="text-muted-foreground">We manage residential &amp; commercial properties on behalf of landlords &mdash; handling tenants, rent collection, maintenance, and financial reporting.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">Our Reach</p>
                <p className="text-muted-foreground">{d.ownerProfiles.length} registered landlord{(d.ownerProfiles.length === 1 ? "" : "s")} &middot; {d.propertiesCount} properties &middot; {d.totalUnits} units &middot; {d.activeTenantsCount} active tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              Landlords &amp; Their Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-80 overflow-y-auto">
            {d.ownerProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No landlords registered yet. Invite property owners to create accounts with the <strong>owner</strong> role.</p>
            ) : (
              (d.ownerProfiles as any[]).map((owner: any) => {
                const props = (d.ownerProperties as any[]).filter((p: any) => p.owner_id === owner.id);
                return (
                  <div key={owner.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="font-semibold text-sm">{owner.full_name || owner.email?.split("@")[0] || "Unknown"}</span>
                    </div>
                    {props.length === 0 ? (
                      <p className="text-xs text-muted-foreground ml-6">No properties linked yet.</p>
                    ) : (
                      <ul className="ml-6 space-y-1">
                        {props.map((prop: any) => (
                          <li key={prop.id} className="flex items-center gap-2 text-xs">
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium">{prop.name}</span>
                            <span className="text-muted-foreground">&middot; {prop.city || prop.location || "Location not set"}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {props.length} property{props.length === 1 ? "" : "ies"} linked to this landlord
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {d.expiringLeases.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Expiring Leases (Next 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {(d.expiringLeases as any[]).map((lease: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lease.tenantName}</p>
                    <p className="truncate text-xs text-muted-foreground">{lease.unit}</p>
                    <p className="text-xs text-muted-foreground">{new Date(lease.expiryDate).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0 ml-3 text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${daysColor(lease.daysRemaining)}`}>
                      {lease.daysRemaining}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(d.recentPayments as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(d.recentPayments as any[]).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                      <p className="truncate text-sm font-medium">{p.tenantName}</p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className="text-sm font-semibold">UGX {p.amount.toLocaleString()}</p>
                      <p className="text-xs capitalize text-muted-foreground">{p.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/payments" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all payments <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(d.outstandingBalances as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">All tenants are up to date.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(d.outstandingBalances as any[]).slice(0, 10).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.tenantName}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.unit}</p>
                      <p className="text-xs text-muted-foreground">UGX {b.monthlyRent.toLocaleString()}/mo</p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className="text-sm font-semibold text-red-600">UGX {b.balanceDue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="display">Quick actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start"><Link to="/properties"><Building2 className="mr-2 h-4 w-4"/>Properties &amp; units</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/leases"><Users className="mr-2 h-4 w-4"/>Leases</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/reports"><TrendingUp className="mr-2 h-4 w-4"/>Financial reports</Link></Button>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="display">Need attention</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-foreground"/>
              <div>
                <div className="font-medium">{d.openMR} open maintenance request{(d.openMR === 1 ? "" : "s")}</div>
                <Link to="/maintenance" className="text-xs text-primary underline-offset-4 hover:underline">Review now &rarr;</Link>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-muted-foreground">
              Tip: Habico delivers monthly landlord reports automatically. Visit Reports to download. The Landlords &amp; Properties panel above shows who owns what.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayRentDialog({
  activeLease,
  onSuccess,
}: {
  activeLease: any;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"amount" | "stripe">("amount");
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  async function handleCreatePayment() {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const result = await createPaymentIntent({ data: {
        amount: Math.round(Number(amount) * 100),
        lease_id: activeLease.id,
        payment_type: "rent",
        period_label: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        months_covered: 1,
      }});
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
      setStep("stripe");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create payment");
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeSuccess() {
    if (!activeLease || !paymentIntentId || !user) return;
    try {
      const result = await recordStripePayment({ data: {
        paymentIntentId,
        amount: Number(amount),
        lease_id: activeLease.id,
        payment_type: "rent",
        method: "stripe",
        period_label: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        months_covered: 1,
        recorded_by: user.id,
      }});
      if (result.success) {
        toast.success("Payment recorded successfully");
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
      setOpen(false);
      setStep("amount");
      setAmount("");
      setClientSecret(null);
      setPaymentIntentId(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to record payment");
    }
  }

  function handleCancel() {
    setOpen(false);
    setStep("amount");
    setAmount("");
    setClientSecret(null);
    setPaymentIntentId(null);
  }

  const suggestedAmount = activeLease ? Number(activeLease.monthly_rent) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <CreditCard className="mr-2 h-5 w-5" />
          Pay Rent Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === "amount" ? "Enter Payment Amount" : "Pay with Card"}</DialogTitle>
        </DialogHeader>
        {step === "amount" ? (
          <div className="space-y-4">
            <div>
              <Label>Amount (UGX)</Label>
              <Input
                type="number"
                className="mt-1.5 text-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(suggestedAmount)}
              />
            </div>
            {suggestedAmount > 0 && (
              <div className="flex flex-wrap gap-2">
                {[suggestedAmount, Math.round(suggestedAmount / 2)].map((a) => (
                  <Button
                    key={a}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(a))}
                  >
                    UGX {a.toLocaleString()}
                  </Button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Your monthly rent is <strong>UGX {suggestedAmount.toLocaleString()}</strong>.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleCreatePayment} disabled={!amount || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue to Payment
              </Button>
            </DialogFooter>
          </div>
        ) : clientSecret ? (
          <StripePaymentForm
            clientSecret={clientSecret}
            onSuccess={handleStripeSuccess}
            onCancel={handleCancel}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TenantDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const role = useHighestRole();
  const { data: d, isLoading } = useTenantDashboardData(user?.id ?? "");

  if (isLoading || !d) {
    return <div className="text-sm text-muted-foreground">Loading your dashboard\u2026</div>;
  }

  const activeLease = (d.leases as any[]).find((l: any) => l.status === "active");
  const hasBalance = d.outstandingBalance > 0;
  const balanceColor = hasBalance ? "text-red-600" : "text-green-600";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTour route="/dashboard" role={role} />
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Tenant Dashboard</p>
        <h1 className="display text-3xl font-bold md:text-4xl">
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
        </h1>
      </div>

      {/* Balance / Arrears Card */}
      <Card className={`shadow-card border-l-4 ${hasBalance ? "border-l-red-500" : "border-l-green-500"}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${hasBalance ? "bg-red-100" : "bg-green-100"}`}>
                <DollarSign className={`h-6 w-6 ${balanceColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{hasBalance ? "Outstanding Balance" : "Account is Current"}</p>
                <p className={`text-2xl font-bold ${balanceColor}`}>
                  {hasBalance ? `UGX ${d.outstandingBalance.toLocaleString()}` : "No balance due"}
                </p>
                {hasBalance && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please pay your outstanding balance to avoid late fees.
                  </p>
                )}
              </div>
            </div>
            {activeLease && (
              <PayRentDialog activeLease={activeLease} onSuccess={() => qc.invalidateQueries({ queryKey: ["tenant-dashboard"] })} />
            )}
          </div>
        </CardContent>
      </Card>

      {activeLease ? (
        <Card className="shadow-card border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              Your Lease
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Unit</p>
              <p className="font-semibold">{activeLease.units?.unit_number} &mdash; {activeLease.units?.properties?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Rent</p>
              <p className="font-semibold">UGX {Number(activeLease.monthly_rent).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-semibold">{new Date(activeLease.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="font-semibold">{activeLease.end_date ? new Date(activeLease.end_date).toLocaleDateString() : "Open-ended"}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            You don&apos;t have an active lease at this time.
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="display flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(d.payments as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(d.payments as any[]).map((p: any, i: number) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                    <span className="text-xs capitalize text-muted-foreground">{p.method}</span>
                  </div>
                  <p className="text-sm font-semibold">UGX {Number(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Ref: {p.reference || "\u2014"}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="display flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            My Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(d.maintenanceRequests as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">No maintenance requests submitted.</p>
          ) : (
            <div className="space-y-2">
              {(d.maintenanceRequests as any[]).slice(0, 5).map((req: any) => (
                <div key={req.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{req.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{req.status.replace("_", " ")} &middot; {req.priority} priority</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                    req.status === "resolved" ? "bg-green-100 text-green-800" :
                    req.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>{req.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
          <Link to="/maintenance" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            View all requests <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="display">Quick actions</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          <Button asChild variant="outline" className="justify-start"><Link to="/maintenance"><Wrench className="mr-2 h-4 w-4"/>Submit maintenance request</Link></Button>
          <Button asChild variant="outline" className="justify-start"><Link to="/payments"><Receipt className="mr-2 h-4 w-4"/>View payment history</Link></Button>
          <Button asChild variant="outline" className="justify-start"><Link to="/leases"><Building2 className="mr-2 h-4 w-4"/>View my lease</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: any; trend?: { value: number; positive: boolean } }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="rounded-lg bg-accent/10 p-2.5">
          <Icon className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  );
}

function CompanyDashboard({ companyId }: { companyId: string }) {
  const { data: d, isLoading } = useCompanyDashboardData(companyId);
  const { user } = useAuth();
  const role = useHighestRole();

  if (isLoading || !d) {
    return <div className="text-sm text-muted-foreground">Loading dashboard data\u2026</div>;
  }

  const occupancyRate = d.totalUnits > 0 ? Math.round((d.occupiedUnits / d.totalUnits) * 100) : 0;
  const daysColor = (days: number) => {
    if (days <= 7) return "text-red-600 font-semibold";
    if (days <= 14) return "text-amber-600 font-semibold";
    return "text-green-600 font-semibold";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageTour route="/dashboard" role={role} />
      {/* Plan banner */}
      {d.planStatus?.plan_id && (
        <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-accent/5 to-transparent p-4 text-sm">
          <div className="rounded-full bg-accent/10 p-2">
            <Crown className="h-5 w-5 text-accent" />
          </div>
          <div>
            <span className="font-semibold">{d.planStatus.plan_name}</span>
            {d.planStatus.plan_expires_at && (
              <span className="ml-2 text-muted-foreground">
                &middot; {d.planStatus.is_expired ? (
                  <span className="text-red-600 font-medium">Expired</span>
                ) : (
                  <>Expires {new Date(d.planStatus.plan_expires_at).toLocaleDateString()} &middot; {d.planStatus.days_remaining}d remaining</>
                )}
              </span>
            )}
          </div>
          <Link to="/settings?tab=plan" className="ml-auto text-xs font-medium text-primary hover:underline">Manage plan</Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Company Dashboard</p>
          <h1 className="display text-3xl font-bold md:text-4xl">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.propertiesCount} properties &middot; {d.totalUnits} units &middot; {d.ownerCount} landlords &middot; {d.activeTenantsCount} tenants
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/properties">Properties</Link></Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/landlords">Landlords</Link></Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total Properties" value={String(d.propertiesCount)} />
        <StatCard icon={Users} label="Occupancy Rate" value={`${d.occupiedUnits}/${d.totalUnits} (${occupancyRate}%)`} />
        <StatCard icon={Landmark} label="Landlords" value={String(d.ownerCount)} />
        <StatCard icon={Wrench} label="Open Maintenance" value={String(d.openMR)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Collections */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Collections Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-green-700">Collected This Month</p>
                <p className="mt-1 text-2xl font-bold text-green-700">UGX {d.collectedThisMonth.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-amber-700">Expected Rent</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">UGX {d.expectedRent.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Collection rate</span>
                <span className={`font-semibold ${
                  d.collectionRate >= 80 ? "text-green-600" : d.collectionRate >= 50 ? "text-amber-600" : "text-red-600"
                }`}>{d.collectionRate}%</span>
              </div>
              <Progress value={d.collectionRate} className={`h-2.5 ${
                d.collectionRate >= 80 ? "[&>*]:bg-green-500" : d.collectionRate >= 50 ? "[&>*]:bg-amber-500" : "[&>*]:bg-red-500"
              }`} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uncollected</span>
              <span className="font-semibold text-red-600">UGX {Math.max(0, d.uncollected).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Landlords */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              Your Landlords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-80 overflow-y-auto">
            {(d.landlordList as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No landlords yet. Add properties with owners.</p>
            ) : (
              (d.landlordList as any[]).slice(0, 6).map((owner: any) => (
                <div key={owner.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{owner.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{owner.propertiesCount} properties</p>
                  </div>
                  <div className="shrink-0 ml-3">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {owner.propertiesCount} unit{(owner.propertiesCount === 1 ? "" : "s")}
                    </span>
                  </div>
                </div>
              ))
            )}
            {(d.landlordList as any[]).length > 6 && (
              <Button asChild variant="link" size="sm" className="w-full">
                <Link to="/landlords">View all {d.ownerCount} landlords</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(d.recentPayments as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(d.recentPayments as any[]).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                      <p className="truncate text-sm font-medium">{p.tenantName}</p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className="text-sm font-semibold">UGX {p.amount.toLocaleString()}</p>
                      <p className="text-xs capitalize text-muted-foreground">{p.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Balances */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(d.outstandingBalances as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">All tenants are up to date!</p>
            ) : (
              <div className="space-y-3">
                {(d.outstandingBalances as any[]).slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.tenantName}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-red-600">UGX {item.balanceDue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">of UGX {item.monthlyRent.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Leases */}
        {d.expiringLeases.length > 0 && (
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="display flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Expiring Leases (Next 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {(d.expiringLeases as any[]).map((lease: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{lease.tenantName}</p>
                      <p className="truncate text-xs text-muted-foreground">{lease.unit}</p>
                      <p className="text-xs text-muted-foreground">{new Date(lease.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${daysColor(lease.daysRemaining)}`}>
                        {lease.daysRemaining}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plan expiry alert (only when critical) */}
      {d.planStatus?.plan_expires_at && !d.planStatus.is_expired && d.planStatus.days_remaining <= 14 && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          d.planStatus.days_remaining <= 7
            ? "border-red-300 bg-red-50 text-red-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4" />
            Your plan expires in {d.planStatus.days_remaining} days.
            <Link to="/settings?tab=plan" className="ml-auto text-xs underline">Renew now</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ConstructionDashboard() {
  const { data } = useQuery({
    queryKey: ["construction-dashboard"],
    queryFn: async () => {
      const now = new Date();
      const [projRes, tasksRes, dailyRes, empRes, timesheetsRes, invoicesRes] = await Promise.all([
        supabase.from("projects").select("id,status"),
        supabase.from("project_tasks").select("id,status"),
        supabase.from("daily_logs").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("timesheets").select("id,duration_hours").gte("date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]),
        supabase.from("construction_invoices").select("id,amount,status"),
      ]);
      const projects = (projRes.data as any[]) ?? [];
      const tasks = (tasksRes.data as any[]) ?? [];
      const invoices = (invoicesRes.data as any[]) ?? [];
      const timesheets = (timesheetsRes.data as any[]) ?? [];
      return {
        totalProjects: projects.length,
        activeProjects: projects.filter((p: any) => p.status === "active" || p.status === "in_progress").length,
        totalTasks: tasks.length,
        openTasks: tasks.filter((t: any) => t.status !== "completed" && t.status !== "done").length,
        totalEmployees: (empRes.data as any[])?.length ?? 0,
        dailyLogsThisMonth: dailyRes.count ?? 0,
        hoursThisMonth: timesheets.reduce((s: number, t: any) => s + Number(t.duration_hours || 0), 0),
        totalInvoiced: invoices.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
        paidInvoices: invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      };
    },
  });
  const d = data;
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-amber-600">Construction</div>
        <h1 className="display text-3xl font-bold">Construction Dashboard</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientMetricCard icon={HardHat} label="Active Projects" value={d?.activeProjects?.toString() ?? "—"} gradient="bg-gradient-to-br from-amber-600 to-amber-800" />
        <GradientMetricCard icon={ClipboardList} label="Open Tasks" value={d?.openTasks?.toString() ?? "—"} gradient="bg-gradient-to-br from-orange-500 to-orange-700" />
        <GradientMetricCard icon={Users} label="Employees" value={d?.totalEmployees?.toString() ?? "—"} gradient="bg-gradient-to-br from-blue-600 to-blue-800" />
        <GradientMetricCard icon={DollarSign} label="Hours This Month" value={d?.hoursThisMonth ? `${Math.round(d.hoursThisMonth)}h` : "—"} gradient="bg-gradient-to-br from-green-600 to-green-800" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Projects</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{d?.totalProjects ?? "—"}</div>
            <p className="text-sm text-muted-foreground">{d?.activeProjects ?? 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Daily Logs</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{d?.dailyLogsThisMonth ?? "—"}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Invoiced</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{d ? `UGX ${(d.totalInvoiced / 1000).toFixed(0)}K` : "—"}</div>
            <p className="text-sm text-muted-foreground">{d ? `${Math.round((d.paidInvoices / d.totalInvoiced) * 100)}% paid` : "—"}</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-3">
        <Button asChild><Link to="/projects"><HardHat className="mr-2 h-4 w-4" />View Projects</Link></Button>
        <Button asChild variant="outline"><Link to="/daily-logs"><ClipboardList className="mr-2 h-4 w-4" />Daily Logs</Link></Button>
        <Button asChild variant="outline"><Link to="/project-dashboard"><Gauge className="mr-2 h-4 w-4" />Project Dashboard</Link></Button>
      </div>
    </div>
  );
}

function LandlordDashboard() {
  const { user } = useAuth();

  const { data: landlordData } = useQuery({
    queryKey: ["landlord-dashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: myProps } = await supabase
        .from("properties")
        .select("id, name, city, location")
        .eq("owner_id", user.id);
      const props = (myProps as any[]) ?? [];
      const propIds = props.map((p) => p.id);

      let units: any[] = [];
      let leases: any[] = [];
      let maintenanceCount = 0;
      let payments: any[] = [];

      if (propIds.length > 0) {
        const { data: u } = await supabase.from("units").select("id, unit_number, monthly_rent, status, bedrooms, bathrooms").in("property_id", propIds);
        units = (u as any[]) ?? [];
        const unitIds = units.map((u) => u.id);

        if (unitIds.length > 0) {
          const { data: l } = await supabase.from("leases").select("id, tenant_id, monthly_rent, status, start_date, units!inner(unit_number)").in("unit_id", unitIds);
          leases = (l as any[]) ?? [];

          const tenantIds = [...new Set(leases.map((l) => l.tenant_id).filter(Boolean))];
          const { data: mr } = await supabase.from("maintenance_requests").select("id").in("unit_id", unitIds).in("status", ["open", "in_progress"]);
          maintenanceCount = (mr as any[])?.length ?? 0;

          const activeLeaseIds = leases.filter((l) => l.status === "active").map((l) => l.id);
          if (activeLeaseIds.length > 0) {
            const { data: p } = await supabase
              .from("payments")
              .select("amount, payment_date, method, payment_type, leases!inner(monthly_rent, units!inner(unit_number))")
              .in("lease_id", activeLeaseIds)
              .order("payment_date", { ascending: false })
              .limit(5);
            payments = (p as any[]) ?? [];
          }
        }
      }

      const activeLeases = leases.filter((l) => l.status === "active");
      const totalMonthlyRent = activeLeases.reduce((s, l) => s + Number(l.monthly_rent), 0);
      const occupiedUnits = units.filter((u) => u.status === "occupied").length;
      const totalUnits = units.length;

      return { properties: props, totalUnits, occupiedUnits, totalMonthlyRent, maintenanceCount, payments, leases, units };
    },
    enabled: !!user,
  });

  if (!landlordData) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Owner Portal</p>
            <h1 className="display text-3xl font-bold">My Dashboard</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            Loading your portfolio...
          </CardContent>
        </Card>
      </div>
    );
  }

  const { properties, totalUnits, occupiedUnits, totalMonthlyRent, maintenanceCount, payments } = landlordData;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Owner Portal</p>
          <h1 className="display text-3xl font-bold">My Dashboard</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/properties"><Building2 className="mr-2 h-4 w-4" />My Properties</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Properties</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{properties.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Units</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{occupiedUnits} / {totalUnits}</p>
            <p className="text-xs text-muted-foreground">occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Rent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">UGX {totalMonthlyRent.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Maintenance</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${maintenanceCount > 0 ? "text-amber-500" : ""}`}>{maintenanceCount}</p></CardContent>
        </Card>
      </div>

      {properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              My Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p: any) => (
                <Link key={p.id} to="/properties" className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.city || p.location || "—"}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">UGX {Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{p.payment_date} &middot; {p.method}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {p.payment_type ?? "rent"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {properties.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            No properties linked to your account yet. Contact the admin to assign properties to you.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Dashboard() {
  const role = useHighestRole();
  const { data: companyId } = useCompanyId();
  const isCompanyUser = !!companyId;
  const isStaff = role === "admin" || role === "manager" || role === "staff";
  const { mode } = useWorkspaceMode();

  if (role === "tenant") return <TenantDashboard />;
  if (role === "owner") return <LandlordDashboard />;
  if (mode === "construction") return <ConstructionDashboard />;
  if (isStaff && isCompanyUser) return <CompanyDashboard companyId={companyId} />;
  return <StaffDashboard />;
}
