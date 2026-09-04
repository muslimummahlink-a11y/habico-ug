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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/subscription-plans")({
  head: () => ({ meta: [{ title: "Subscription Plans — Habico Portal" }] }),
  component: SubscriptionPlansPage,
});

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  sort_order: number;
};

type PlanFeature = {
  id: string;
  plan_id: string;
  feature_key: string;
  is_enabled: boolean;
};

const FEATURE_LABELS: Record<string, string> = {
  rental: "Rental Management",
  construction: "Construction",
  construction_financial: "Construction Financial",
  sop: "SOP & Quality",
  reports: "Reports",
  companies: "Companies Management",
  branding: "Company Branding",
  system: "Admin Pages (System)",
  settings: "Settings",
  move_service: "Move In/Out Service",
};

function SubscriptionPlansPage() {
  const queryClient = useQueryClient();
  const role = useHighestRole();
  const { user } = useAuth();
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", monthly_price: "0", yearly_price: "0", sort_order: "0" });
  const [featuresPlan, setFeaturesPlan] = useState<Plan | null>(null);

  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      return data ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: userCompany } = useQuery({
    queryKey: ["user-company-plan", currentProfile?.company_id],
    queryFn: async () => {
      if (!currentProfile?.company_id) return null;
      const { data } = await supabase.from("companies").select("plan_id").eq("id", currentProfile.company_id).single();
      return data ?? null;
    },
    enabled: !!currentProfile?.company_id,
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["subscription-plans", userCompany?.plan_id],
    queryFn: async () => {
      let query = supabase.from("subscription_plans").select("*").order("sort_order");
      if (currentProfile?.company_id && userCompany?.plan_id) {
        query = query.eq("id", userCompany.plan_id);
      }
      const { data, error } = await query;
      if (error && error.code !== "PGRST116" && !error.message?.includes("does not exist")) throw error;
      return (data ?? []) as Plan[];
    },
    retry: false,
  });

  const { data: features = [] } = useQuery({
    queryKey: ["plan-features"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_features").select("*");
      if (error) throw error;
      return (data ?? []) as PlanFeature[];
    },
  });

  const savePlan = useMutation({
    mutationFn: async (vals: Partial<Plan> & { id?: string; name: string; slug: string }) => {
      if (vals.id) {
        const { error } = await supabase.from("subscription_plans").update(vals).eq("id", vals.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_plans").insert(vals);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast.success("Plan saved");
      setDialogOpen(false);
      setEditPlan(null);
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to save"),
  });

  const toggleFeature = useMutation({
    mutationFn: async ({ planId, featureKey, isEnabled }: { planId: string; featureKey: string; isEnabled: boolean }) => {
      const existing = features.find((f) => f.plan_id === planId && f.feature_key === featureKey);
      if (existing) {
        const { error } = await supabase.from("plan_features").update({ is_enabled: isEnabled }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plan_features").insert({ plan_id: planId, feature_key: featureKey, is_enabled: isEnabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-features"] });
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to update feature"),
  });

  const isStaff = role === "admin" || role === "manager";
  const hasCompany = !!currentProfile?.company_id;
  const isSuperAdmin = isStaff && !hasCompany;

  if (!isStaff) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>;
  }

  function openNew() {
    setForm({ name: "", slug: "", description: "", monthly_price: "0", yearly_price: "0", sort_order: "0" });
    setEditPlan(null);
    setDialogOpen(true);
  }

  function openEdit(p: Plan) {
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      monthly_price: String(p.monthly_price),
      yearly_price: String(p.yearly_price),
      sort_order: String(p.sort_order),
    });
    setEditPlan(p);
    setDialogOpen(true);
  }

  function getFeaturesForPlan(planId: string) {
    return features.filter((f) => f.plan_id === planId);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">Manage subscription packages and their feature access</p>
        </div>
      </div>

      <EntityCardGrid
        data={plans}
        isLoading={isLoading}
        searchFields={["name", "description", "slug"]}
        keyExtractor={(item) => item.id}
        titleField="name"
        subtitleField="description"
        metricFields={[
          { key: "monthly_price", label: "Monthly", format: "currency" },
          { key: "yearly_price", label: "Yearly", format: "currency" },
        ]}
        onCreateNew={isSuperAdmin ? openNew : undefined}
        createLabel="Add Plan"
        cardActions={(item) => isSuperAdmin ? (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setFeaturesPlan(item)}>
              Features
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(item)}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          </>
        ) : undefined}
      />

      <Dialog open={!!featuresPlan} onOpenChange={(v) => { if (!v) setFeaturesPlan(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{featuresPlan?.name} — Feature Access</DialogTitle>
          </DialogHeader>
          {featuresPlan && (
            <div className="space-y-4">
              <div className="mb-4 flex gap-6 text-sm">
                <div><span className="text-muted-foreground">Monthly:</span> UGX {Number(featuresPlan.monthly_price).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Yearly:</span> UGX {Number(featuresPlan.yearly_price).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Slug:</span> {featuresPlan.slug}</div>
                {!featuresPlan.is_active && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Inactive</span>}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Feature Access</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                    const pf = getFeaturesForPlan(featuresPlan.id).find((f) => f.feature_key === key);
                    const enabled = pf?.is_enabled ?? false;
                    return (
                      <div key={key} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                        <Switch
                          checked={enabled}
                          onCheckedChange={(val) =>
                            toggleFeature.mutate({ planId: featuresPlan.id, featureKey: key, isEnabled: val })
                          }
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editPlan ? "Edit Plan" : "Add Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Monthly Price (UGX)</Label>
              <Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
            </div>
            <div>
              <Label>Yearly Price (UGX)</Label>
              <Input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: e.target.value })} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() =>
                  savePlan.mutate({
                    id: editPlan?.id,
                    name: form.name,
                    slug: form.slug,
                    description: form.description || null,
                    monthly_price: Number(form.monthly_price),
                    yearly_price: Number(form.yearly_price),
                    sort_order: Number(form.sort_order),
                  })
                }
                disabled={!form.name || !form.slug || savePlan.isPending}
              >
                {savePlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
