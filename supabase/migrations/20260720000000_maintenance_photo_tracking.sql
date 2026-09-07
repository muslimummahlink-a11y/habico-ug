ALTER TABLE public.maintenance_images
  ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT 'general'
    CHECK (image_type IN ('before','after','general'));

DROP POLICY IF EXISTS "mi_staff_all" ON public.maintenance_images;

CREATE POLICY "mi_staff_all" ON public.maintenance_images FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.maintenance_images TO authenticated;
GRANT ALL ON public.maintenance_images TO service_role;