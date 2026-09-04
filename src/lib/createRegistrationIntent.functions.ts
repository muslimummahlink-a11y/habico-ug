import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var");
  return new Stripe(key);
};

export const createRegistrationIntent = createServerFn({ method: "POST" })
  .inputValidator((input: { planId: string; amount: number; companyName: string; adminEmail: string }) => input)
  .handler(async ({ data }) => {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100),
      currency: "ugx",
      metadata: {
        type: "company_registration",
        plan_id: data.planId,
        company_name: data.companyName,
        admin_email: data.adminEmail,
      },
    });
    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  });
