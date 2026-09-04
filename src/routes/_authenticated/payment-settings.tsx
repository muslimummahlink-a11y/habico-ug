import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payment-settings")({
  head: () => ({ meta: [{ title: "Payment Settings — Habico Portal" }] }),
  component: PaymentSettingsPage,
});

type PaymentSetting = {
  id: string;
  provider: string;
  phone_number: string;
  account_name: string;
  instructions: string | null;
  is_active: boolean;
};

function PaymentSettingsPage() {
  const queryClient = useQueryClient();
  const role = useHighestRole();
  const isAdmin = role === "admin" || role === "manager";

  const { data: settings, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_settings" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as PaymentSetting | null;
    },
    enabled: isAdmin,
  });

  const [form, setForm] = useState({
    provider: "mtn_momo",
    phone_number: "",
    account_name: "",
    instructions: "",
  });

  useState(() => {
    if (settings) {
      setForm({
        provider: settings.provider,
        phone_number: settings.phone_number,
        account_name: settings.account_name,
        instructions: settings.instructions ?? "",
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (settings?.id) {
        const { error } = await supabase.from("payment_settings" as any).update({
          provider: form.provider,
          phone_number: form.phone_number,
          account_name: form.account_name,
          instructions: form.instructions || null,
        }).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_settings" as any).insert({
          provider: form.provider,
          phone_number: form.phone_number,
          account_name: form.account_name,
          instructions: form.instructions || null,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success("Payment settings saved");
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to save"),
  });

  if (!isAdmin) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-sm text-muted-foreground">Configure the mobile money details shown during company registration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            Mobile Money Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">Loading...</div>
          ) : (
            <>
              <div>
                <Label>Payment Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  className="mt-1.5"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="e.g. +256700000000"
                />
                <p className="mt-1 text-xs text-muted-foreground">The number registrants will send payment to</p>
              </div>
              <div>
                <Label>Account Name</Label>
                <Input
                  className="mt-1.5"
                  value={form.account_name}
                  onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                  placeholder="e.g. Habico Property Managers"
                />
              </div>
              <div>
                <Label>Instructions (optional)</Label>
                <textarea
                  className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-sm"
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="e.g. After sending payment, enter the 12-digit TID from your transaction message below."
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={!form.phone_number || !form.account_name || saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Settings
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How this works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>1. The phone number and account name above are shown to users during registration.</p>
          <p>2. Users send the plan amount via mobile money and submit their TID (transaction ID).</p>
          <p>3. Go to <strong>Pending Registrations</strong> to enter the matching TID from your own phone and complete the registration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
