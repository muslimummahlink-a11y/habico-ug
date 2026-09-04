import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import Stripe from "stripe";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var");
  return new Stripe(key);
};

export const recordStripePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    paymentIntentId: string;
    amount: number;
    lease_id: string;
    payment_type: string;
    method: string;
    period_label?: string;
    months_covered?: number;
    period_start?: string;
    period_end?: string;
    recorded_by: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(data.paymentIntentId);
    if (pi.status !== "succeeded") {
      return { success: false as const, error: "Payment not completed" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("payments").insert({
      lease_id: data.lease_id,
      amount: data.amount,
      method: data.method,
      payment_type: data.payment_type,
      period_label: data.period_label || null,
      months_covered: data.months_covered || null,
      period_start: data.period_start || null,
      period_end: data.period_end || null,
      recorded_by: data.recorded_by,
      stripe_payment_intent_id: data.paymentIntentId,
      stripe_payment_status: pi.status,
      payment_date: new Date().toISOString().slice(0, 10),
    });
    if (error) return { success: false as const, error: error.message };
    return { success: true as const };
  });
