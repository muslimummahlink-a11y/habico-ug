import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Target, Eye, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Habico Property Managers" },
      { name: "description", content: "Habico Property Managers Limited — increasing the value of your property while maximizing return on investment." },
      { property: "og:title", content: "About Habico" },
      { property: "og:description", content: "Our mission, vision, and core values." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">About Habico</div>
          <h1 className="mt-3 display text-5xl font-bold md:text-6xl max-w-3xl">Habico — A property partner that treats your investment like its own.</h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-20 md:grid-cols-3">
        {[
          { icon: Eye, title: "Vision", body: "To be Uganda's most trusted property management partner — known for transparency, tenant care, and consistent returns for owners." },
          { icon: Target, title: "Mission", body: "Increase the value of every property under our care while maximizing return on investment (ROI) for the owner." },
          { icon: Heart, title: "Core values", body: "Integrity, transparency, responsiveness, and operational excellence in every interaction." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-8 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground"><c.icon className="h-6 w-6"/></div>
            <h2 className="mt-4 display text-2xl font-bold">{c.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-3xl bg-secondary/40 p-10 md:p-16">
          <h2 className="display text-3xl font-bold md:text-4xl">What we optimize for</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              ["Maximize rental income","Competitive rates, low vacancy, on-time collections."],
              ["Preserve & enhance value","Preventive care, smart upgrades, capital improvements."],
              ["Minimize operational cost","Efficient vendors, smart budgeting, fewer emergencies."],
              ["Ensure legal compliance","Uganda housing law, lawful evictions, owner protection."],
              ["Improve tenant satisfaction","Fast responses, respectful service, positive community."],
              ["Transparent owner communication","Regular reporting, financial clarity, strategic input."],
            ].map(([h,b]) => (
              <div key={h} className="rounded-xl bg-card p-6">
                <div className="display text-lg font-bold text-primary">{h}</div>
                <p className="mt-1 text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
