import { Outlet, Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Building2, Users, FileText, DollarSign, Wrench, CreditCard, Settings, LogOut, Home, TrendingUp, Bell } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const landlordNavItems = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/landlord/properties", label: "Properties", icon: Building2 },
  { href: "/landlord/tenants", label: "Tenants", icon: Users },
  { href: "/landlord/financial-reports", label: "Financial Reports", icon: DollarSign },
  { href: "/landlord/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/landlord/payments", label: "Payments", icon: CreditCard },
  { href: "/landlord/documents", label: "Documents", icon: FileText },
  { href: "/landlord/settings", label: "Settings", icon: Settings },
];

export function LandlordPortalLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: properties = [] } = useQuery({
    queryKey: ["landlord-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name, location, units!inner(id, unit_number, monthly_rent, status, leases!inner(tenant_id, monthly_rent, outstanding_balance, status, tenants!inner(full_name, phone, email)))")
        .eq("owner_id", user?.id);
      return (data ?? []) as any[];
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["landlord-stats", user?.id],
    queryFn: async () => {
      const { data: props } = await supabase.from("properties").select("id, units!inner(id, monthly_rent, status, leases!inner(outstanding_balance))").eq("owner_id", user?.id);
      if (!props) return { totalProperties: 0, totalUnits: 0, occupiedUnits: 0, totalOutstanding: 0, monthlyIncome: 0 };
      
      let totalUnits = 0;
      let occupiedUnits = 0;
      let totalOutstanding = 0;
      let monthlyIncome = 0;
      
      for (const prop of props) {
        for (const unit of prop.units) {
          totalUnits++;
          if (unit.status === "occupied") occupiedUnits++;
          monthlyIncome += Number(unit.monthly_rent ?? 0);
          if (unit.leases) {
            for (const lease of unit.leases) {
              totalOutstanding += Number(lease.outstanding_balance ?? 0);
            }
          }
        }
      }
      
      return { totalProperties: props.length, totalUnits, occupiedUnits, totalOutstanding, monthlyIncome };
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
            <Link to="/landlord/dashboard" className="flex items-center gap-2">
              <Home className="h-6 w-6 text-accent" />
              <span className="font-bold text-lg">Habico</span>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {landlordNavItems.map((item) => (
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
            <h1 className="text-lg font-semibold">Landlord Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => signOut()}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {/* Quick stats banner */}
          {(stats && stats.totalProperties > 0) && (
            <div className="grid gap-4 md:grid-cols-5 mb-6">
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Properties</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.totalProperties}</p></CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Units</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold">{stats.totalUnits}</p></CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Occupied</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-green-600">{stats.occupiedUnits}/{stats.totalUnits}</p></CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Income</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-green-600">UGX {stats.monthlyIncome.toLocaleString()}</p></CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outstanding</CardTitle></CardHeader>
                <CardContent><p className="text-2xl font-bold text-red-500">UGX {stats.totalOutstanding.toLocaleString()}</p></CardContent>
              </Card>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}