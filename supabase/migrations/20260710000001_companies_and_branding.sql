-- Companies & Branding
-- Tracks licensed property management companies and their document branding

-- 1. Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  license_key   TEXT UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to profiles (must be before policies that reference it)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE POLICY companies_admin_all ON public.companies
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY companies_select_own ON public.companies
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 2. Company branding table
CREATE TABLE IF NOT EXISTS public.company_branding (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  logo_url          TEXT,
  primary_color     TEXT NOT NULL DEFAULT '#1a365d',
  secondary_color   TEXT NOT NULL DEFAULT '#e2e8f0',
  accent_color      TEXT NOT NULL DEFAULT '#3182ce',
  document_footer   TEXT,
  receipt_footer    TEXT,
  company_name_override TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_branding_admin_all ON public.company_branding
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY company_branding_select_own ON public.company_branding
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY company_branding_update_own ON public.company_branding
  FOR UPDATE TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

-- 3. Helper: get user's company branding
CREATE OR REPLACE FUNCTION public.get_company_branding()
RETURNS SETOF public.company_branding
LANGUAGE sql STABLE
AS $$
  SELECT cb.*
  FROM public.company_branding cb
  JOIN public.profiles p ON p.company_id = cb.company_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

-- 5. Trigger to auto-create branding when a company is created
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.company_branding (company_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();

-- 6. Auto-set updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER companies_touch_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER company_branding_touch_updated_at
  BEFORE UPDATE ON public.company_branding
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
