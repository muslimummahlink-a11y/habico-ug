-- Allow authenticated users (tenants) to insert their own rental applications
CREATE POLICY "ra_self_insert" ON public.rental_applications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to see their own applications
CREATE POLICY "ra_self_select" ON public.rental_applications
  FOR SELECT TO authenticated
  USING (email = auth.email() OR public.is_staff(auth.uid()));

-- Allow the anon role to view active properties and vacant units for the public rental page
DROP POLICY IF EXISTS "properties_public_select" ON public.properties;
CREATE POLICY "properties_public_select" ON public.properties
  FOR SELECT TO anon, authenticated
  USING (is_active IS NULL OR is_active = true);

DROP POLICY IF EXISTS "units_public_select" ON public.units;
CREATE POLICY "units_public_select" ON public.units
  FOR SELECT TO anon, authenticated
  USING (true);
