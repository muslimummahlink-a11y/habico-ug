import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { resendLicenseEmail } from "@/lib/resendLicenseEmail.functions";
import { createSampleTenant } from "@/lib/createSampleTenant.functions";
import { sendSampleAll } from "@/lib/sendEmails.functions";

export const Route = createFileRoute("/_authenticated/dev-tools")({
  head: () => ({ meta: [{ title: "Dev Tools — Habico Portal" }] }),
  component: DevToolsPage,
});

function DevToolsPage() {
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [tenantEmail, setTenantEmail] = useState("tenant@example.com");
  const [tenantName, setTenantName] = useState("Sample Tenant");
  const [monthlyRent, setMonthlyRent] = useState("500000");
  const [lastResult, setLastResult] = useState<{ email: string; password: string; name: string } | null>(null);

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (!email.trim()) throw new Error("Enter an email address");
      const result = await resendLicenseEmail({ data: { adminEmail: email.trim() } });
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => { toast.success("License email resent!"); setEmail(""); },
    onError: (err) => toast.error((err as any)?.message || "Failed"),
  });

  const tenantMutation = useMutation({
    mutationFn: async () => {
      if (!companyId.trim()) throw new Error("Enter a company ID");
      const result = await createSampleTenant({
        data: {
          companyId: companyId.trim(),
          tenantEmail: tenantEmail.trim() || undefined,
          tenantName: tenantName.trim() || undefined,
          monthlyRent: Number(monthlyRent) || undefined,
        },
      });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      setLastResult(result.tenant);
      toast.success("Sample tenant created!");
    },
    onError: (err) => toast.error((err as any)?.message || "Failed"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Tools</h1>
        <p className="text-sm text-muted-foreground">Utilities for testing and troubleshooting</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Resend License Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Resend the license key email to a company admin by their email address.</p>
          <div className="flex gap-2">
            <Input
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => resendMutation.mutate()}
              disabled={!email.trim() || resendMutation.isPending}
            >
              {resendMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Mail className="mr-1 h-4 w-4" />}
              Resend
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Send Sample Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Send all sample email types (license, financial report, receipt, reminder) to a test address.</p>
          <div className="flex gap-2">
            <Input
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={async () => {
                if (!email.trim()) { toast.error("Enter an email address"); return; }
                try {
                  const result = await sendSampleAll({ data: { to: email.trim() } });
                  if (result.success) {
                    const details = (result.results ?? []).map((r: any) => `${r.type}: ${r.id ? "sent" : "failed - " + r.error}`).join("\n");
                    toast.success("Sample emails sent!\n" + details);
                  } else {
                    toast.error(result.error ?? "Failed");
                  }
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              <Mail className="mr-1 h-4 w-4" />
              Send All Samples
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            Create Sample Tenant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Create a tenant with a property, unit, and lease for testing the renter portal.</p>

          <div>
            <Label>Company ID *</Label>
            <Input
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="uuid from companies table"
              className="mt-1 font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tenant Email</Label>
              <Input value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Tenant Name</Label>
              <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Monthly Rent (UGX)</Label>
            <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="mt-1" />
          </div>

          <Button
            onClick={() => tenantMutation.mutate()}
            disabled={!companyId.trim() || tenantMutation.isPending}
          >
            {tenantMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
            {tenantMutation.isPending ? "Creating..." : "Create Sample Tenant"}
          </Button>

          {lastResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm space-y-1">
              <p className="font-medium text-green-800">Tenant created! Login with:</p>
              <p><span className="font-medium">Email:</span> {lastResult.email}</p>
              <p><span className="font-medium">Password:</span> {lastResult.password}</p>
              <p><span className="font-medium">Name:</span> {lastResult.name}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
