CREATE TABLE IF NOT EXISTS public.user_page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, route)
);

GRANT SELECT, INSERT, DELETE ON public.user_page_access TO authenticated;
GRANT ALL ON public.user_page_access TO service_role;
ALTER TABLE public.user_page_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_page_access_staff_manage" ON public.user_page_access;
DROP POLICY IF EXISTS "user_page_access_own_read" ON public.user_page_access;

CREATE POLICY "user_page_access_staff_manage" ON public.user_page_access FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "user_page_access_own_read" ON public.user_page_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());