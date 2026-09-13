import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PublicTestimonials({
  eyebrow = "From the Habico community",
  title = "Happy landlords. Happier tenants.",
  filterable = false,
}: {
  eyebrow?: string;
  title?: string;
  filterable?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "owner" | "tenant">("all");
  const { data: testimonials = [] } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: async () => { const { data, error } = await supabase.from("property_testimonials").select("id, author_name, author_role, subject_label, quote").eq("status", "approved").order("created_at", { ascending: false }).limit(6); if (error) throw error; return data ?? []; },
  });
  if (!testimonials.length) return null;
  const visibleTestimonials = filter === "all" ? testimonials : testimonials.filter((item: any) => item.author_role === filter);
  return <section className="border-y border-border bg-secondary/35 py-14 md:py-20"><div className="mx-auto max-w-7xl px-4"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</div><h2 className="mt-3 display text-3xl font-bold text-primary md:text-5xl">{title}</h2></div>{filterable && <div className="flex gap-1 border border-border bg-background p-1" aria-label="Filter client reviews">{(["all", "owner", "tenant"] as const).map((option) => <button key={option} type="button" onClick={() => setFilter(option)} className={`px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${filter === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{option === "all" ? "All clients" : `${option}s`}</button>)}</div>}</div>{visibleTestimonials.length ? <div className="mt-10 grid gap-5 md:grid-cols-3">{visibleTestimonials.map((item: any) => <figure key={item.id} className="border-t-2 border-accent/60 pt-5"><Quote className="h-6 w-6 text-accent" /><blockquote className="mt-4 text-sm leading-6 text-muted-foreground">“{item.quote}”</blockquote><figcaption className="mt-5 text-sm font-semibold text-primary">{item.author_name}<span className="block text-xs font-normal text-muted-foreground">{item.subject_label}</span></figcaption></figure>)}</div> : <p className="mt-8 text-sm text-muted-foreground">No approved reviews for this group yet.</p>}</div></section>;
}
