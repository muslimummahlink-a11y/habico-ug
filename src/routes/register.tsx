import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Check, Copy, ExternalLink, Loader2, ArrowLeft, Phone, User, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { submitRegistration } from "@/lib/submitRegistration.functions";
import { completeRegistration } from "@/lib/completeRegistration.functions";
import AppStoreBadges from "@/components/app-store-badges";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
};

type PaymentSetting = {
  id: string;
  provider: string;
  phone_number: string;
  account_name: string;
  instructions: string | null;
  is_active: boolean;
};

const PROVIDER_LABELS: Record<string, string> = {
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
  bank_transfer: "Bank Transfer",
};

const PROVIDER_ICONS: Record<string, typeof Smartphone> = {
  mtn_momo: Smartphone,
  airtel_money: Smartphone,
};

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register — Habico Portal" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ plan: typeof s.plan === "string" ? s.plan : undefined }),
  component: RegisterPage,
});

export function RegisterPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { plan?: string };

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "Register — Habico Portal";
  }, []);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ["register-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
      if (error && !error.message?.includes("does not exist")) throw error;
      return (data ?? []) as Plan[];
    },
    retry: false,
  });

  const { data: paymentSetting } = useQuery({
    queryKey: ["payment-setting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_settings" as any).select("*").eq("is_active", true).maybeSingle();
      if (error) throw error;
      return data as PaymentSetting | null;
    },
    retry: false,
  });

  // Preselect plan from ?plan=slug or ?plan=id
  const preselect = useMemo(() => search.plan, [search.plan]);
  useEffect(() => {
    if (!preselect || selectedPlan) return;
    const p = plans.find((x) => x.slug === preselect || x.id === preselect);
    if (p) setSelectedPlan(p);
  }, [preselect, plans, selectedPlan]);

  const submitPayment = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) throw new Error("No plan selected");
      return submitRegistration({ data: {
        planId: selectedPlan.id,
        amount: selectedPlan.monthly_price,
        transactionId,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        adminName,
        adminEmail,
        adminPassword,
        adminPhone,
      }});
    },
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Payment submitted! An admin will verify your transaction shortly.");
      setStep(4);
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to submit payment"),
  });

  const finishFreeRegistration = useMutation({
    mutationFn: async () => completeRegistration({ data: {
      paymentIntentId: "",
      planId: selectedPlan?.id ?? "",
      companyName, companyEmail, companyPhone, companyAddress,
      adminName, adminEmail, adminPassword, adminPhone,
    }}),
    onSuccess: (result) => {
      if (!result.success) { toast.error(result.error); return; }
      setLicenseKey(result.licenseKey);
      setStep(4);
      toast.success("Registration complete!");
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to register"),
  });

  function handleContinueToPlan() {
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (adminPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setStep(2);
    if (selectedPlan) handleSelectPlan(selectedPlan);
  }

  function handleSelectPlan(plan: Plan) {
    setSelectedPlan(plan);
    if (Number(plan.monthly_price) <= 0) {
      finishFreeRegistration.mutate();
      return;
    }
    setStep(3);
  }

  function handleSubmitPayment() {
    if (!transactionId || transactionId.trim().length < 3) {
      toast.error("Please enter the transaction ID from your payment message");
      return;
    }
    submitPayment.mutate();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/pricing"><ArrowLeft className="mr-1 h-4 w-4" /> Back to pricing</Link>
          </Button>
        </div>
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Habico Portal</h1>
          </div>
          <p className="text-muted-foreground">Register your company to get started{selectedPlan ? ` — ${selectedPlan.name}` : ""}</p>
        </div>

        {/* Steps indicator */}
        <div className="mb-8 flex items-center justify-center gap-2 text-sm">
          {["Details", "Plan", "Payment", "Done"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step >= i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={step >= i + 1 ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {i < 3 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Company & Admin Details</CardTitle><CardDescription>Tell us about your company and the admin account</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Company Information</h3>
                <div>
                  <Label>Company Name *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your property management company" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="company@example.com" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+256..." />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Physical address" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Admin Account</h3>
                <div>
                  <Label>Full Name *</Label>
                  <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} placeholder="+256..." />
                  </div>
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Min 8 characters" />
                </div>
              </div>

              <Button className="w-full" onClick={handleContinueToPlan}>Continue to Plan Selection</Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Choose Your Plan</CardTitle><CardDescription>Select the subscription package that fits your needs</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={finishFreeRegistration.isPending}
                      className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary ${
                        selectedPlan?.id === plan.id ? "border-primary ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        plan.slug === "full-suite" ? "bg-amber-100 text-amber-700" :
                        plan.slug === "construction" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{plan.name}</div>
                        {plan.description && <div className="text-sm text-muted-foreground">{plan.description}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">UGX {Number(plan.monthly_price).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">/month</div>
                      </div>
                    </button>
                  ))}
                </div>

                {finishFreeRegistration.isPending && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Registering...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Payment Instructions</CardTitle><CardDescription>Send your payment to complete registration</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                {paymentSetting ? (
                  <>
                    <div className="rounded-lg border bg-blue-50 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Phone className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Send to</p>
                          <p className="font-semibold text-lg">{paymentSetting.phone_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <User className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Account Name</p>
                          <p className="font-semibold">{paymentSetting.account_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Building2 className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-semibold text-lg">UGX {Number(selectedPlan?.monthly_price ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                      {paymentSetting.instructions && (
                        <p className="text-xs text-muted-foreground mt-2">{paymentSetting.instructions}</p>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">After sending payment, enter the transaction ID below:</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Look for <strong>TID</strong> in your mobile money confirmation message — it's a 12-digit number.
                      </p>
                      <div>
                        <Label>Transaction ID (TID)</Label>
                        <Input
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 123456789012"
                          className="mt-1.5 font-mono"
                          maxLength={20}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSubmitPayment}
                      disabled={!transactionId || submitPayment.isPending}
                    >
                      {submitPayment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {submitPayment.isPending ? "Submitting..." : `Submit Payment — UGX ${Number(selectedPlan?.monthly_price ?? 0).toLocaleString()}`}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Payment details are not configured yet. Please contact sales to activate this plan.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>{licenseKey ? "Registration Complete!" : "Payment Submitted"}</CardTitle>
                  <CardDescription>
                    {licenseKey
                      ? "Your company has been registered successfully"
                      : "Your payment has been submitted for verification"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {licenseKey && (
                <div className="rounded-lg border bg-amber-50 p-4">
                  <Label className="text-amber-800 font-semibold">Your License Key</Label>
                  <div className="mt-2 flex gap-2">
                    <code className="flex-1 rounded bg-amber-100 px-3 py-2 text-sm font-mono break-all">{licenseKey}</code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { navigator.clipboard.writeText(licenseKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-amber-700">Save this key — you'll need it to activate your company's access</p>
                </div>
              )}

              {!licenseKey && (
                <div className="rounded-lg border bg-blue-50 p-4 text-sm">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Your payment will be reviewed by an admin</li>
                    <li>Once verified, your company will be activated</li>
                    <li>You'll receive your license key and login credentials via email</li>
                  </ol>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {adminEmail}</p>
                <p><strong>Company:</strong> {companyName}</p>
                <p><strong>Plan:</strong> {selectedPlan?.name}</p>
              </div>

              {licenseKey && (
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-medium mb-1">What's next?</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Check your email for login credentials</li>
                    <li>Log in at <a href="https://www.habico.ug" className="text-primary underline">habico.ug</a></li>
                    <li>Configure your company branding in Settings</li>
                    <li>Invite your team members</li>
                  </ol>
                </div>
              )}

              <Button className="w-full" onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}>
                Go to Login <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-8">
        <div className="border-t border-border pt-6">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Download the Habico app</p>
          <div className="flex justify-center">
            <AppStoreBadges compact />
          </div>
        </div>
      </div>
    </div>
  );
}
