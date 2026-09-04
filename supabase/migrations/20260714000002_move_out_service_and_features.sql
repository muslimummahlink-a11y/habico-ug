-- ============================================================
-- System feature gating + Move-in/Move-out service
-- ============================================================

-- 0. Add tenancy_agreement_template to company_branding
ALTER TABLE public.company_branding ADD COLUMN IF NOT EXISTS tenancy_agreement_template TEXT;

-- 1. Add "system" and "settings" feature keys to existing plans
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, f.key, f.enabled
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('system', false),
  ('settings', true)
) AS f(key, enabled)
WHERE p.slug IN ('rental', 'construction', 'full-suite')
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ============================================================
-- Move-in/out service schema
-- ============================================================

-- 2. Service pricing config table (per company)
CREATE TABLE IF NOT EXISTS public.move_service_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price_per_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_per_floor NUMERIC(10, 2) NOT NULL DEFAULT 0,
  small_load_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  medium_load_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  large_load_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  packing_material_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);

ALTER TABLE public.move_service_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY move_service_configs_staff_all ON public.move_service_configs
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

-- 3. Move-in/out bookings (customer self-service)
CREATE TABLE IF NOT EXISTS public.move_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('move_in', 'move_out', 'both')),
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  distance_km NUMERIC(10, 2),
  floors_from INTEGER DEFAULT 1,
  floors_to INTEGER DEFAULT 1,
  has_elevator_from BOOLEAN DEFAULT false,
  has_elevator_to BOOLEAN DEFAULT false,
  load_size TEXT NOT NULL CHECK (load_size IN ('small', 'medium', 'large')),
  needs_packing_materials BOOLEAN DEFAULT false,
  preferred_date DATE NOT NULL,
  preferred_time_slot TEXT,
  notes TEXT,
  -- Pricing
  base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  distance_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  floor_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  load_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  packing_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  assigned_team TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.move_bookings ENABLE ROW LEVEL SECURITY;

-- Company staff can see their own company's bookings
CREATE POLICY move_bookings_staff_all ON public.move_bookings
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

-- Anyone (including unauthenticated) can insert bookings
CREATE POLICY move_bookings_public_insert ON public.move_bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Customers can view their own booking by id
CREATE POLICY move_bookings_public_select ON public.move_bookings
  FOR SELECT TO anon, authenticated
  USING (true);

-- 4. Add feature key for move_service
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, 'move_service', true
FROM public.subscription_plans p
WHERE p.slug IN ('rental', 'construction', 'full-suite')
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 5. Updated_at triggers
CREATE TRIGGER move_service_configs_touch_updated_at
  BEFORE UPDATE ON public.move_service_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER move_bookings_touch_updated_at
  BEFORE UPDATE ON public.move_bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Fix company_has_feature to fall back to true when company has no plan
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

  -- If company has no plan, allow everything (graceful fallback)
  IF NOT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = v_company_id AND plan_id IS NOT NULL
  ) THEN
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

-- 7. Public RPC to get the first active move service config for display
CREATE OR REPLACE FUNCTION public.get_active_move_service_config()
RETURNS SETOF public.move_service_configs
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM public.move_service_configs WHERE is_active = true LIMIT 1;
$$;

-- Allow public to call the function
GRANT EXECUTE ON FUNCTION public.get_active_move_service_config() TO anon, authenticated;
