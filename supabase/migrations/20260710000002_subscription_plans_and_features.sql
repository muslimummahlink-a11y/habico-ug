-- Subscription Plans & Feature Access

-- 1. Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  yearly_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscription_plans_admin_all ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY subscription_plans_select_all ON public.subscription_plans
  FOR SELECT TO authenticated
  USING (true);

-- 2. Plan features (feature flags per plan)
CREATE TABLE IF NOT EXISTS public.plan_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(plan_id, feature_key)
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_features_admin_all ON public.plan_features
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY plan_features_select_all ON public.plan_features
  FOR SELECT TO authenticated
  USING (true);

-- 3. Add plan_id to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

-- 4. Feature access RPC
DROP FUNCTION IF EXISTS public.company_has_feature;
CREATE OR REPLACE FUNCTION public.company_has_feature(p_feature_key TEXT)
RETURNS TABLE (has_access BOOLEAN)
LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_is_staff BOOLEAN;
BEGIN
  SELECT p.company_id, public.is_staff(auth.uid())
  INTO v_company_id, v_is_staff
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- System staff with no company see everything
  IF v_is_staff AND v_company_id IS NULL THEN
    has_access := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Check feature access via company's plan
  SELECT COALESCE(pf.is_enabled, false) INTO has_access
  FROM public.companies c
  JOIN public.subscription_plans sp ON sp.id = c.plan_id
  JOIN public.plan_features pf ON pf.plan_id = sp.id
  WHERE c.id = v_company_id
    AND pf.feature_key = p_feature_key
    AND sp.is_active = true
    AND c.is_active = true;

  RETURN NEXT;
END;
$$;

-- 5. Seed default plans
INSERT INTO public.subscription_plans (name, slug, description, monthly_price, sort_order) VALUES
  ('Rental', 'rental', 'Property management only — properties, leases, tenants, payments, maintenance, and reports', 0, 1),
  ('Construction', 'construction', 'Construction management only — projects, scheduling, RFIs, submittals, budgeting, SOP, and more', 0, 2),
  ('Full Suite', 'full-suite', 'Everything — rental management + construction management + SOP & Quality + all reports', 0, 3)
ON CONFLICT (slug) DO NOTHING;

-- Seed features per plan
-- Rental plan features
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, f.key, f.enabled
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('rental', true),
  ('construction', false),
  ('construction_financial', false),
  ('sop', false),
  ('reports', true),
  ('companies', false),
  ('branding', true)
) AS f(key, enabled)
WHERE p.slug = 'rental'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Construction plan features
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, f.key, f.enabled
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('rental', false),
  ('construction', true),
  ('construction_financial', true),
  ('sop', true),
  ('reports', true),
  ('companies', false),
  ('branding', true)
) AS f(key, enabled)
WHERE p.slug = 'construction'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- Full Suite plan features
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, f.key, f.enabled
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('rental', true),
  ('construction', true),
  ('construction_financial', true),
  ('sop', true),
  ('reports', true),
  ('companies', true),
  ('branding', true)
) AS f(key, enabled)
WHERE p.slug = 'full-suite'
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION public.company_has_feature TO authenticated;

-- 7. Auto-set updated_at
CREATE TRIGGER subscription_plans_touch_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
