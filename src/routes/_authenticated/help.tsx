import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, HelpCircle, Image as ImageIcon, Search } from "lucide-react";
import { allTourConfigs } from "@/components/page-tour/tour-steps";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Help Center — Habico" }, { name: "description", content: "Simple guides for using the Habico property management system." }] }),
  component: HelpPage,
});

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const routeBase = (route: string) => route.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "dashboard";

const guides = allTourConfigs.map((tour) => {
  const firstStep = tour.steps[0];
  const base = routeBase(tour.route);
  const firstStepSlug = firstStep ? toSlug(firstStep.title) : "overview";
  return {
    title: tour.title,
    route: tour.route,
    summary: tour.description,
    steps: tour.steps.slice(0, 3).map((step) => step.title),
    image: `/guides/${base}-01-${firstStepSlug}.svg`,
  };
});

function HelpPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12">
      <section className="rounded-2xl border border-border bg-secondary/35 p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          <HelpCircle className="h-4 w-4" />
          Habico Help Center
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary md:text-5xl">
          Every workflow guide in one place.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          This guide library mirrors the page-tour walkthroughs in the app, so every core section has a quick reference, overview, and screenshot.
        </p>
        <div className="mt-8 flex max-w-xl items-center gap-3 border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4 text-accent" />
          {allTourConfigs.length} guided sections included from the app tour
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <BookOpen className="h-7 w-7 text-accent" />
          <h2 className="mt-4 text-2xl font-bold text-primary">Start here</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Open the section you need, follow the numbered steps, and move back to the live dashboard when you are ready to act.
          </p>
          <Link to="/dashboard" className="mt-6 inline-flex items-center font-semibold text-primary hover:text-accent">
            Open dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </aside>

        <div className="space-y-8">
          {guides.map((guide, index) => (
            <article key={guide.route} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    Guide {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-primary">{guide.title}</h2>
                </div>
                <Link to={guide.route} className="inline-flex items-center text-sm font-semibold text-accent">
                  Open page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.summary}</p>

              <div className="mt-5 grid gap-6 md:grid-cols-[1fr_0.9fr] md:items-start">
                <ol className="space-y-3">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={`${guide.route}-${step}`} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-accent/15 text-xs font-bold text-accent">
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                <img
                  src={guide.image}
                  alt={`${guide.title} screenshot`}
                  className="hidden aspect-video w-full rounded-xl border border-border object-cover md:block"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
