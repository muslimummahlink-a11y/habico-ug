import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import Stripe from "stripe";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var");
  return new Stripe(key);
};

export const createPaymentIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    amount: number;
    lease_id: string;
    payment_type: string;
    period_label?: string;
    months_covered?: number;
    period_start?: string;
    period_end?: string;
  }) => input)
  .handler(async ({ data }) => {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100),
      currency: "ugx",
      metadata: {
        lease_id: data.lease_id,
        payment_type: data.payment_type,
        period_label: data.period_label ?? "",
        months_covered: String(data.months_covered ?? 1),
        period_start: data.period_start ?? "",
        period_end: data.period_end ?? "",
      },
    });
    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  });
