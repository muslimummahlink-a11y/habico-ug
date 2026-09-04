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
import { Building2, HardHat, Users, UserCog, ShieldCheck, CreditCard, Camera, CameraOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { validateLicenseKey } from "@/lib/validateLicenseKey.functions";
import { activateLicenseKey } from "@/lib/activateLicenseKey.functions";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional(), redirect: z.string().optional(), c: z.string().optional() });

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

function AuthPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

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

  // License key activation
  const [licenseKey, setLicenseKey] = useState("");
  const [licensing, setLicensing] = useState(false);
  const [licenseResult, setLicenseResult] = useState<{ valid: boolean; companyName?: string; companyId?: string; hasAdmin?: boolean; message?: string } | null>(null);
  const [activateName, setActivateName] = useState("");
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePassword, setActivatePassword] = useState("");
  const [activatePhone, setActivatePhone] = useState("");
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: search.redirect ?? "/dashboard" });
  }, [loading, user, nav, search.redirect]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Habico.");
      } else {
        localStorage.setItem('__habico_remember_me', String(rememberMe));
        if (rememberMe) {
          localStorage.setItem('__habico_remembered_email', email);
        } else {
          localStorage.removeItem('__habico_remembered_email');
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-gradient-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground"><Building2 className="h-5 w-5"/></div>
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
      <div className="flex items-center justify-center bg-background px-4 py-10 md:p-10">
        <div className="w-full max-w-sm space-y-8">
          <form onSubmit={onSubmit}>
            <h2 className="display text-3xl font-bold">{mode === "signup" ? "Create account" : "Welcome back"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "signup" ? "Sign up to access your Habico portal." : "Sign in to your Habico portal."}</p>
            <div className="mt-8 space-y-5">
              {mode === "signup" && (
                <div><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e)=>setName(e.target.value)} required maxLength={100} className="mt-1.5"/></div>
              )}
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required maxLength={255} className="mt-1.5"/></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} className="mt-1.5"/></div>
              {mode === "signin" && (
                <div className="flex items-center gap-3">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">Remember me</Label>
                </div>
              )}
              <Button type="submit" disabled={busy} className="w-full">{busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}</Button>
              <p className="text-center text-sm text-muted-foreground">
                {mode === "signup" ? "Already have an account?" : "New to Habico?"}{" "}
                <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={()=>setMode(mode==="signup"?"signin":"signup")}>
                  {mode === "signup" ? "Sign in" : "Create one"}
                </button>
              </p>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Activate company license</span></div>
          </div>

          {activated ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Account created!</p>
                <p className="text-sm text-muted-foreground">You can now sign in with your email.</p>
              </div>
              <Button size="sm" onClick={() => { setMode("signin"); setLicenseKey(""); setLicenseResult(null); setActivated(false); }}>
                Go to Sign In
              </Button>
            </div>
          ) : licenseResult?.valid && !licenseResult.hasAdmin ? (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{licenseResult.companyName}</p>
                  <p className="text-xs text-muted-foreground">Create your admin account to activate</p>
                </div>
              </div>
              <div className="space-y-3">
                <div><Label>Full name *</Label><Input value={activateName} onChange={(e) => setActivateName(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Email *</Label><Input type="email" value={activateEmail} onChange={(e) => setActivateEmail(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input value={activatePhone} onChange={(e) => setActivatePhone(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Password *</Label><Input type="password" value={activatePassword} onChange={(e) => setActivatePassword(e.target.value)} minLength={8} className="mt-1.5" /></div>
                <Button
                  className="w-full"
                  disabled={activating}
                  onClick={async () => {
                    if (!activateName || !activateEmail || !activatePassword) { toast.error("Fill in all required fields"); return; }
                    if (activatePassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
                    setActivating(true);
                    try {
                      const result = await activateLicenseKey({ data: { licenseKey, adminName: activateName, adminEmail: activateEmail, adminPassword: activatePassword, adminPhone: activatePhone } });
                      if (!result.success) { toast.error(result.message); return; }
                      setActivated(true);
                      toast.success("Admin account created! You can now sign in.");
                    } catch (e) {
                      toast.error((e as Error).message);
                    } finally {
                      setActivating(false);
                    }
                  }}
                >
                  {activating ? "Creating account..." : "Create Admin Account"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => { setLicenseKey(""); setLicenseResult(null); }}
                >
                  Use a different license key
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="license-key">License Key</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="license-key"
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              {licenseResult?.valid === false && (
                <p className="text-sm text-destructive">{licenseResult.message}</p>
              )}
              {licenseResult?.valid && licenseResult.hasAdmin && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                  <p className="font-medium text-green-800">{licenseResult.companyName}</p>
                  <p className="mt-1 text-green-700">This license is already activated. Sign in with your email.</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setMode("signin")}>
                    Go to Sign In
                  </Button>
                </div>
              )}
              <Button
                className="w-full"
                variant="outline"
                disabled={licensing || !licenseKey.trim()}
                onClick={async () => {
                  setLicensing(true);
                  setLicenseResult(null);
                  try {
                    const result = await validateLicenseKey({ data: { licenseKey: licenseKey.trim() } });
                    if (!result.valid) {
                      setLicenseResult({ valid: false, message: result.message });
                      return;
                    }
                    setLicenseResult({
                      valid: true,
                      companyName: result.companyName,
                      companyId: result.companyId,
                      hasAdmin: result.hasAdmin,
                    });
                    if (!result.hasAdmin) {
                      setActivateName("");
                      setActivateEmail("");
                      setActivatePassword("");
                      setActivatePhone("");
                    }
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setLicensing(false);
                  }
                }}
              >
                <UserCog className="mr-2 h-4 w-4" />
                {licensing ? "Validating..." : "Validate License Key"}
              </Button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Tenant sign in with ID card</span></div>
          </div>

          {cardSent ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Signing you in...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-number">Card number</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="card-number"
                    placeholder="e.g. HBC-PUUX-BCXT"
                    value={cardValue}
                    onChange={(e) => setCardValue(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="unit-number">Unit number</Label>
                  <Input
                    id="unit-number"
                    placeholder="e.g. A1"
                    value={tenantUnitNumber}
                    onChange={(e) => setTenantUnitNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pin">Access PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4-digit PIN"
                    value={tenantPin}
                    onChange={(e) => setTenantPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="card-remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c === true)} />
                <Label htmlFor="card-remember" className="text-sm font-normal cursor-pointer select-none">Remember me</Label>
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  if (!cardValue.trim() || !tenantUnitNumber.trim() || !tenantPin.trim()) {
                    toast.error("Fill in all fields");
                    return;
                  }
                  setCardSending(true);
                  try {
                    const { data, error } = await supabase.rpc("validate_card_login", {
                      p_card_number: cardValue.trim(),
                      p_unit_number: tenantUnitNumber.trim(),
                      p_access_pin: tenantPin.trim(),
                    });
                    if (error) throw error;
                    if (!data || !data[0]) throw new Error("No response from server");
                    const result = data[0];
                    if (!result.valid) {
                      toast.error(result.error_message);
                      return;
                    }
                    const pin = "Hb" + tenantPin.trim();
                    const authEmail = cardValue.trim().toLowerCase() + "@habico.ug";
                    localStorage.setItem('__habico_remember_me', String(rememberMe));
                    if (rememberMe) {
                      localStorage.setItem('__habico_remembered_email', authEmail);
                    } else {
                      localStorage.removeItem('__habico_remembered_email');
                    }
                    const { error: signInErr } = await supabase.auth.signInWithPassword({
                      email: authEmail,
                      password: pin,
                    });
                    if (signInErr?.message?.includes("Invalid login credentials")) {
                      const { error: signUpErr } = await supabase.auth.signUp({
                        email: authEmail,
                        password: pin,
                      });
                      if (signUpErr?.message?.includes("already registered")) {
                        toast.error("Login failed. Contact your property manager.");
                        return;
                      }
                      if (signUpErr) throw signUpErr;
                      toast.success("Account created. Signing you in...");
                      const { error: retryErr } = await supabase.auth.signInWithPassword({
                        email: authEmail,
                        password: pin,
                      });
                      if (retryErr) throw retryErr;
                    } else if (signInErr) {
                      throw signInErr;
                    }
                    setCardSent(true);
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setCardSending(false);
                  }
                }}
                disabled={cardSending}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {cardSending ? "Verifying..." : "Sign in with ID Card"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or scan QR code</span></div>
              </div>
              <QrScanner onScan={(c) => setCardValue(c)} />
            </div>
          )}
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
