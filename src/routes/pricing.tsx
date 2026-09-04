import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Building2, HardHat, Layers, Sparkles } from "lucide-react";
import AppStoreBadges from "@/components/app-store-badges";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Habico Portal" },
      { name: "description", content: "Choose the right Habico license for your property management company. Rental, Construction, or Full Suite." },
      { property: "og:title", content: "Pricing — Habico Portal" },
      { property: "og:description", content: "License Habico's all-in-one property management platform for your company." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/pricing" }],
  }),
  component: PricingPage,
});

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
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
};

const PLAN_ICONS: Record<string, typeof Building2> = {
  rental: Building2,
  construction: HardHat,
  "full-suite": Layers,
};

const PLAN_COLORS: Record<string, string> = {
  rental: "bg-green-100 text-green-700 border-green-200",
  construction: "bg-blue-100 text-blue-700 border-blue-200",
  "full-suite": "bg-amber-100 text-amber-700 border-amber-200",
};

const BENEFITS = [
  { title: "Centralised operations", body: "Manage properties, tenants, leases, payments, and maintenance from one dashboard." },
  { title: "Real-time reporting", body: "Generate financial reports, occupancy analytics, and owner statements instantly." },
  { title: "Multi-company support", body: "Run multiple properties or companies under a single license with role-based access." },
  { title: "Branded experience", body: "Customise the portal with your company logo, colours, and tenancy agreement templates." },
  { title: "Team collaboration", body: "Invite staff with granular permissions — admin, manager, agent, accountant, and more." },
  { title: "Stripe-powered payments", body: "Collect rent and payments online via secure Stripe integration with UGX support." },
];

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
      if (error && !error.message?.includes("does not exist")) throw error;
      return (data ?? []) as Plan[];
    },
    retry: false,
  });

  const { data: features = [] } = useQuery({
    queryKey: ["pricing-features"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_features").select("*");
      if (error) throw error;
      return (data ?? []) as PlanFeature[];
    },
  });

  function getEnabled(planId: string): string[] {
    return features.filter((f) => f.plan_id === planId && f.is_enabled).map((f) => f.feature_key);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            <Sparkles className="h-3 w-3" /> Company Licensing
          </div>
          <h1 className="mt-4 display text-5xl font-bold md:text-6xl">License Habico for your company.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/85">
            Choose the plan that fits your business — from rental management to full construction suite.
            All plans include multi-user support, real-time reporting, and dedicated onboarding.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Why license Habico</div>
          <h2 className="mt-2 display text-4xl font-bold md:text-5xl">Everything you need to run your business.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-accent">Plans & pricing</div>
            <h2 className="mt-2 display text-4xl font-bold md:text-5xl">Transparent pricing, no hidden fees.</h2>
            <p className="mt-2 text-muted-foreground">All prices in Ugandan Shillings (UGX). Switch to yearly and save.</p>

            {/* Toggle */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-border bg-background p-1">
              <button
                onClick={() => setYearly(false)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${!yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${yearly ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">Save ~17%</span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const enabled = getEnabled(plan.id);
              const Icon = PLAN_ICONS[plan.slug] ?? Building2;
              const colorClass = PLAN_COLORS[plan.slug] ?? "bg-gray-100 text-gray-700 border-gray-200";
              const price = yearly ? plan.yearly_price : plan.monthly_price;
              const periodLabel = yearly ? "/year" : "/month";
              const isPopular = plan.slug === "full-suite";

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-soft ${isPopular ? "border-accent ring-1 ring-accent" : "border-border"}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">
                      Most popular
                    </div>
                  )}
                  <div className="p-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 display text-2xl font-bold">{plan.name}</h3>
                    {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
                    <div className="mt-4">
                      <span className="text-4xl font-bold">UGX {Number(price).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">{periodLabel}</span>
                    </div>
                    {yearly && plan.monthly_price > 0 && (
                      <p className="mt-1 text-xs text-accent">
                        UGX {Number(plan.monthly_price).toLocaleString()}/month equivalent
                      </p>
                    )}
                  </div>
                  <div className="flex-1 border-t border-border px-6 py-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What's included</p>
                    <ul className="space-y-2.5">
                      {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                        const has = enabled.includes(key);
                        return (
                          <li key={key} className={`flex items-start gap-2 text-sm ${has ? "" : "text-muted-foreground/40"}`}>
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${has ? "text-accent" : "text-muted-foreground/30"}`} />
                            <span className={has ? "" : "line-through"}>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="p-6 pt-0">
                    <Button asChild className="w-full" variant={isPopular ? "default" : "outline"}>
                      <Link to="/register" search={{ plan: plan.slug }}>
                        {price === 0 ? "Get started free" : "Choose plan"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-brand p-10 text-primary-foreground md:p-16">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="display text-3xl font-bold md:text-5xl">Ready to streamline your operations?</h2>
              <p className="mt-4 text-primary-foreground/85">Register your company today and get access to the full Habico platform. No credit card required for free plans.</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/contact">Talk to sales</Link>
              </Button>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/register" search={{ plan: undefined }}>Register now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="mt-6 flex justify-center md:justify-end">
              <AppStoreBadges compact />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
