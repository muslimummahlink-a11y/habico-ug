import { createServerFn } from "@tanstack/react-start";

export const submitRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: {
    planId: string;
    amount: number;
    transactionId: string;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: planRow } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, name, monthly_price")
      .eq("id", data.planId)
      .single();
    const requiresPayment = Number(planRow?.monthly_price ?? 0) > 0;

    if (!requiresPayment) {
      return { success: false as const, error: "Plan is free — use the free registration flow" };
    }

    if (!data.transactionId || data.transactionId.trim().length < 3) {
      return { success: false as const, error: "Please enter a valid transaction ID" };
    }

    const { error } = await (supabaseAdmin as any).from("pending_registrations").insert({
      plan_id: data.planId,
      transaction_id: data.transactionId.trim(),
      amount: data.amount,
      company_name: data.companyName,
      company_email: data.companyEmail || null,
      company_phone: data.companyPhone || null,
      company_address: data.companyAddress || null,
      admin_name: data.adminName,
      admin_email: data.adminEmail,
      admin_password: data.adminPassword,
      admin_phone: data.adminPhone || null,
      status: "pending",
    });

    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  });
