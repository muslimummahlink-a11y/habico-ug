import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Habico Property Managers" },
      { name: "description", content: "Reach Habico Property Managers in Kampala by phone, email, or our online form." },
      { property: "og:title", content: "Contact Habico" },
      { property: "og:description", content: "Get in touch with the Habico team." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sending, setSending] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Contact</div>
          <h1 className="mt-3 display text-5xl font-bold md:text-6xl">Let's talk about your property.</h1>
          <p className="mt-3 max-w-xl text-lg text-primary-foreground/85">Whether you have one home or a tenement, we'll show you how Habico can lift its performance.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 md:grid-cols-2">
        <div className="space-y-6">
          {[
            { icon: MapPin, label: "Office", value: "Basiima Buildings, 2nd Floor, Room C03\nP.O Box 193498, Kampala" },
            { icon: Phone, label: "Phone", value: "0702 239 607\n0756 742 220" },
            { icon: Mail, label: "Email", value: "habicopropertymanagers@gmail.com" },
          ].map((c) => (
            <div key={c.label} className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><c.icon className="h-5 w-5"/></div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-accent">{c.label}</div>
                <div className="mt-1 whitespace-pre-line text-sm text-foreground">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => { setSending(false); toast.success("Thanks! We'll be in touch soon."); (e.target as HTMLFormElement).reset(); }, 600);
          }}
          className="rounded-2xl border border-border bg-card p-8 shadow-card"
        >
          <h2 className="display text-2xl font-bold">Send us a message</h2>
          <div className="mt-6 grid gap-4">
            <div><Label htmlFor="name">Full name</Label><Input id="name" required maxLength={100} className="mt-1.5"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required maxLength={255} className="mt-1.5"/></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" maxLength={30} className="mt-1.5"/></div>
            </div>
            <div><Label htmlFor="msg">Message</Label><Textarea id="msg" required maxLength={1000} rows={5} className="mt-1.5"/></div>
            <Button type="submit" disabled={sending} className="bg-accent text-accent-foreground hover:bg-accent/90">{sending ? "Sending…" : "Send message"}</Button>
          </div>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
