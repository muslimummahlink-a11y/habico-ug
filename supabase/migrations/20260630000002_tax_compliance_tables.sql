-- Tax Compliance: persist checklist, alerts, next steps, and property valuations
-- so the dashboard reads everything from the database

-- ============ PROPERTY VALUATIONS ============
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS valuation_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS last_valuation_date DATE,
  ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(5,2) DEFAULT 5.00;

-- ============ TAX CHECKLIST ITEMS ============
CREATE TABLE IF NOT EXISTS public.tax_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ TAX ALERTS ============
CREATE TABLE IF NOT EXISTS public.tax_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  alert_type TEXT NOT NULL DEFAULT 'info' CHECK (alert_type IN ('warning','info','critical')),
  is_active BOOLEAN DEFAULT true,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ TAX NEXT STEPS ============
CREATE TABLE IF NOT EXISTS public.tax_next_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ RLS ============
ALTER TABLE public.tax_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_next_steps ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_checklist_items TO authenticated;
GRANT ALL ON public.tax_checklist_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_alerts TO authenticated;
GRANT ALL ON public.tax_alerts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_next_steps TO authenticated;
GRANT ALL ON public.tax_next_steps TO service_role;

CREATE POLICY "tci_staff_all" ON public.tax_checklist_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "ta_staff_all" ON public.tax_alerts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "tns_staff_all" ON public.tax_next_steps FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER tci_touch BEFORE UPDATE ON public.tax_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED DEFAULT DATA ============
-- Unique constraints for idempotent seeding
ALTER TABLE public.tax_checklist_items ADD CONSTRAINT tax_checklist_items_label_key UNIQUE (label);
ALTER TABLE public.tax_alerts ADD CONSTRAINT tax_alerts_title_key UNIQUE (title);
ALTER TABLE public.tax_next_steps ADD CONSTRAINT tax_next_steps_label_key UNIQUE (label);

INSERT INTO public.tax_checklist_items (label, sort_order) VALUES
  ('Property Deeds / Titles', 1),
  ('Rental Receipts / Income Statements', 2),
  ('Expense Receipts', 3),
  ('Bank Statements', 4),
  ('Insurance Certificates', 5),
  ('Tenancy Agreements', 6),
  ('Property Valuation Report', 7),
  ('Depreciation Schedule', 8),
  ('Tax Clearance Certificate', 9),
  ('Previous Year Returns', 10)
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.tax_alerts (title, description, alert_type) VALUES
  ('Q4 Provisional Tax Deadline', 'Final quarter provisional tax payment due by January 31. Avoid penalties by filing on time.', 'warning'),
  ('Property Valuation Requirement', 'Properties must be revalued every 5 years for accurate depreciation calculations under URA guidelines.', 'info'),
  ('Annual Filing Deadline Approaching', 'Annual rental income tax return must be filed by June 30. Prepare your documents now.', 'warning')
ON CONFLICT (title) DO NOTHING;

INSERT INTO public.tax_next_steps (label, description, sort_order) VALUES
  ('Register for URA TIN', 'Obtain or verify your Tax Identification Number with URA', 1),
  ('File Provisional Tax Return', 'Submit estimated tax for the current income year', 2),
  ('Prepare Financial Statements', 'Compile income statements and balance sheet for the year', 3),
  ('Calculate Taxable Income', 'Apply allowable deductions to gross rental income', 4),
  ('File Annual Return', 'Submit final tax return before June 30 deadline', 5),
  ('Pay Balance Due', 'Settle any outstanding tax liability to avoid interest', 6)
ON CONFLICT (label) DO NOTHING;
