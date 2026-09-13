import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, ArrowRight, Building2, HardHat, Users, UserCog, ShieldCheck, CreditCard, Camera, CameraOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { validateLicenseKey } from "@/lib/validateLicenseKey.functions";
import { activateLicenseKey } from "@/lib/activateLicenseKey.functions";
import heroImg from "@/assets/hero-residence.jpg";
import logoSrc from "@/assets/habico-logo.png";

const searchSchema = z.object({ mode: z.enum(["signin"]).optional(), redirect: z.string().optional(), c: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — Habico Portal" }, { name: "description", content: "Access your Habico owner or tenant portal." }] }),
  component: AuthPage,
});

const roles = [
  { icon: Users, title: "Renter / Tenant", desc: "Pay rent, submit maintenance requests, view lease documents." },
  { icon: Building2, title: "Property Owner", desc: "Track income, occupancy, and property performance." },
  { icon: HardHat, title: "Worker / Staff", desc: "Log timesheets, update project tasks, submit daily reports." },
  { icon: ShieldCheck, title: "Admin / Manager", desc: "Full access to all modules, users, and system settings." },
];

type AuthMethod = "portal" | "tenant";

function AuthPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(search.c ? 2 : 1);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(search.c ? "tenant" : "portal");

  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('__habico_remember_me') !== 'false');

  useEffect(() => {
    if (rememberMe) {
      const saved = localStorage.getItem('__habico_remembered_email');
      if (saved) setEmail(saved);
    }
  }, []);

  const [cardValue, setCardValue] = useState(search.c ?? "");
  const [cardSending, setCardSending] = useState(false);
  const [cardSent, setCardSent] = useState(false);
  const [tenantUnitNumber, setTenantUnitNumber] = useState("");
  const [tenantPin, setTenantPin] = useState("");

  useEffect(() => {
    if (!loading && user) nav({ to: search.redirect ?? "/dashboard" });
  }, [loading, user, nav, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      localStorage.setItem('__habico_remember_me', String(rememberMe));
      if (rememberMe) {
        localStorage.setItem('__habico_remembered_email', email);
      } else {
        localStorage.removeItem('__habico_remembered_email');
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative flex overflow-hidden bg-gradient-hero p-6 text-primary-foreground md:flex md:flex-col md:justify-between md:p-12">
        <img src={heroImg} alt="Habico-managed residence" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-primary/60" />
        <div className="relative z-10 flex h-full flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="Habico" className="h-10 w-10 rounded-md object-cover" />
          <div className="display text-xl font-bold">HABICO</div>
        </Link>
        <div>
          <h1 className="display text-4xl font-bold leading-tight">Your property,<br/>operating beautifully.</h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">Owners track ROI in real time. Tenants pay and request repairs in seconds. Habico runs the rest.</p>
          <div className="mt-10 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">Who uses Habico?</h3>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <Card key={r.title} className="border-primary-foreground/20 bg-primary-foreground/10">
                  <CardContent className="flex items-start gap-3 p-4">
                    <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="mt-0.5 text-xs text-primary-foreground/70">{r.desc}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <div className="text-xs uppercase tracking-widest text-primary-foreground/60">Habico Property Managers · Kampala</div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background px-4 py-10 md:p-10">
        <div className="w-full max-w-sm space-y-8">
          <Button asChild variant="ghost" size="sm" className="-ml-3 w-fit gap-2 text-muted-foreground hover:text-foreground">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Back to home</Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {["Access type", "Sign in"].map((label, index) => {
                const step = (index + 1) as 1 | 2;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${wizardStep >= step ? "bg-primary text-primary-foreground" : "border border-border"}`}>{wizardStep > step ? <CheckCircle className="h-3.5 w-3.5" /> : step}</span>
                    <span className={wizardStep === step ? "text-foreground" : ""}>{label}</span>
                    {step < 2 && <span className="mx-1 h-px w-8 bg-border" />}
                  </div>
                );
              })}
            </div>

            {wizardStep === 1 ? (
              <div className="mt-8 space-y-5">
                <div>
                  <h2 className="display text-3xl font-bold">Welcome back</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose how you access your Habico portal.</p>
                </div>
                <div className="space-y-3">
                  <button type="button" onClick={() => { setAuthMethod("portal"); setWizardStep(2); }} className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Building2 className="h-6 w-6 shrink-0 text-primary" />
                    <span className="flex-1"><span className="block font-medium">Portal account</span><span className="mt-1 block text-sm text-muted-foreground">For owners, managers, staff, and administrators.</span></span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button type="button" onClick={() => { setAuthMethod("tenant"); setWizardStep(2); }} className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <CreditCard className="h-6 w-6 shrink-0 text-primary" />
                    <span className="flex-1"><span className="block font-medium">Tenant ID card</span><span className="mt-1 block text-sm text-muted-foreground">Use your card number, unit, and access PIN.</span></span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ) : authMethod === "portal" ? (
              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <div><h2 className="display text-3xl font-bold">Portal sign in</h2><p className="mt-1 text-sm text-muted-foreground">Sign in to your Habico portal.</p></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required maxLength={255} className="mt-1.5"/></div>
                <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} className="mt-1.5"/></div>
                <div className="flex items-center gap-3"><Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} /><Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">Remember me</Label></div>
                <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in..." : "Sign in"}</Button>
                <p className="text-sm text-muted-foreground">Need first-time company access? <Link to="/contact" className="font-medium text-primary hover:text-accent">Contact support</Link></p>
              </form>
            ) : cardSent ? (
              <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border p-6 text-center"><CheckCircle className="h-8 w-8 text-green-500" /><p className="font-medium">Signing you in...</p></div>
            ) : (
              <div className="mt-8 space-y-4">
                <div><h2 className="display text-3xl font-bold">Tenant sign in</h2><p className="mt-1 text-sm text-muted-foreground">Enter the details on your Habico ID card.</p></div>
                <div><Label htmlFor="card-number">Card number</Label><Input id="card-number" placeholder="e.g. HBC-PUUX-BCXT" value={cardValue} onChange={(e) => setCardValue(e.target.value)} className="mt-1.5 font-mono" /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="unit-number">Unit number</Label><Input id="unit-number" placeholder="e.g. A1" value={tenantUnitNumber} onChange={(e) => setTenantUnitNumber(e.target.value)} className="mt-1.5" /></div><div><Label htmlFor="pin">Access PIN</Label><Input id="pin" type="password" inputMode="numeric" maxLength={4} placeholder="4-digit PIN" value={tenantPin} onChange={(e) => setTenantPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="mt-1.5" /></div></div>
                <div className="flex items-center gap-3"><Checkbox id="card-remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} /><Label htmlFor="card-remember" className="text-sm font-normal cursor-pointer select-none">Remember me</Label></div>
                <Button className="w-full" onClick={async () => {
                  if (!cardValue.trim() || !tenantUnitNumber.trim() || !tenantPin.trim()) { toast.error("Fill in all fields"); return; }
                  setCardSending(true);
                  try {
                    const { data, error } = await supabase.rpc("validate_card_login", { p_card_number: cardValue.trim(), p_unit_number: tenantUnitNumber.trim(), p_access_pin: tenantPin.trim() });
                    if (error) throw error;
                    if (!data || !data[0]) throw new Error("No response from server");
                    const result = data[0];
                    if (!result.valid) { toast.error(result.error_message); return; }
                    const pin = "Hb" + tenantPin.trim();
                    const authEmail = cardValue.trim().toLowerCase() + "@habico.ug";
                    localStorage.setItem('__habico_remember_me', String(rememberMe));
                    if (rememberMe) localStorage.setItem('__habico_remembered_email', authEmail); else localStorage.removeItem('__habico_remembered_email');
                    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: pin });
                    if (signInErr?.message?.includes("Invalid login credentials")) {
                      const { error: signUpErr } = await supabase.auth.signUp({ email: authEmail, password: pin });
                      if (signUpErr?.message?.includes("already registered")) { toast.error("Login failed. Contact your property manager."); return; }
                      if (signUpErr) throw signUpErr;
                      toast.success("Account created. Signing you in...");
                      const { error: retryErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: pin });
                      if (retryErr) throw retryErr;
                    } else if (signInErr) throw signInErr;
                    setCardSent(true);
                  } catch (e) { toast.error((e as Error).message); } finally { setCardSending(false); }
                }} disabled={cardSending}><CreditCard className="mr-2 h-4 w-4" />{cardSending ? "Verifying..." : "Sign in with ID Card"}</Button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or scan QR code</span></div></div>
                <QrScanner onScan={(c) => setCardValue(c)} />
              </div>
            )}

            {wizardStep === 2 && !cardSent && <Button type="button" variant="ghost" size="sm" className="mt-5 gap-2 text-muted-foreground" onClick={() => setWizardStep(1)}><ArrowLeft className="h-4 w-4" />Change access type</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function QrScanner({ onScan }: { onScan: (cardNumber: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  async function start() {
    if (!elRef.current) return;
    setScanning(true);
    const scanner = new Html5Qrcode("auth-qr-scanner-el");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          const match = decodedText.match(/[?&]c=([^&]+)/);
          const card = match ? decodeURIComponent(match[1]) : decodedText.trim();
          if (card) onScan(card);
        },
        () => {},
      );
    } catch {
      setScanning(false);
      toast.error("Camera access denied or unavailable");
    }
  }

  async function stop() {
    await scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  }

  return (
    <div className="w-full">
      {!scanning ? (
        <Button variant="outline" className="w-full" onClick={start}>
          <Camera className="mr-2 h-4 w-4" />
          Scan with Camera
        </Button>
      ) : (
        <div className="space-y-3">
          <div ref={elRef} id="auth-qr-scanner-el" className="overflow-hidden rounded-lg" style={{ width: "100%", maxWidth: 320, height: 240, margin: "0 auto" }} />
          <Button variant="outline" className="w-full" onClick={stop}>
            <CameraOff className="mr-2 h-4 w-4" />
            Cancel Scan
          </Button>
        </div>
      )}
    </div>
  );
}
