import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, ChevronDown, Building2, HardHat } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarFooter, SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { getWorkspace, type NavGroup, type NavItem } from "@/lib/workspace-config";
import { useAllFeatureAccess } from "@/hooks/use-feature-access";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { useEffect, useState } from "react";
import logoSrc from "@/assets/habico-logo.png";

const MODE_FEATURES: Record<string, "rentals" | "construction" | "both"> = {
  rental: "rentals",
  move_service: "rentals",
  construction: "construction",
  construction_financial: "construction",
  sop: "construction",
  reports: "both",
};

function featureMode(feature: string | undefined): "rentals" | "construction" | "both" {
  if (!feature) return "both";
  return MODE_FEATURES[feature] ?? "both";
}

function NavGroup({ label, items, mode }: { label: string; items: NavItem[]; mode: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const visibleItems = items.filter((it) => {
    if (!it.feature) return true;
    const fm = featureMode(it.feature);
    if (fm === "both") return true;
    return fm === mode;
  });
  const isOpen = visibleItems.some((it) => path === it.url || (it.url !== "/dashboard" && path.startsWith(it.url)));
  const [open, setOpen] = useState(isOpen);
  useEffect(() => { setOpen(isOpen); }, [isOpen]);
  const isActive = (url: string) => path === url || (url !== "/dashboard" && path.startsWith(url));
  if (visibleItems.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="flex cursor-pointer items-center justify-between">
            <span>{label}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={isActive(it.url)}>
                    <Link to={it.url}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const role = useHighestRole();
  const { user, signOut } = useAuth();
  const ws = getWorkspace(role);
  const features = useAllFeatureAccess();
  const { mode, setMode } = useWorkspaceMode();
  const WsIcon = ws.icon;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => path === url || (url !== "/dashboard" && path.startsWith(url));
  const isStaff = role === "admin" || role === "manager" || role === "staff";
  const { data: profile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      return data ?? null;
    },
    enabled: !!user?.id,
  });
  const hasCompany = !!profile?.company_id;

  function isModeMatch(feature: string | undefined): boolean {
    if (!feature) return true;
    const fm = featureMode(feature);
    if (fm === "both") return true;
    return fm === mode;
  }

  function hasFeature(feature: string | undefined): boolean {
    if (!feature) return true;
    if (isStaff && !hasCompany) return true;
    const fm = featureMode(feature);
    if (fm !== mode && fm !== "both") return false;
    return features[feature] !== false;
  }

  function groupVisible(g: NavGroup) {
    return hasFeature(g.feature) && isModeMatch(g.feature);
  }

  function itemVisible(it: { feature?: string }) {
    return hasFeature(it.feature) && isModeMatch(it.feature);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className="border-b border-sidebar-border"
        style={{ background: ws.sidebarHeaderBg }}
      >
        <Link to={ws.defaultRoute} className="flex items-center gap-2 p-2">
          <img src={logoSrc} alt="Habico" className="h-8 w-8 rounded-md object-cover" />
          <div className="leading-tight">
            <div className="display text-sm font-bold text-sidebar-foreground">HABICO</div>
            <div
              className="text-[9px] font-semibold uppercase tracking-widest"
              style={{ color: ws.accent }}
            >
              {ws.name}
            </div>
          </div>
        </Link>
        {isStaff && (
          <div className="mx-2 mb-1 mt-0.5 flex overflow-hidden rounded-md border-2 transition-colors"
            style={{
              borderColor: mode === "rentals" ? "#3b82f6" : "#f59e0b",
            }}
          >
            <button
              onClick={() => setMode("rentals")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                mode === "rentals"
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50"
              }`}
              style={mode === "rentals" ? { background: "#3b82f6", color: "#fff" } : {}}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden group-data-[collapsible=icon]:hidden md:inline">Rentals</span>
            </button>
            <button
              onClick={() => setMode("construction")}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                mode === "construction"
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/50"
              }`}
              style={mode === "construction" ? { background: "#f59e0b", color: "#1e293b" } : {}}
            >
              <HardHat className="h-3.5 w-3.5" />
              <span className="hidden group-data-[collapsible=icon]:hidden md:inline">Constr.</span>
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {ws.nav.groups.filter(groupVisible).map((g) => (
          <NavGroup key={mode + g.label} label={g.label} items={g.items} mode={mode} />
        ))}
        {ws.nav.extraItems?.filter(itemVisible).map((it) => (
          <SidebarGroup key={it.url}>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(it.url)}>
                    <Link to={it.url}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="truncate text-xs text-sidebar-foreground/70">{user?.email}</div>
        <div
          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: ws.accentLight, color: ws.accent }}
        >
          {ws.badge}
        </div>
        <Button onClick={signOut} variant="ghost" size="sm" className="mt-2 justify-start text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
