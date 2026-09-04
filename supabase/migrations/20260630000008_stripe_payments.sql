-- Add Stripe payment tracking columns to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_payment_status text;
