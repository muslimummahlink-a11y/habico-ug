-- ============================================================
-- FIX ALL RLS & MISSING MIGRATIONS
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 0. Add tenancy_agreement_template to company_branding (if not done)
ALTER TABLE public.company_branding ADD COLUMN IF NOT EXISTS tenancy_agreement_template TEXT;

-- 0a. Create move_service_configs table (if not done)
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
DROP POLICY IF EXISTS move_service_configs_staff_all ON public.move_service_configs;
CREATE POLICY move_service_configs_staff_all ON public.move_service_configs
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) AND (public.get_user_company_id() IS NULL OR company_id = public.get_user_company_id()))
  WITH CHECK (public.is_staff(auth.uid()) AND (public.get_user_company_id() IS NULL OR company_id = public.get_user_company_id()));

-- 0b. Create move_bookings table (if not done)
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
  base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  distance_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  floor_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  load_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  packing_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  assigned_team TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.move_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS move_bookings_staff_all ON public.move_bookings;
DROP POLICY IF EXISTS move_bookings_public_insert ON public.move_bookings;
DROP POLICY IF EXISTS move_bookings_public_select ON public.move_bookings;
CREATE POLICY move_bookings_staff_all ON public.move_bookings
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) AND (public.get_user_company_id() IS NULL OR company_id = public.get_user_company_id()))
  WITH CHECK (public.is_staff(auth.uid()) AND (public.get_user_company_id() IS NULL OR company_id = public.get_user_company_id()));
CREATE POLICY move_bookings_public_insert ON public.move_bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY move_bookings_public_select ON public.move_bookings
  FOR SELECT TO anon, authenticated USING (true);

-- 0c. Updated_at triggers for move tables
DROP TRIGGER IF EXISTS move_service_configs_touch_updated_at ON public.move_service_configs;
CREATE TRIGGER move_service_configs_touch_updated_at
  BEFORE UPDATE ON public.move_service_configs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS move_bookings_touch_updated_at ON public.move_bookings;
CREATE TRIGGER move_bookings_touch_updated_at
  BEFORE UPDATE ON public.move_bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 1. FIX: subscription_plans RLS (policies were dropped by company_isolation_rls)
DROP POLICY IF EXISTS subscription_plans_admin_all ON public.subscription_plans;
DROP POLICY IF EXISTS subscription_plans_select_all ON public.subscription_plans;
CREATE POLICY subscription_plans_admin_all ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY subscription_plans_select_all ON public.subscription_plans
  FOR SELECT TO authenticated
  USING (true);

-- 2. FIX: plan_features RLS (also may have been dropped)
DROP POLICY IF EXISTS plan_features_admin_all ON public.plan_features;
DROP POLICY IF EXISTS plan_features_select_all ON public.plan_features;
CREATE POLICY plan_features_admin_all ON public.plan_features
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY plan_features_select_all ON public.plan_features
  FOR SELECT TO authenticated
  USING (true);

-- 3. Add plan lifecycle columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_companies_plan_expires_at ON public.companies(plan_expires_at);

-- 4. Update company_has_feature to check plan expiry
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
  IF v_is_staff AND v_company_id IS NULL THEN
    has_access := true; RETURN NEXT; RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.companies WHERE id = v_company_id AND plan_id IS NOT NULL
  ) THEN
    has_access := true; RETURN NEXT; RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = v_company_id AND plan_expires_at IS NOT NULL AND plan_expires_at < now()
  ) AND p_feature_key NOT IN ('settings') THEN
    has_access := false; RETURN NEXT; RETURN;
  END IF;
  SELECT COALESCE(pf.is_enabled, false) INTO has_access
  FROM public.companies c
  JOIN public.subscription_plans sp ON sp.id = c.plan_id
  JOIN public.plan_features pf ON pf.plan_id = sp.id
  WHERE c.id = v_company_id AND pf.feature_key = p_feature_key AND sp.is_active = true AND c.is_active = true;
  RETURN NEXT;
END;
$$;

-- 5. get_company_plan_status helper
CREATE OR REPLACE FUNCTION public.get_company_plan_status()
RETURNS TABLE (plan_id UUID, plan_name TEXT, plan_slug TEXT, plan_started_at TIMESTAMPTZ, plan_expires_at TIMESTAMPTZ, is_expired BOOLEAN, days_remaining INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_company_id UUID;
BEGIN
  SELECT p.company_id INTO v_company_id FROM public.profiles p WHERE p.id = auth.uid();
  IF v_company_id IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT c.plan_id, sp.name, sp.slug, c.plan_started_at, c.plan_expires_at,
    CASE WHEN c.plan_expires_at IS NOT NULL AND c.plan_expires_at < now() THEN true ELSE false END,
    CASE WHEN c.plan_expires_at IS NOT NULL THEN GREATEST(0, EXTRACT(DAY FROM c.plan_expires_at - now())::INT) ELSE NULL END
  FROM public.companies c LEFT JOIN public.subscription_plans sp ON sp.id = c.plan_id WHERE c.id = v_company_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_company_plan_status TO authenticated;

-- 6. Auto-set plan_started_at on plan assignment
CREATE OR REPLACE FUNCTION public.handle_company_plan_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL AND OLD.plan_id IS NULL THEN
    NEW.plan_started_at = COALESCE(NEW.plan_started_at, now());
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_company_plan_assigned ON public.companies;
CREATE TRIGGER on_company_plan_assigned
  BEFORE UPDATE ON public.companies
  FOR EACH ROW WHEN (NEW.plan_id IS DISTINCT FROM OLD.plan_id)
  EXECUTE FUNCTION public.handle_company_plan_assigned();

-- 7. Add payment columns (if not done)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_type TEXT,
  ADD COLUMN IF NOT EXISTS months_covered INTEGER,
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_client_secret TEXT;

-- 8. Add "system" and "settings" feature keys to existing plans if missing
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, f.key, f.enabled
FROM public.subscription_plans p
CROSS JOIN (VALUES ('system', false), ('settings', true)) AS f(key, enabled)
WHERE p.slug IN ('rental', 'construction', 'full-suite')
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- 9. Add move_service feature key to existing plans if missing
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled)
SELECT p.id, 'move_service', true
FROM public.subscription_plans p
WHERE p.slug IN ('rental', 'construction', 'full-suite')
ON CONFLICT (plan_id, feature_key) DO NOTHING;
