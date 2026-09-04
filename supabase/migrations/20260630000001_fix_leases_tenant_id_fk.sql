-- Fix leases.tenant_id FK to reference public.tenants(id) instead of auth.users(id)
-- This aligns the schema with the code, which consistently treats leases.tenant_id as a public.tenants reference
-- Also adds missing columns used by the application

-- Drop existing FK referencing auth.users
ALTER TABLE public.leases DROP CONSTRAINT IF EXISTS leases_tenant_id_fkey;

-- Re-add FK referencing public.tenants
ALTER TABLE public.leases ADD CONSTRAINT leases_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add missing columns used by the app
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 30;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS termination_date DATE;

-- Update RLS: tenant read policy must now go through tenants→auth_user_id
DROP POLICY IF EXISTS "leases_tenant_read" ON public.leases;
CREATE POLICY "leases_tenant_read" ON public.leases FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()));

-- Update maintenance_requests RLS policies for tenant access (same FK pattern)
DROP POLICY IF EXISTS "mr_tenant_read" ON public.maintenance_requests;
DROP POLICY IF EXISTS "mr_tenant_insert" ON public.maintenance_requests;
DROP POLICY IF EXISTS "mr_tenant_update_own" ON public.maintenance_requests;

CREATE POLICY "mr_tenant_read" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "mr_tenant_insert" ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()));

CREATE POLICY "mr_tenant_update_own" ON public.maintenance_requests FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()) AND status = 'open');
