import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function VisitAdPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("habico_ad_shown");
    if (!shown) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("habico_ad_shown", "true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-accent/20 bg-card p-6 shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
            <Megaphone className="h-7 w-7 text-accent" />
          </div>
          <h3 className="mt-4 text-xl font-bold">Advertise With Habico</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get your property, land, or business in front of thousands of potential buyers and tenants.
            List with Habico today!
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild size="sm" onClick={() => setOpen(false)}>
              <Link to="/contact">List Your Property</Link>
            </Button>
            <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
              <Link to="/rent">Browse Properties</Link>
            </Button>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Contact Habico at 0702 239 607 / 0756 742 220 or licenses@habico.ug
          </p>
        </div>
      </div>
    </div>
  );
}
