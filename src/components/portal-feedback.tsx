import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareQuote, Send, Star } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function PortalFeedback() {
  const { user } = useAuth();
  const role = useHighestRole();
  const authorRole = role === "owner" ? "owner" : role === "tenant" ? "tenant" : null;
  const queryClient = useQueryClient();
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const { data: subjects = [] } = useQuery({
    queryKey: ["feedback-subjects", user?.id, authorRole],
    queryFn: async () => {
      if (!user || !authorRole) return [];
      if (authorRole === "owner") {
        const { data, error } = await supabase.from("properties").select("id, name, location").eq("owner_id", user.id).order("name");
        if (error) throw error;
        return data ?? [];
      }
      const { data, error } = await supabase.from("leases").select("units!inner(properties!inner(id, name, location))").eq("tenant_id", user.id).eq("status", "active");
      if (error) throw error;
      return (data ?? []).map((lease: any) => lease.units.properties).filter(Boolean);
    },
    enabled: !!user && !!authorRole,
  });

  const submitTestimonial = useMutation({
    mutationFn: async () => {
      if (!user || !authorRole || !quote.trim()) throw new Error("Write a testimonial first.");
      const subject = subjects[0];
      if (!subject) throw new Error("No linked property is available yet.");
      const { error } = await supabase.from("property_testimonials").insert({
        author_id: user.id,
        author_role: authorRole,
        author_name: user.user_metadata?.full_name ?? user.email ?? authorRole,
        subject_property_id: subject.id,
        subject_label: `${authorRole === "owner" ? "Owner" : "Tenant"} · ${subject.name}`,
        quote: quote.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setQuote(""); toast.success("Testimonial submitted for admin approval."); queryClient.invalidateQueries({ queryKey: ["public-testimonials"] }); },
    onError: (error) => toast.error((error as Error).message),
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !authorRole || !review.trim()) throw new Error("Write a review first.");
      const subject = subjects[0];
      if (!subject) throw new Error("No linked property is available yet.");
      const { error } = await supabase.from("property_reviews").insert({
        property_id: subject.id,
        author_id: user.id,
        author_role: authorRole,
        author_name: user.user_metadata?.full_name ?? user.email ?? authorRole,
        rating,
        body: review.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { setReview(""); toast.success("Review submitted for admin approval."); },
    onError: (error) => toast.error((error as Error).message),
  });

  if (!authorRole) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquareQuote className="h-4 w-4 text-accent" /> Share your experience</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Your testimonial will show after an admin approves it, with the label {authorRole === "owner" ? "Owner" : "Tenant"} and your property name.</p>
          <Textarea value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="Tell future Habico customers what has improved for you..." maxLength={1000} />
          <Button onClick={() => submitTestimonial.mutate()} disabled={submitTestimonial.isPending || quote.trim().length < 20}><Send className="h-4 w-4" />Submit testimonial</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Review your property experience</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} stars`} onClick={() => setRating(value)} className="p-1"><Star className={`h-5 w-5 ${value <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} /></button>)}
          </div>
          <Textarea value={review} onChange={(event) => setReview(event.target.value)} placeholder="What should owners or tenants know about this property?" maxLength={1000} />
          <Button variant="outline" onClick={() => submitReview.mutate()} disabled={submitReview.isPending || review.trim().length < 10}>Submit review</Button>
        </CardContent>
      </Card>
    </div>
  );
}
