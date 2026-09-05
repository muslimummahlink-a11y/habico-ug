import { createFileRoute } from "@tanstack/react-router";
import { Outlet, Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, CreditCard, FileText, Wrench, CreditCard as CreditCardIcon, Settings, LogOut, Home, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const tenantNavItems = [
  { href: "/tenant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/payments", label: "Payments", icon: CreditCardIcon },
  { href: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/tenant/lease", label: "My Lease", icon: FileText },
  { href: "/tenant/id-card", label: "ID Card", icon: CreditCard },
  { href: "/tenant/documents", label: "Documents", icon: FileText },
  { href: "/tenant/settings", label: "Settings", icon: Settings },
];

export function TenantPortalLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["tenant-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").eq("auth_user_id", user?.id).single();
      return data;
    },
    enabled: !!user,
  });

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

  const { data: outstanding } = useQuery({
    queryKey: ["tenant-outstanding", user?.id],
    queryFn: async () => {
      const { data: tenant } = await supabase.from("tenants").select("id, lease_id").eq("auth_user_id", user?.id).single();
      if (!tenant?.lease_id) return 0;
      const { data } = await supabase.from("leases").select("outstanding_balance").eq("id", tenant.lease_id).single();
      return Number(data?.outstanding_balance ?? 0);
    },
    enabled: !!user,
  });

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link to="/tenant/dashboard" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-accent" />
              <span className="font-bold text-lg">Habico</span>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {tenantNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t p-4">
            <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:bg-red-50" onClick={() => signOut()}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Tenant Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-sm">
              <p className="font-medium">{profile?.full_name ?? "Tenant"}</p>
              <p className="text-xs text-muted-foreground">{profile?.phone ?? ""}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {(lease || outstanding !== undefined) && (
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Current Balance</CardTitle></CardHeader>
                <CardContent><p className={`text-2xl font-bold ${(outstanding ?? 0) > 0 ? "text-red-500" : "text-green-500"}`}>UGX {(outstanding ?? 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Outstanding rent</p></CardContent>
              </Card>
              <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Rent</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">UGX {Number(lease?.monthly_rent ?? 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Due {lease?.payment_due_day ? `every ${lease.payment_due_day}th` : "monthly"}</p></CardContent></Card>
              <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unit</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{lease?.units?.unit_number ? `Unit ${lease.units.unit_number}` : "—"}</p><p className="text-xs text-muted-foreground">{lease?.units?.properties?.name ?? "—"}</p></CardContent></Card>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/tenant")({
  beforeLoad: ({ context }) => {
    const role = context?.auth?.highestRole;
    if (!role || !["tenant"].includes(role)) {
      throw redirect({ to: "/" });
    }
  },
  component: TenantPortalLayout,
});

declare module "@tanstack/react-router" {
  interface RouterContext {
    auth?: { highestRole: string };
  }
}