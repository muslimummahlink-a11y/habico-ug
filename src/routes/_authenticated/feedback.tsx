import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquareQuote, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/feedback")({
  head: () => ({ meta: [{ title: "Feedback Moderation — Habico Portal" }] }),
  beforeLoad: ({ context }) => {
    const role = context?.auth?.highestRole;
    if (role !== "admin") throw new Error("Only admins can moderate feedback.");
  },
  component: FeedbackModeration,
});

function FeedbackModeration() {
  const role = useHighestRole();
  const queryClient = useQueryClient();
  const { data: testimonials = [] } = useQuery({
    queryKey: ["pending-testimonials"],
    queryFn: async () => { const { data, error } = await supabase.from("property_testimonials").select("*").eq("status", "pending").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; },
    enabled: role === "admin",
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["pending-property-reviews"],
    queryFn: async () => { const { data, error } = await supabase.from("property_reviews").select("*, properties(name)").eq("status", "pending").order("created_at", { ascending: false }); if (error) throw error; return data ?? []; },
    enabled: role === "admin",
  });
  const moderate = useMutation({
    mutationFn: async ({ table, id, status }: { table: "property_testimonials" | "property_reviews"; id: string; status: "approved" | "rejected" }) => { const { error } = await supabase.from(table).update({ status, approved_by: status === "approved" ? (await supabase.auth.getUser()).data.user?.id : null, approved_at: status === "approved" ? new Date().toISOString() : null }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pending-testimonials"] }); queryClient.invalidateQueries({ queryKey: ["pending-property-reviews"] }); toast.success("Feedback updated."); },
    onError: (error) => toast.error((error as Error).message),
  });
  return <div className="mx-auto max-w-5xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-widest text-accent">Administration</p><h1 className="display text-3xl font-bold">Feedback moderation</h1><p className="mt-1 text-sm text-muted-foreground">Approve genuine owner and tenant experiences before they appear publicly.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5 text-accent" /> Testimonials awaiting approval</CardTitle></CardHeader><CardContent className="space-y-4">{testimonials.length === 0 ? <p className="text-sm text-muted-foreground">No testimonials awaiting review.</p> : testimonials.map((item: any) => <div key={item.id} className="border-t pt-4 first:border-t-0 first:pt-0"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold">{item.author_name} <span className="ml-2 text-xs font-normal text-muted-foreground">{item.subject_label}</span></p><p className="mt-2 text-sm text-muted-foreground">“{item.quote}”</p></div><div className="flex shrink-0 gap-2"><Button size="sm" onClick={() => moderate.mutate({ table: "property_testimonials", id: item.id, status: "approved" })}><Check className="h-4 w-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => moderate.mutate({ table: "property_testimonials", id: item.id, status: "rejected" })}><X className="h-4 w-4" />Reject</Button></div></div></div>)}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-accent" /> Property reviews awaiting approval</CardTitle></CardHeader><CardContent className="space-y-4">{reviews.length === 0 ? <p className="text-sm text-muted-foreground">No property reviews awaiting review.</p> : reviews.map((item: any) => <div key={item.id} className="border-t pt-4 first:border-t-0 first:pt-0"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold">{item.author_name} <span className="ml-2 text-xs font-normal text-muted-foreground">{item.author_role === "owner" ? "Owner" : "Tenant"} · {item.properties?.name ?? "Property"}</span></p><div className="mt-1 flex">{[1,2,3,4,5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= item.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div><p className="mt-2 text-sm text-muted-foreground">{item.body}</p></div><div className="flex shrink-0 gap-2"><Button size="sm" onClick={() => moderate.mutate({ table: "property_reviews", id: item.id, status: "approved" })}><Check className="h-4 w-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => moderate.mutate({ table: "property_reviews", id: item.id, status: "rejected" })}><X className="h-4 w-4" />Reject</Button></div></div></div>)}</CardContent></Card></div>;
}
