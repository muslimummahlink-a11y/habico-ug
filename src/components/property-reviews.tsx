import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, Star } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function visitorId() {
  if (typeof window === "undefined") return "server";
  const key = "habico_review_visitor";
  const current = localStorage.getItem(key);
  if (current) return current;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState<Record<string, string>>({});
  const { data: reviews = [] } = useQuery({
    queryKey: ["property-reviews", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("property_reviews").select("id, author_name, author_role, rating, body, created_at").eq("property_id", propertyId).eq("status", "approved").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: likes = [] } = useQuery({
    queryKey: ["property-review-likes", propertyId],
    queryFn: async () => {
      const ids = reviews.map((review) => review.id);
      if (!ids.length) return [];
      const { data, error } = await supabase.from("property_review_likes").select("review_id, visitor_id").in("review_id", ids);
      if (error) throw error;
      return data ?? [];
    },
    enabled: reviews.length > 0,
  });
  const like = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from("property_review_likes").insert({ review_id: reviewId, visitor_id: visitorId() });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["property-review-likes", propertyId] }),
    onError: () => toast.error("You already liked this review."),
  });
  const addComment = useMutation({
    mutationFn: async ({ reviewId, body }: { reviewId: string; body: string }) => {
      if (!user) throw new Error("Sign in to comment.");
      const { error } = await supabase.from("property_review_comments").insert({ review_id: reviewId, author_id: user.id, author_name: user.user_metadata?.full_name ?? user.email ?? "Habico user", body });
      if (error) throw error;
    },
    onSuccess: (_, variables) => { setComment((current) => ({ ...current, [variables.reviewId]: "" })); toast.success("Comment added."); },
    onError: (error) => toast.error((error as Error).message),
  });
  if (!reviews.length) return <p className="border-t pt-4 text-sm text-muted-foreground">No approved reviews yet. Be the first to share your experience.</p>;
  return <div className="space-y-4 border-t pt-5"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-accent" /><h4 className="text-sm font-semibold">Property reviews</h4></div>{reviews.map((review) => { const reviewLikes = likes.filter((item) => item.review_id === review.id); return <div key={review.id} className="space-y-2 border-b pb-4 last:border-0"><div className="flex items-center justify-between gap-3"><div><span className="font-medium">{review.author_name}</span><span className="ml-2 text-xs text-muted-foreground">{review.author_role === "owner" ? "Owner" : "Tenant"}</span></div><div className="flex" aria-label={`${review.rating} out of 5 stars`}>{[1,2,3,4,5].map((value) => <Star key={value} className={`h-3.5 w-3.5 ${value <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div></div><p className="text-sm text-muted-foreground">{review.body}</p><button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent" onClick={() => like.mutate(review.id)}><Heart className="h-3.5 w-3.5" />{reviewLikes.length} likes</button>{user && <div className="flex gap-2"><Textarea value={comment[review.id] ?? ""} onChange={(event) => setComment((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Add a comment" className="min-h-9" /><Button size="icon" variant="outline" aria-label="Post comment" disabled={!comment[review.id]?.trim() || addComment.isPending} onClick={() => addComment.mutate({ reviewId: review.id, body: comment[review.id].trim() })}><Send className="h-4 w-4" /></Button></div>}</div>;})}</div>;
}
