import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { VisitAdPopup } from "@/components/visit-ad-popup";
import { toast } from "sonner";
import {
  MapPin, Search, SlidersHorizontal, ArrowRight, Loader2,
  Phone, Mail, MessageSquare, Ruler, Lock, Send, BadgePlus,
} from "lucide-react";

export const Route = createFileRoute("/land")({
  head: () => ({
    meta: [
      { title: "Land for Sale — Habico Properties" },
      { name: "description", content: "Browse available land for sale in Kampala and across Uganda. Inquire through Habico." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/land" }],
  }),
  component: LandPage,
});

type LandProperty = {
  id: string;
  name: string;
  address: string | null;
  location: string | null;
  city: string | null;
  property_type: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  size_sqm: number | null;
  is_active: boolean | null;
};

function LandPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high">("newest");
  const [selectedLand, setSelectedLand] = useState<LandProperty | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: "", phone: "", email: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPostLand, setShowPostLand] = useState(false);
  const [postForm, setPostForm] = useState({ name: "", location: "", size_sqm: "", price: "", description: "", phone: "", email: "" });
  const [posting, setPosting] = useState(false);

  const { data: lands = [], isLoading, error } = useQuery({
    queryKey: ["land-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("property_type", "land")
        .or("is_active.is.null,is_active.eq.true")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LandProperty[];
    },
  });

  if (error) console.error("[land] failed:", error);

  const filtered = [...lands].filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.location ?? "").toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q);
  }).sort((a, b) => {
    if (sortBy === "price_low") return (a.price ?? 0) - (b.price ?? 0);
    if (sortBy === "price_high") return (b.price ?? 0) - (a.price ?? 0);
    return 0;
  });

  function openInquiry(land: LandProperty) {
    setSelectedLand(land);
    setInquiryForm({ name: "", phone: "", email: "", message: `I'm interested in ${land.name}. Please contact me with more details.` });
    setShowInquiry(true);
  }

  async function handleSubmitInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLand) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("land_inquiries").insert({
        property_id: selectedLand.id,
        name: inquiryForm.name,
        phone: inquiryForm.phone,
        email: inquiryForm.email,
        message: inquiryForm.message,
      });
      if (error) throw error;
      toast.success("Inquiry sent! A Habico agent will contact the owner on your behalf.");
      setShowInquiry(false);
      setSelectedLand(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePostLand(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    try {
      const { error } = await supabase.from("pending_listings").insert({
        property_name: postForm.name,
        property_type: "land",
        location: postForm.location,
        size_sqm: postForm.size_sqm ? Number(postForm.size_sqm) : null,
        price: postForm.price ? Number(postForm.price) : null,
        description: postForm.description,
        contact_phone: postForm.phone,
        contact_email: postForm.email || null,
      });
      if (error) throw error;
      toast.success("Your land has been submitted! A Habico agent will review and contact you.");
      setShowPostLand(false);
      setPostForm({ name: "", location: "", size_sqm: "", price: "", description: "", phone: "", email: "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(price);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 text-primary-foreground md:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/30 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Land for Sale
          </div>
          <h1 className="mt-6 display text-4xl font-bold leading-tight md:text-6xl">
            Find Your <span className="text-accent">Plot</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Browse available land listed with Habico. Submit an inquiry and our team will connect you with the owner.
          </p>
          <div className="mx-auto mt-8 flex max-w-2xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="border-primary-foreground/20 bg-primary-foreground/10 pl-9 text-primary-foreground placeholder:text-primary-foreground/50"
                placeholder="Search by name, location or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary-foreground/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2 text-xs text-primary-foreground outline-none"
              >
                <option value="newest" className="bg-background text-foreground">Newest</option>
                <option value="price_low" className="bg-background text-foreground">Price: Low</option>
                <option value="price_high" className="bg-background text-foreground">Price: High</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-accent">{lands.length}</div><div className="text-xs text-muted-foreground">Plots Available</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-accent">{lands.filter((p) => p.price).length}</div><div className="text-xs text-muted-foreground">With Pricing</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-accent">{lands.reduce((s, p) => s + (p.size_sqm ?? 0), 0).toLocaleString()} sqm</div><div className="text-xs text-muted-foreground">Total Area</div></CardContent></Card>
        </div>
      </section>

      {/* LAND GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading land listings...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <MapPin className="h-12 w-12 text-destructive/60" />
            <div className="text-lg font-medium text-destructive">Failed to load listings</div>
            <div className="text-sm text-muted-foreground">{(error as Error).message}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-lg font-medium">No land listings found</div>
            <div className="text-sm text-muted-foreground">{search ? "Try a different search." : "No land available at the moment. Check back soon."}</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:shadow-soft"
                onClick={() => setSelectedLand(p)}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-48 w-full object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
                    <MapPin className="h-12 w-12 text-green-400/40" />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Land
                    </span>
                    {p.price && (
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{formatPrice(p.price)}</div>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 display text-lg font-bold">{p.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />{p.city ?? p.location ?? p.address ?? "Kampala"}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {p.size_sqm && (
                      <span className="flex items-center gap-1"><Ruler className="h-3 w-3" /> {p.size_sqm.toLocaleString()} sqm</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 text-accent" />
                    <span>Contact locked — inquire through Habico</span>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openInquiry(p); }}
                  >
                    Inquire <Send className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* LAND DETAIL DIALOG */}
      <Dialog open={!!selectedLand && !showInquiry} onOpenChange={(v) => { if (!v) setSelectedLand(null); }}>
        <DialogContent className="sm:max-w-lg">
          {selectedLand && (
            <>
              <DialogHeader>
                <DialogTitle className="display text-2xl">{selectedLand.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{selectedLand.city ?? selectedLand.location ?? selectedLand.address ?? "Kampala, Uganda"}
                </DialogDescription>
              </DialogHeader>

              {selectedLand.image_url && (
                <img src={selectedLand.image_url} alt={selectedLand.name} className="h-48 w-full rounded-lg object-cover" />
              )}

              <div className="space-y-4">
                {selectedLand.description && (
                  <p className="text-sm">{selectedLand.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedLand.price && (
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="text-lg font-bold">{formatPrice(selectedLand.price)}</div>
                    </div>
                  )}
                  {selectedLand.size_sqm && (
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Size</div>
                      <div className="text-lg font-bold">{selectedLand.size_sqm.toLocaleString()} sqm</div>
                    </div>
                  )}
                </div>

                {/* Contact locked notice */}
                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <h4 className="text-sm font-semibold">Owner contact protected</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        To respect the owner's privacy, their contact details are not publicly listed.
                        Submit an inquiry and a Habico agent will connect you directly with the owner.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => openInquiry(selectedLand)}>
                  Inquire About This Land <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* INQUIRY FORM DIALOG */}
      <Dialog open={showInquiry} onOpenChange={setShowInquiry}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="display text-xl">Inquire About Land</DialogTitle>
            <DialogDescription>
              {selectedLand
                ? `Send an inquiry for ${selectedLand.name}. A Habico agent will contact the owner.`
                : "Fill the form below to inquire."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitInquiry} className="space-y-4">
            <div>
              <Label>Your Name *</Label>
              <Input value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} placeholder="e.g. John Kamau" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone *</Label><Input value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} placeholder="+256 700 000 000" required /></div>
              <div><Label>Email</Label><Input type="email" value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} placeholder="you@example.com" /></div>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">
              <Lock className="mr-1 inline h-3 w-3" />
              Your details will be shared with Habico only. We will contact the land owner on your behalf.
            </p>
            <Button type="submit" disabled={submitting || !inquiryForm.name} className="w-full">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Inquiry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* SELL YOUR LAND */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-2xl border bg-card p-8 shadow-sm md:p-12">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <BadgePlus className="h-8 w-8 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="display text-2xl font-bold">Sell Your Land</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  List your land with Habico and reach qualified buyers across Uganda. Our team handles marketing, inquiries, and showings.
                </p>
              </div>
              <Button size="lg" onClick={() => setShowPostLand(true)}>
                Submit Your Land <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* POST LAND DIALOG */}
      <Dialog open={showPostLand} onOpenChange={setShowPostLand}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="display text-xl">Submit Your Land for Listing</DialogTitle>
            <DialogDescription>
              Fill in the details below. A Habico agent will review your submission and get in touch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostLand} className="space-y-4">
            <div>
              <Label>Land Title / Name *</Label>
              <Input value={postForm.name} onChange={(e) => setPostForm({ ...postForm, name: e.target.value })} placeholder="e.g. Hilltop Plot, Kira" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Location *</Label><Input value={postForm.location} onChange={(e) => setPostForm({ ...postForm, location: e.target.value })} placeholder="e.g. Kira, Wakiso" required /></div>
              <div><Label>Size (sqm)</Label><Input type="number" value={postForm.size_sqm} onChange={(e) => setPostForm({ ...postForm, size_sqm: e.target.value })} placeholder="e.g. 1000" /></div>
            </div>
            <div>
              <Label>Price (UGX)</Label>
              <Input type="number" value={postForm.price} onChange={(e) => setPostForm({ ...postForm, price: e.target.value })} placeholder="e.g. 50000000" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} rows={3} placeholder="Describe your land..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone *</Label><Input value={postForm.phone} onChange={(e) => setPostForm({ ...postForm, phone: e.target.value })} placeholder="+256 700 000 000" required /></div>
              <div><Label>Email</Label><Input type="email" value={postForm.email} onChange={(e) => setPostForm({ ...postForm, email: e.target.value })} placeholder="you@example.com" /></div>
            </div>
            <Button type="submit" disabled={posting || !postForm.name || !postForm.location || !postForm.phone} className="w-full">
              {posting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Land for Listing"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <VisitAdPopup />
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>All inquiries go through Habico Property Managers. Owner contact information is kept private.</p>
      </footer>
    </div>
  );
}
