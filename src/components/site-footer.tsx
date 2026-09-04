import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import AppStoreBadges from "@/components/app-store-badges";
import logoSrc from "@/assets/habico-logo.png";

export function SiteFooter() {
  const isNative = typeof window !== "undefined" && "Capacitor" in window;
  if (isNative) return null;
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="Habico" className="h-10 w-10 rounded-md object-cover" />
            <div className="display text-xl font-bold">HABICO</div>
          </div>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/75">
            Elevating the value of your residences. Full-service property management for landlords and tenants across Uganda.
          </p>
        </div>
        <div>
          <h4 className="display text-sm font-bold uppercase tracking-widest text-accent">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            <li><Link to="/rent">Properties Available</Link></li>
            <li><Link to="/land">Land for Sale</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/auth">Portal sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="display text-sm font-bold uppercase tracking-widest text-accent">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Basiima Buildings, 2nd Floor Room C03, Kampala</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 0702 239 607 / 0756 742 220</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> habicopropertymanagers@gmail.com</li>
          </ul>
        </div>
        <div>
          <h4 className="display text-sm font-bold uppercase tracking-widest text-accent">Download</h4>
          <div className="mt-3 [&>div]:justify-start"><AppStoreBadges compact /></div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        <div className="mb-2">© {new Date().getFullYear()} Habico Property Managers Limited. All rights reserved.</div>
        <div className="flex items-center justify-center gap-1.5">
          <span>Developed by</span>
          <svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto" style={{ filter: "brightness(0) invert(0.6)" }}>
            <g transform="translate(340,110)">
              <rect x="-178" y="-52" width="7" height="80" rx="3.5" fill="#005bc4" />
              <text x="-158" y="8" font-family="'Montserrat','Inter','Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="58" fill="#1a2a3a" text-anchor="start" letter-spacing="-1">TENNA</text>
              <text x="10" y="8" font-family="'Montserrat','Inter','Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="58" fill="#005bc4" text-anchor="start" letter-spacing="-1">HUB</text>
              <rect x="-158" y="20" width="338" height="2" rx="1" fill="#c8d4e0" />
              <text x="-158" y="50" font-family="'Montserrat','Inter','Helvetica Neue',Arial,sans-serif" font-weight="300" font-size="13" fill="#6a80a0" text-anchor="start" letter-spacing="9">TECHNOLOGIES</text>
            </g>
          </svg>
        </div>
      </div>
    </footer>
  );
}
