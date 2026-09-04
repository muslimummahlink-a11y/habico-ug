import { Link } from "@tanstack/react-router";
import { Menu, MoreHorizontal, User, LogIn, LayoutDashboard, ExternalLink, Download, ChevronDown, Paintbrush, Home, Truck, Wrench, Hammer, ShowerHead, Sparkles, Droplets } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import AppStoreBadges, { getExeDownloadUrl } from "@/components/app-store-badges";
import logoSrc from "@/assets/habico-logo.png";

const services = [
  { label: "Property Management", to: "/services" as const, icon: Home },
  { label: "Maintenance & Repairs", to: "/services" as const, icon: Wrench },
  { label: "Cleaning", to: "/services" as const, icon: Sparkles },
  { label: "Painting", to: "/services" as const, icon: Paintbrush },
  { label: "Renovation", to: "/services" as const, icon: Hammer },
  { label: "Fumigation", to: "/services" as const, icon: ShowerHead },
  { label: "Plumbing", to: "/services" as const, icon: Droplets },
  { label: "Moving / Relocation", to: "/book-move" as const, icon: Truck },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLLIElement>(null);
  const isNative = typeof window !== "undefined" && "Capacitor" in window;
  if (isNative) return null;
  const { user } = useAuth();
  const nav = [
    { label: "Home", to: "/" as const },
    { label: "Properties", to: "/rent" as const },
    { label: "Land", to: "/land" as const },
    { label: "Services", to: "/services" as const },
    { label: "Pricing", to: "/pricing" as const },
    { label: "Download", to: "/download" as const },
    { label: "Move Service", to: "/book-move" as const },
    { label: "About", to: "/about" as const },
    { label: "Contact", to: "/contact" as const },
  ];

  useEffect(() => {
    if (!moreOpen && !servicesOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen, servicesOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoSrc} alt="Habico" className="h-10 w-10 rounded-md object-cover" />
          <div className="leading-tight hidden xs:block">
            <div className="display text-base font-bold text-primary">HABICO</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">Property Managers</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex lg:gap-1 xl:gap-2">
          {nav.map((n) => {
            if (n.label === "Services") {
              return (
                <li key="services" ref={servicesRef} className="relative list-none">
                  <button
                    onClick={() => setServicesOpen((o) => !o)}
                    className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:px-3"
                  >
                    Services
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {servicesOpen && (
                    <div className="absolute left-0 top-full mt-1 w-64 rounded-xl border border-border bg-card shadow-soft">
                      <div className="p-2">
                        <div className="space-y-0.5">
                          {services.map((s) => (
                            <Link
                              key={s.label}
                              to={s.to}
                              onClick={() => setServicesOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                            >
                              <s.icon className="h-4 w-4 text-muted-foreground" />
                              {s.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            }
            return (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:px-3"
                activeProps={{ className: "bg-muted text-foreground" }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-soft">
              <div className="p-1.5">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                      Sign in
                    </Link>
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Create account
                    </Link>
                  </>
                )}
                <div className="my-1 border-t border-border" />
                <Link
                  to="/download"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  Download APK
                </Link>
                {getExeDownloadUrl() && (
                  <a
                    href={getExeDownloadUrl()}
                    download
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                    Download for Windows
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu"><Menu /></button>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="max-h-[70vh] flex-col gap-1 overflow-y-auto p-4">
            {nav.map((n) => {
              if (n.label === "Services") {
                return (
                  <div key="services-mobile" className="space-y-0.5">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Services</div>
                    {services.map((s) => (
                      <Link key={s.label} to={s.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
                        <s.icon className="h-4 w-4 text-muted-foreground" />
                        {s.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              if (n.label === "Move Service") return null;
              return (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted">{n.label}</Link>
              );
            })}
            {user ? (
              <Button asChild className="mt-2 w-full"><Link to="/dashboard">Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="outline" className="mt-2 w-full"><Link to="/auth">Sign in</Link></Button>
                <Button asChild className="mt-1 w-full"><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
              </>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <AppStoreBadges compact />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
