import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeftRight, Building2, Wrench, Receipt, Users, ShieldCheck, BarChart3, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-residence.jpg";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisitAdPopup } from "@/components/visit-ad-popup";
import AppStoreBadges from "@/components/app-store-badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Habico Property Managers — Elevate the Value of Your Residences" },
      { name: "description", content: "Full-service property management in Kampala. Tenant management, rent collection, maintenance, compliance, and transparent owner reporting." },
      { property: "og:title", content: "Habico Property Managers" },
      { property: "og:description", content: "Maximize ROI on your residences with Habico." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug" }],
  }),
  component: HomePage,
});

const services = [
  { icon: Users, title: "Tenant Management", desc: "Screening, lease handling, move-ins, renewals, dispute resolution." },
  { icon: Receipt, title: "Rent Collection", desc: "Set rates, collect on time, manage late fees, and monthly statements." },
  { icon: Wrench, title: "Maintenance & Repairs", desc: "Scheduled upkeep, emergency response, vetted vendor management." },
  { icon: ShieldCheck, title: "Legal & Compliance", desc: "Stay compliant with local regulations, evictions handled legally." },
  { icon: Building2, title: "Property Marketing", desc: "Professional listings, photography, showings, lease negotiation." },
  { icon: BarChart3, title: "Owner Reporting", desc: "Transparent financials, occupancy, and strategic recommendations." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Modern Habico-managed residence at twilight" className="h-full w-full object-cover" width={1600} height={1200} />
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Kampala · Uganda
            </div>
            <h1 className="mt-6 display text-5xl font-bold leading-[0.95] text-primary-foreground md:text-7xl">
              HABICO — ELEVATE THE<br/>VALUE OF YOUR<br/><span className="text-accent">RESIDENCES.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85">
              We increase the value of your property while maximizing return on investment for the owner — through professional management, transparent reporting, and dedicated tenant care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth" search={{ mode: "signup" }}>Open your portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/services">Explore services</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-primary-foreground">
              {[{n:"6+",l:"Service pillars"},{n:"100%",l:"Owner transparency"},{n:"24/7",l:"Tenant support"}].map((s)=>(
                <div key={s.l}>
                  <div className="display text-3xl font-bold text-accent">{s.n}</div>
                  <div className="text-xs uppercase tracking-wider text-primary-foreground/70">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <AppStoreBadges />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-accent">Our Services</div>
            <h2 className="mt-2 display text-4xl font-bold md:text-5xl">A problem-solving operating system for your property.</h2>
          </div>
          <Button asChild variant="outline"><Link to="/services">All services <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOVE SERVICE */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/10 p-10 md:p-14">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-accent">New Service</div>
              <h2 className="mt-2 display text-3xl font-bold md:text-4xl">Book a Move — In or Out</h2>
              <p className="mt-3 text-muted-foreground">
                Moving in or out of your property? Let Habico handle the logistics. Get a quick quote and schedule your move online.
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link to="/book-move">Book a Move <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <ArrowLeftRight className="h-24 w-24 text-accent/30" />
            </div>
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-accent">One platform · Three portals</div>
            <h2 className="mt-2 display text-4xl font-bold md:text-5xl">Built for owners, tenants, and our team.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {title:"Owner portal", points:["Real-time financial reports","Occupancy & rent tracking","Maintenance visibility","Downloadable statements"]},
              {title:"Tenant portal", points:["View your lease & balance","Submit maintenance requests","Payment history & receipts","Direct messaging with manager"]},
              {title:"Manager dashboard", points:["Properties, units & leases","Record payments fast","Track arrears & vacancies","Generate landlord reports"]},
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-8 shadow-card">
                <h3 className="display text-xl font-bold text-primary">{p.title}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent"/> {pt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-brand p-10 text-primary-foreground md:p-16">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <h2 className="display text-3xl font-bold md:text-5xl">Hand over the headaches.<br/>Keep all the returns.</h2>
              <p className="mt-4 text-primary-foreground/85">Talk to Habico today about managing your property the right way.</p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"><Link to="/contact">Talk to us</Link></Button>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/auth" search={{ mode: "signup" }}>Open portal</Link></Button>
            </div>
            <div className="mt-6 flex justify-center md:justify-start">
              <AppStoreBadges compact />
            </div>
          </div>
        </div>
      </section>

      <VisitAdPopup />
      <SiteFooter />
    </div>
  );
}
