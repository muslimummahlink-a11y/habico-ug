-- Plan Lifecycle: expiry dates and blocking

-- 1. Add plan lifecycle columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 2. Index for expiry queries
CREATE INDEX IF NOT EXISTS idx_companies_plan_expires_at ON public.companies(plan_expires_at);

-- 3. Update company_has_feature to also check plan expiry
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

  -- Check if plan has expired — if so, deny all non-public features
  IF EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = v_company_id
      AND plan_expires_at IS NOT NULL
      AND plan_expires_at < now()
  ) AND p_feature_key NOT IN ('settings') THEN
    has_access := false;
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

-- 4. Function to get company plan status
CREATE OR REPLACE FUNCTION public.get_company_plan_status()
RETURNS TABLE (
  plan_id UUID,
  plan_name TEXT,
  plan_slug TEXT,
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  is_expired BOOLEAN,
  days_remaining INT
)
LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT p.company_id INTO v_company_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_company_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.plan_id,
    sp.name AS plan_name,
    sp.slug AS plan_slug,
    c.plan_started_at,
    c.plan_expires_at,
    CASE WHEN c.plan_expires_at IS NOT NULL AND c.plan_expires_at < now() THEN true ELSE false END AS is_expired,
    CASE WHEN c.plan_expires_at IS NOT NULL
      THEN GREATEST(0, EXTRACT(DAY FROM c.plan_expires_at - now())::INT)
      ELSE NULL::INT
    END AS days_remaining
  FROM public.companies c
  LEFT JOIN public.subscription_plans sp ON sp.id = c.plan_id
  WHERE c.id = v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_plan_status TO authenticated;

-- 5. Auto-set plan_started_at when plan_id is first assigned
CREATE OR REPLACE FUNCTION public.handle_company_plan_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  FOR EACH ROW
  WHEN (NEW.plan_id IS DISTINCT FROM OLD.plan_id)
  EXECUTE FUNCTION public.handle_company_plan_assigned();
