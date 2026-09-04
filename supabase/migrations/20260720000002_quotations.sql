-- Quotation module
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  terms_and_conditions TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotations_company_all" ON public.quotations;
CREATE POLICY "quotations_company_all" ON public.quotations
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;

DROP TRIGGER IF EXISTS quotations_touch ON public.quotations;
CREATE TRIGGER quotations_touch BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotation_items_company_all" ON public.quotation_items;
CREATE POLICY "quotation_items_company_all" ON public.quotation_items
  FOR ALL TO authenticated
  USING (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_id
        AND (q.company_id = public.get_user_company_id() OR public.get_user_company_id() IS NULL)
      )
    )
  )
  WITH CHECK (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_id
        AND (q.company_id = public.get_user_company_id() OR public.get_user_company_id() IS NULL)
      )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;
