import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicTestimonials } from "@/components/public-testimonials";
import { services, serviceById } from "@/lib/service-data";
import { ChevronDown, ArrowRight, Sparkles, CheckCircle2, BarChart3, ShieldCheck, Users, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Habico Property Managers" },
      { name: "description", content: "Construction operations, project management, quality, resources, and financial control for builders and project owners in Uganda." },
      { property: "og:title", content: "Services — Habico" },
      { property: "og:description", content: "Full-service property management in Uganda." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/services" }],
  }),
  component: ServicesPage,
});

const workflowStages = [
  { label: "Brief", serviceId: "business-development", detail: "Capture the opportunity and client brief." },
  { label: "Estimate", serviceId: "business-development", detail: "Build scope, costs, and a clear quotation." },
  { label: "Plan", serviceId: "project-management", detail: "Set milestones, tasks, teams, and dates." },
  { label: "Build", serviceId: "project-management", detail: "Coordinate site activity and field records." },
  { label: "Handover", serviceId: "quality-safety", detail: "Close punch items and deliver the record." },
] as const;

function ServiceDetails({ id: serviceId }: { id: string }) {
  const service = serviceById[serviceId];
  if (!service) return null;
  const Icon = service.icon;

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Description + Items */}
      <section className="pb-12">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="display text-2xl font-bold">{service.title}</h2>
            </div>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{service.description}</p>
            <h3 className="mt-8 display text-lg font-semibold">What we handle</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {service.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            {serviceId === "construction" && (
              <div className="mt-10 border-t border-border pt-8">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Construction workspace</div>
                <h3 className="mt-2 display text-2xl font-bold">Every moving part, connected.</h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {[
                    ["Business development", "Leads · Estimates · Quotations · Proposals · Bid Packages"],
                    ["Project management", "Projects · Dashboard · Schedules · Tasks · Daily Logs · RFIs · Submittals · Meeting Minutes"],
                    ["Quality & safety", "Punch List · Safety Incidents · Project Documents · Project Photos"],
                    ["Team & resources", "Employees · Timesheets · Expenses · Receipts · Suppliers · Purchase Orders · Inventory · Assets · Equipment Rentals"],
                    ["Construction financial", "Invoices · Subcontracts · Change Orders · Allowances · Project Budget · Bills · Lien Waivers · Commitment Log · Progress Payments"],
                  ].map(([title, modules]) => (
                    <div key={title} className="border-l-2 border-accent/60 pl-4">
                      <h4 className="text-sm font-semibold">{title}</h4>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{modules}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> Benefits
              </div>
              <ul className="mt-4 space-y-3">
                {service.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">&#10003;</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full">
                <Link to="/contact">{service.ctaText}</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">No commitment. Free consultation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServicesPage() {
  const [selectedService, setSelectedService] = useState("");
  const { data: projects = [] } = useQuery({
    queryKey: ["public-construction-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, status, budget")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const completedProjects = projects.filter((project) => project.status === "completed").length;
  const activeProjects = projects.filter((project) => project.status === "in_progress" || project.status === "planning").length;
  const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget ?? 0), 0);
  const completionRate = projects.length ? Math.round((completedProjects / projects.length) * 100) : 0;
  const projectMetrics = [
    { icon: BarChart3, value: completedProjects, label: "Projects completed" },
    { icon: Workflow, value: activeProjects, label: "Projects in delivery" },
    { icon: ShieldCheck, value: `${completionRate}%`, label: "Completion rate" },
    { icon: Users, value: totalBudget ? `UGX ${(totalBudget / 1_000_000_000).toFixed(1)}B` : "--", label: "Managed project value" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-[1fr_0.8fr] md:gap-16">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-accent">Our Services</div>
            <h1 className="mt-3 display text-5xl font-bold md:text-6xl">Every construction operation you need — under one roof.</h1>
            <p className="mt-4 max-w-2xl text-lg text-primary-foreground/85">From winning the work to tracking progress, resources, quality, and payments, Habico keeps your construction operation moving end-to-end.</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=85"
            alt="Construction project site with building plans"
            className="aspect-[4/3] w-full object-cover shadow-soft"
            width={1000}
            height={750}
          />
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {projectMetrics.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3 border-l-2 border-accent/60 px-4 py-2">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <div className="display text-2xl font-bold text-primary">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dropdown selector */}
      <section className="mx-auto max-w-7xl px-4 -mt-6 mb-8">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <label htmlFor="service-dropdown" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choose a service to learn more
          </label>
          <div className="relative">
            <select
              id="service-dropdown"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full appearance-none rounded-lg border bg-background px-4 py-3 pr-10 text-sm font-medium outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Selected service detail (in-place) */}
      {selectedService && (
        <ServiceDetails id={selectedService} />
      )}

      {/* Service overview cards (when nothing selected) */}
      {!selectedService && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-card text-left transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 display text-lg font-bold">{s.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.items.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" /> {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!selectedService && (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="border-t border-border pt-10">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">For builders and project owners</div>
            <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="display text-3xl font-bold md:text-4xl">Construction operations, in one workspace.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">From the first lead to final payment, keep project teams, field records, resources, and financial controls moving together.</p>
              </div>
              <Button asChild className="shrink-0"><Link to="/services/$id" params={{ id: "construction" }}>Explore construction</Link></Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Business development", "Leads, estimates, quotations, proposals, and bid packages"],
                ["Project management", "Schedules, tasks, daily logs, RFIs, submittals, and meetings"],
                ["Quality & safety", "Punch lists, incidents, documents, and project photos"],
                ["Team & resources", "Employees, timesheets, suppliers, inventory, and equipment"],
                ["Financial control", "Budgets, subcontracts, change orders, bills, and payments"],
              ].map(([title, body]) => (
                <div key={title} className="border-l-2 border-accent/60 pl-4">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!selectedService && (
        <section className="border-y border-border bg-primary py-14 text-primary-foreground md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Project evolution</div>
                <h2 className="mt-3 display text-3xl font-bold md:text-5xl">From first brief to finished build.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-primary-foreground/70">A live view of the kind of work your construction team can coordinate in Habico.</p>
            </div>
            <div className="mt-10 grid gap-2 sm:grid-cols-5">
              {workflowStages.map((stage, index) => (
                <button type="button" key={stage.label} onClick={() => setSelectedService(stage.serviceId)} className="group relative flex items-center gap-3 border-t border-primary-foreground/20 pt-3 text-left transition-colors hover:text-accent sm:block sm:border-t-0 sm:pt-0">
                  {index < 4 && <div className="absolute left-8 right-[-0.5rem] top-1.5 hidden h-px bg-accent/40 sm:block" />}
                  <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent bg-primary text-xs font-bold text-accent">0{index + 1}</div>
                  <div className="sm:mt-3"><div className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70 group-hover:text-accent">{stage.label}</div><div className="mt-1 hidden text-[11px] leading-4 text-primary-foreground/50 sm:block">{stage.detail}</div></div>
                </button>
              ))}
            </div>
            <div className="relative mt-10 space-y-6 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-accent/30">
              {[
                ["Entebbe Airport View Estate", "Entebbe, Wakiso", "Completed", "20-townhouse gated community with a community centre and playground.", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85"],
                ["Ntinda Heights Apartment Block", "Ntinda, Kampala", "In progress", "12-unit apartment block with rooftop terrace and basement parking.", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85"],
                ["Kyambogo University Science Block", "Kyambogo, Kampala", "In progress", "Science facility with classrooms, laboratories, and a lecture hall.", "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=85"],
              ].map(([name, location, status, description, image], index) => (
                <article key={name} className="relative flex gap-5">
                  <div className="z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent bg-accent text-xs font-bold text-accent-foreground ring-8 ring-primary">
                    0{index + 1}
                  </div>
                  <div className="flex-1 overflow-hidden border border-primary-foreground/15 border-l-4 border-l-accent/70 bg-primary-foreground/5 shadow-sm transition-colors hover:border-accent/50 hover:bg-primary-foreground/10 md:flex md:items-stretch md:gap-8">
                    <img src={image} alt={`${name} project`} className="h-40 w-full object-cover md:h-auto md:w-56" loading="lazy" />
                    <div className="min-w-0 flex-1 p-5">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">0{index + 1} / milestone</div>
                      <h3 className="mt-2 display text-xl font-bold">{name}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/70">{description}</p>
                    </div>
                    <div className="shrink-0 px-5 pb-5 text-left text-xs uppercase tracking-wider md:mt-1 md:px-5 md:pb-0 md:pt-5 md:text-right">
                      <div className="text-primary-foreground/60">{location}</div>
                      <div className="mt-2 inline-flex border border-accent/40 bg-accent/10 px-2 py-1 text-accent">{status}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {!selectedService && (
        <PublicTestimonials filterable eyebrow="Client reviews" title="Clearer projects. More confident clients." />
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 p-10 text-center md:p-14">
          <h2 className="display text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Tell us what you are building, where it is, and what needs to move next.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/contact">Request a consultation</Link></Button>
            <Button asChild variant="outline"><Link to="/auth">Open your portal</Link></Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
