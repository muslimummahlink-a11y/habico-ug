-- Protect Delete Password + Backup Support

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA "extensions";

-- 2. Add protect_delete_password_hash to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS protect_delete_password_hash TEXT;

-- 3. Function to set/update the protect delete password
CREATE OR REPLACE FUNCTION public.set_protect_delete_password(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT p.company_id INTO v_company_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company associated with user';
  END IF;

  IF p_password IS NULL OR length(p_password) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;

  UPDATE public.companies
  SET protect_delete_password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
  WHERE id = v_company_id;

  RETURN true;
END;
$$;

-- 4. Function to verify the protect delete password
CREATE OR REPLACE FUNCTION public.verify_protect_delete_password(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_hash TEXT;
BEGIN
  SELECT p.company_id INTO v_company_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF v_company_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT protect_delete_password_hash INTO v_hash
  FROM public.companies
  WHERE id = v_company_id;

  IF v_hash IS NULL THEN
    RETURN true; -- No password set, allow all deletes
  END IF;

  RETURN v_hash = extensions.crypt(p_password, v_hash);
END;
$$;

-- 5. Function to check if a protect delete password is configured
CREATE OR REPLACE FUNCTION public.has_protect_delete_password()
RETURNS BOOLEAN
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
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = v_company_id AND protect_delete_password_hash IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_protect_delete_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_protect_delete_password TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_protect_delete_password TO authenticated;
