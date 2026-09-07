import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Receipt, Users } from "lucide-react";
import heroImg from "@/assets/hero-residence.jpg";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisitAdPopup } from "@/components/visit-ad-popup";
import AppStoreBadges from "@/components/app-store-badges";
import { PublicTestimonials } from "@/components/public-testimonials";

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
  { icon: Building2, title: "Find a residence", desc: "Browse quality homes and land managed by a team that knows Uganda.", to: "/rent" },
  { icon: Users, title: "Manage with clarity", desc: "Keep tenants, leases, payments, and maintenance in one simple portal.", to: "/services" },
  { icon: Receipt, title: "Protect your returns", desc: "Get transparent reporting and dependable day-to-day property care.", to: "/contact" },
];

const propertyImages = [
  { src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85", alt: "Bright modern living room", label: "Homes worth coming home to" },
  { src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=85", alt: "Modern residence exterior", label: "Residences managed with care" },
  { src: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=85", alt: "Green land and countryside", label: "Land with room to grow" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* HERO */}
      <section className="border-b border-border bg-secondary/35">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-[0.82fr_1.18fr] md:gap-16 md:py-16">
          <div className="max-w-xl">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Kampala · Uganda</div>
            <h1 className="mt-5 display text-5xl font-bold leading-[0.95] text-primary md:text-7xl">
              Elevate the value of your <span className="text-accent">residences.</span>
            </h1>
            <p className="mt-6 text-base leading-7 text-muted-foreground md:text-lg">
              Professional property management, transparent reporting, and dedicated tenant care for owners who expect more from their residences.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/auth">Open your portal <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5">
                <Link to="/services">Explore services</Link>
              </Button>
            </div>
            <div className="mt-8"><AppStoreBadges /></div>
          </div>
          <div className="relative">
            <img src={heroImg} alt="Modern Habico-managed residence at twilight" className="aspect-[4/3] w-full object-cover shadow-soft" width={1600} height={1200} />
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 divide-x divide-primary-foreground/20 bg-primary/95 text-primary-foreground md:bottom-6 md:left-6 md:right-6">
              {[{n:"6+",l:"Service pillars"},{n:"100%",l:"Owner transparency"},{n:"24/7",l:"Tenant support"}].map((s)=>(
                <div key={s.l} className="px-3 py-3 md:px-5 md:py-4">
                  <div className="display text-2xl font-bold text-accent md:text-3xl">{s.n}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-primary-foreground/70 md:text-xs">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3">
          {[{title:"Find a property", body:"Browse residences managed by Habico.", to:"/rent"}, {title:"Manage with clarity", body:"See every property, payment, and request in one place.", to:"/services"}, {title:"Move with confidence", body:"Book reliable moving support online.", to:"/book-move"}].map((item) => (
            <Link key={item.title} to={item.to} className="group border-l-2 border-accent/50 pl-5 transition-colors hover:border-accent">
              <h2 className="font-semibold text-primary group-hover:text-accent">{item.title} <ArrowRight className="ml-1 inline h-4 w-4" /></h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">A simpler way to manage property</div>
          <h2 className="mt-3 display text-3xl font-bold text-primary md:text-5xl">Everything important, in one place.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {services.map((s) => (
            <Link key={s.title} to={s.to} className="group border-t-2 border-border px-1 py-5 transition-colors hover:border-accent">
              <s.icon className="h-7 w-7 text-accent" />
              <h3 className="mt-5 font-semibold text-primary">{s.title} <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/35 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">The Habico standard</div>
              <h2 className="mt-3 display text-3xl font-bold text-primary md:text-5xl">Places made easier to live in.</h2>
            </div>
            <Link to="/rent" className="font-semibold text-primary hover:text-accent">View available properties <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-12 md:grid-rows-2">
            {propertyImages.map((image, index) => (
              <div key={image.src} className={`group relative min-h-56 overflow-hidden md:min-h-0 ${index === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"}`}>
                <img src={image.src} alt={image.alt} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-14 text-sm font-semibold text-white">{image.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-14 text-primary-foreground md:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Ready when you are</div>
            <h2 className="mt-3 display text-3xl font-bold md:text-5xl">Let’s make your property work harder.</h2>
          </div>
          <Button asChild size="lg" className="w-fit bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/contact">Talk to Habico <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>

      <PublicTestimonials />

      <VisitAdPopup />
      <SiteFooter />
    </div>
  );
}
