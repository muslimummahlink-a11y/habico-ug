import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var");
  return new Stripe(key);
};

export const completeRegistration = createServerFn({ method: "POST" })
  .inputValidator((input: {
    paymentIntentId: string;
    planId: string;
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

    // Verify the plan and decide whether payment is required
    const { data: planRow } = await supabaseAdmin
      .from("subscription_plans")
      .select("id, name, monthly_price")
      .eq("id", data.planId)
      .single();
    const requiresPayment = Number(planRow?.monthly_price ?? 0) > 0;

    let paidAmount = 0;
    let stripeStatus: string | null = null;
    if (requiresPayment) {
      if (!data.paymentIntentId) {
        return { success: false as const, error: "Payment required for this plan" };
      }
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(data.paymentIntentId);
      if (pi.status !== "succeeded") {
        return { success: false as const, error: "Payment not completed" };
      }
      paidAmount = pi.amount_received ? pi.amount_received / 100 : 0;
      stripeStatus = pi.status;
    }

    // 1. Create the company
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const licenseKey = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: data.companyName,
        email: data.companyEmail || null,
        phone: data.companyPhone || null,
        address: data.companyAddress || null,
        license_key: licenseKey,
        plan_id: data.planId || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (companyError) return { success: false as const, error: companyError.message };
    if (!company) return { success: false as const, error: "Failed to create company" };

    // 2. Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: data.adminName },
    });

    if (authError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return { success: false as const, error: authError.message };
    }

    const userId = authUser.user.id;

    // 3. Update profile with company_id and full_name
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ company_id: company.id, full_name: data.adminName })
      .eq("id", userId);

    if (profileError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return { success: false as const, error: profileError.message };
    }

    // 4. Assign admin + manager roles
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert([
        { user_id: userId, role: "admin" },
        { user_id: userId, role: "manager" },
      ]);

    if (roleError) {
      return { success: false as const, error: roleError.message };
    }

    // 5. Record the payment (only if a payment was taken)
    if (requiresPayment) {
      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          amount: paidAmount,
          method: "stripe",
          payment_type: "registration",
          stripe_payment_intent_id: data.paymentIntentId,
          stripe_payment_status: stripeStatus,
          payment_date: new Date().toISOString().slice(0, 10),
        });
      if (paymentError) console.error("Failed to record registration payment", paymentError);
    }

    // 6. Send license key email (must await — Vercel kills dangling promises after response)
    const { sendLicenseKeyEmail } = await import("@/lib/email.server");
    try {
      await sendLicenseKeyEmail({
        to: data.adminEmail,
        companyName: data.companyName,
        licenseKey,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        planName: planRow?.name ?? "Unknown",
      });
    } catch (e) {
      console.error("Failed to send license email", e);
    }

    return {
      success: true,
      licenseKey,
      companyId: company.id,
      userId,
    };
  });
