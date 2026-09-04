import { useNavigate } from "@tanstack/react-router";
import { Building2, HardHat, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppMode, type AppMode } from "@/hooks/app-mode";

const options: { mode: AppMode; icon: typeof Building2; title: string; desc: string }[] = [
  { mode: "landlord", icon: Building2, title: "Landlord / Owner", desc: "Track properties, income, and occupancy. Manage leases and view reports." },
  { mode: "company", icon: HardHat, title: "Staff / Admin", desc: "Full-access management hub — properties, tenants, finances, and more." },
  { mode: "visitor", icon: Search, title: "Visitor / Renter", desc: "Browse available rentals, view details, and apply or contact Habico." },
];

const isNative = typeof window !== "undefined" && "Capacitor" in window;

export function AppModeSelector() {
  const nav = useNavigate();
  const { setMode } = useAppMode();

  function handleSelect(mode: AppMode) {
    setMode(mode);
    if (mode === "landlord") {
      nav({ to: "/auth", search: { mode: "signup" } });
    } else if (mode === "company") {
      nav({ to: "/auth", search: { mode: "signin" } });
    } else {
      nav({ to: "/rent" });
    }
  }

  return (
    <div
      onPlaying={remove }
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 px-5 py-12"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00566A] text-white shadow-lg">
          <Building2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Habico</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">How would you like to access?</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {options.map((opt) => (
          <Card
            key={opt.mode}
            className="group cursor-pointer transition active:scale-[0.98]"
            onClick={() => handleSelect(opt.mode)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00566A]/10 text-[#00566A]">
                <opt.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{opt.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{opt.desc}</div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/30" />
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 max-w-xs text-center text-xs text-muted-foreground leading-relaxed">
        Choose how you'd like to use Habico. You can switch later from the menu.
      </p>
    </div>
  );
}
