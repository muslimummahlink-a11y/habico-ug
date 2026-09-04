import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { services, serviceById } from "@/lib/service-data";
import { ChevronDown, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Habico Property Managers" },
      { name: "description", content: "Tenant management, rent collection, maintenance, legal compliance, marketing, and administrative services for property owners in Uganda." },
      { property: "og:title", content: "Services — Habico" },
      { property: "og:description", content: "Full-service property management in Uganda." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/services" }],
  }),
  component: ServicesPage,
});

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Our Services</div>
          <h1 className="mt-3 display text-5xl font-bold md:text-6xl">Every service your property needs — under one roof.</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/85">From sourcing tenants to delivering monthly landlord reports, Habico operates your property end-to-end.</p>
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/10 p-10 text-center md:p-14">
          <h2 className="display text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Talk to Habico today about managing your property the right way.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/contact">Contact us</Link></Button>
            <Button asChild variant="outline"><Link to="/auth" search={{ mode: "signup" }}>Open your portal</Link></Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
