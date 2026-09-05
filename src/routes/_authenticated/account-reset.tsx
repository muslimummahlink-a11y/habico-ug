import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { resetUserPassword } from "@/lib/resetUserPassword.functions";

export const Route = createFileRoute("/_authenticated/account-reset")({
  head: () => ({ meta: [{ title: "Account Reset — Habico Portal" }] }),
  component: AccountResetPage,
});

function AccountResetPage() {
  const role = useHighestRole();
  const isAdmin = role === "admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lastResult, setLastResult] = useState<{ email: string; password: string; generated: boolean } | null>(null);

  const resetMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await resetUserPassword({ data: { email, password } });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.generated ? "Password reset with a generated password" : "Password updated successfully");
      setLastResult({ email: result.email, password: result.password, generated: result.generated });
      setPassword("");
    },
    onError: (err) => toast.error((err as Error).message || "Reset failed"),
  });

  if (!isAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    resetMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Reset</h1>
        <p className="text-sm text-muted-foreground">
          Reset any account&apos;s password using its registered email address
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" /> Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Account Email *</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password">New Password</Label>
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank and a secure temporary password will be generated.
              </p>
            </div>
            <Button type="submit" disabled={resetMutation.isPending} className="w-full">
              {resetMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Reset Account
            </Button>
          </form>

          {lastResult && (
            <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Account reset
              </div>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <div>Email: <span className="font-mono text-foreground">{lastResult.email}</span></div>
                <div>New password: <span className="font-mono font-semibold text-foreground">{lastResult.password}</span></div>
                {lastResult.generated && (
                  <p className="text-xs">
                    Share these credentials with the account owner. Ask them to sign in and change the password afterwards.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-muted-foreground">
            Resetting a password immediately invalidates the old one. Only reset accounts you are authorized to manage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}