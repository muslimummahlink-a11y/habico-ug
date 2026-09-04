-- Vendor payments: tracks payments Habico makes to vendors, contractors, suppliers
CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  payee_name TEXT NOT NULL,
  payee_phone TEXT,
  payee_email TEXT,
  payee_address TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'contractor' CHECK (category IN ('contractor','supplier','consultant','service','labor','other')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('cash','bank_transfer','mobile_money','cheque','card','other')),
  reference_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  notes TEXT,
  receipt_number TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vp_company_all" ON public.vendor_payments;
CREATE POLICY "vp_company_all" ON public.vendor_payments
  FOR ALL TO authenticated
  USING (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR company_id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR company_id = public.get_user_company_id()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payments TO authenticated;
GRANT ALL ON public.vendor_payments TO service_role;

DROP TRIGGER IF EXISTS vp_touch ON public.vendor_payments;
CREATE TRIGGER vp_touch BEFORE UPDATE ON public.vendor_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
