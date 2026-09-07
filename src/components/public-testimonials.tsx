import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PublicTestimonials() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ["public-testimonials"],
    queryFn: async () => { const { data, error } = await supabase.from("property_testimonials").select("id, author_name, author_role, subject_label, quote").eq("status", "approved").order("created_at", { ascending: false }).limit(6); if (error) throw error; return data ?? []; },
  });
  if (!testimonials.length) return null;
  return <section className="border-b border-border bg-background py-14 md:py-20"><div className="mx-auto max-w-7xl px-4"><div className="max-w-2xl"><div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">From the Habico community</div><h2 className="mt-3 display text-3xl font-bold text-primary md:text-5xl">Happy landlords. Happier tenants.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-3">{testimonials.map((item: any) => <figure key={item.id} className="border-t-2 border-accent/60 pt-5"><Quote className="h-6 w-6 text-accent" /><blockquote className="mt-4 text-sm leading-6 text-muted-foreground">“{item.quote}”</blockquote><figcaption className="mt-5 text-sm font-semibold text-primary">{item.author_name}<span className="block text-xs font-normal text-muted-foreground">{item.subject_label}</span></figcaption></figure>)}</div></div></section>;
}
