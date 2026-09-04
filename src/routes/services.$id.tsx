import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { services, serviceById } from "@/lib/service-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/services/$id")({
  head: ({ params }) => {
    const svc = serviceById[params.id];
    return {
      meta: [
        { title: svc ? `${svc.title} — Habico Property Managers` : "Service not found" },
        { name: "description", content: svc?.description ?? "" },
      ],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { id } = Route.useParams();
  const service = serviceById[id];

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Button asChild><Link to="/services">Back to services</Link></Button>
      </div>
    );
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-gradient-hero py-16 text-primary-foreground md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Link to="/services" className="mb-6 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-accent transition hover:text-accent/80">
            <ArrowLeft className="h-3 w-3" /> All Services
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-accent">Our Service</div>
              <h1 className="mt-1 display text-4xl font-bold md:text-5xl">{service.title}</h1>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-lg text-primary-foreground/85">{service.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-3">
            <p className="text-lg leading-relaxed text-muted-foreground">{service.description}</p>
            <h2 className="mt-10 display text-xl font-semibold">What we handle</h2>
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

      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="display text-2xl font-bold">Explore other services</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.filter((s) => s.id !== service.id).map((s) => {
              const SIcon = s.icon;
              return (
                <Link key={s.id} to="/services/$id" params={{ id: s.id }} className="group rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <SIcon className="h-5 w-5" />
                    </div>
                    <h3 className="display font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{s.subtitle}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
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
