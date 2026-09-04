import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Smartphone, Tablet, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download — Habico Portal" },
      { name: "description", content: "Download the Habico Portal desktop app for Windows or get the mobile app on Google Play and App Store." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/download" }],
  }),
  component: DownloadPage,
});

const platforms = [
  {
    icon: Monitor,
    title: "Windows Desktop",
    desc: "Full Habico Portal experience on your PC. Installer includes auto-updates.",
    action: "Download for Windows",
    note: "Setup ~100 MB",
    color: "bg-blue-100 text-blue-700",
    href: "/Habico%20Portal-Setup-1.1.0.exe",
  },
  {
    icon: Smartphone,
    title: "Android",
    desc: "Manage properties, track payments, and communicate on the go.",
    action: "Download APK (v1.3.0)",
    note: "14 MB · Side-load required",
    color: "bg-green-100 text-green-700",
    href: "https://github.com/namandisafari-sketch/habico-ug/releases/download/v1.3.0/Habico-v1.3.0.apk",
  },
  {
    icon: Tablet,
    title: "iOS",
    desc: "Full mobile experience for iPhone and iPad users.",
    action: "Download on the App Store",
    note: "Coming soon",
    color: "bg-gray-100 text-gray-700",
    href: "",
  },
];

function DownloadPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-gradient-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 backdrop-blur">
            <Download className="h-8 w-8" />
          </div>
          <h1 className="display text-5xl font-bold md:text-6xl">Download Habico Portal</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/85">
            Access your property management platform anywhere — on desktop, tablet, or phone.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {platforms.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${p.color}`}>
                <p.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 display text-xl font-bold">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6">
                <Button asChild className="w-full" disabled={!p.href}>
                  <a href={p.href || "#"} download={!!p.href}>
                    {p.action} <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">{p.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
