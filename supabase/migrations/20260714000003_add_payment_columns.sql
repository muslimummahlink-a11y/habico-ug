-- Add missing columns to payments table used by the UI

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'rent';
-- Drop existing check and re-add with correct values
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_type_check CHECK (payment_type IN ('rent','deposit','late_fee','utility','other'));

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS months_covered INTEGER;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_client_secret TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add updated_at trigger
DROP TRIGGER IF EXISTS payments_touch_updated_at ON public.payments;
CREATE TRIGGER payments_touch_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Update RLS to also allow tenants to insert own payments (stripe flow)
DROP POLICY IF EXISTS "payments_staff_all" ON public.payments;
CREATE POLICY "payments_staff_all" ON public.payments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) OR auth.uid() = recorded_by)
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() = recorded_by);
