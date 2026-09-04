-- ============================================================
-- Company-level data isolation
-- Adds company_id to all business tables and scopes RLS policies
-- ============================================================

-- 1. Helper: get the current user's company_id (NULL if system staff)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- 2. Helper: check if user belongs to a specific company
CREATE OR REPLACE FUNCTION public.is_same_company(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.get_user_company_id() = p_company_id
$$;

-- 3. Helper: drop all existing policies on a table (clean slate)
CREATE OR REPLACE FUNCTION public.drop_all_policies(p_table TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = p_table AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, p_table);
  END LOOP;
END;
$$;

-- ============================================================
-- Add company_id columns
-- ============================================================

ALTER TABLE public.properties       ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.tenants           ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.employees         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.projects          ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.leads             ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.estimates         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.proposals         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.bid_packages      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.invoices          ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.subcontracts      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.change_orders     ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.bills             ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.lien_waivers      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.allowances        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.cost_codes        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.suppliers         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_items   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_orders   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.assets            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.equipment_rentals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.documents         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.expenses          ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.daily_logs        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.project_tasks     ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.rfis              ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.submittals        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.project_budgets   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.safety_incidents  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.meeting_minutes   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.punch_list_items  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.project_schedules ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.sop_checklists    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.sop_checklist_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.sop_forms         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.receipts          ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.commitment_log    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.progress_payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.project_photos    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.tax_checklist_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.tax_alerts        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.tax_next_steps    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.employee_attendance ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_order_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.asset_maintenance  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.saved_reports     ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.estimate_items    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.invoice_items     ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Units get company_id through their property
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Leases get company_id through their unit -> property
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Payments get company_id through their lease -> unit -> property
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Rental-management specific tables
ALTER TABLE public.rental_applications ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.rental_application_links ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.payment_reminders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.payment_proofs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.rental_messages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.lease_signatures ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.rental_id_cards ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.rental_listing_banners ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_images ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================================
-- Replace all RLS policies with company-scoped versions
-- Pattern: staff can access only rows where company_id matches
-- their own company. System admin (staff with no company) sees all.
-- ============================================================

-- Helper: Generate company-scoped policy SQL for any table
CREATE OR REPLACE FUNCTION public.create_company_policies(p_table TEXT)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  EXECUTE format('
    DROP POLICY IF EXISTS %I ON public.%I;
    CREATE POLICY %I ON public.%I
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
      )',
    format('company_%I_staff_all', p_table),
    p_table,
    format('company_%I_staff_all', p_table),
    p_table
  );
END;
$$;

-- ============================================================
-- Apply company-scoped policies to ALL business tables
-- ============================================================

-- Helper tables already scoped in previous migrations, add company check
SELECT public.drop_all_policies('properties');
SELECT public.create_company_policies('properties');

SELECT public.drop_all_policies('units');
SELECT public.create_company_policies('units');

SELECT public.drop_all_policies('leases');
SELECT public.create_company_policies('leases');

SELECT public.drop_all_policies('payments');
SELECT public.create_company_policies('payments');

SELECT public.drop_all_policies('tenants');
SELECT public.create_company_policies('tenants');

SELECT public.drop_all_policies('employees');
SELECT public.create_company_policies('employees');

SELECT public.drop_all_policies('projects');
SELECT public.create_company_policies('projects');

SELECT public.drop_all_policies('leads');
SELECT public.create_company_policies('leads');

SELECT public.drop_all_policies('estimates');
SELECT public.create_company_policies('estimates');

SELECT public.drop_all_policies('proposals');
SELECT public.create_company_policies('proposals');

SELECT public.drop_all_policies('bid_packages');
SELECT public.create_company_policies('bid_packages');

SELECT public.drop_all_policies('invoices');
SELECT public.create_company_policies('invoices');

SELECT public.drop_all_policies('subcontracts');
SELECT public.create_company_policies('subcontracts');

SELECT public.drop_all_policies('change_orders');
SELECT public.create_company_policies('change_orders');

SELECT public.drop_all_policies('bills');
SELECT public.create_company_policies('bills');

SELECT public.drop_all_policies('lien_waivers');
SELECT public.create_company_policies('lien_waivers');

SELECT public.drop_all_policies('allowances');
SELECT public.create_company_policies('allowances');

SELECT public.drop_all_policies('cost_codes');
SELECT public.create_company_policies('cost_codes');

SELECT public.drop_all_policies('suppliers');
SELECT public.create_company_policies('suppliers');

SELECT public.drop_all_policies('inventory_items');
SELECT public.create_company_policies('inventory_items');

SELECT public.drop_all_policies('purchase_orders');
SELECT public.create_company_policies('purchase_orders');

SELECT public.drop_all_policies('assets');
SELECT public.create_company_policies('assets');

SELECT public.drop_all_policies('equipment_rentals');
SELECT public.create_company_policies('equipment_rentals');

SELECT public.drop_all_policies('maintenance_requests');
SELECT public.create_company_policies('maintenance_requests');

SELECT public.drop_all_policies('documents');
SELECT public.create_company_policies('documents');

SELECT public.drop_all_policies('expense_categories');
SELECT public.create_company_policies('expense_categories');

SELECT public.drop_all_policies('expenses');
SELECT public.create_company_policies('expenses');

SELECT public.drop_all_policies('daily_logs');
SELECT public.create_company_policies('daily_logs');

SELECT public.drop_all_policies('project_tasks');
SELECT public.create_company_policies('project_tasks');

SELECT public.drop_all_policies('rfis');
SELECT public.create_company_policies('rfis');

SELECT public.drop_all_policies('submittals');
SELECT public.create_company_policies('submittals');

SELECT public.drop_all_policies('project_budgets');
SELECT public.create_company_policies('project_budgets');

SELECT public.drop_all_policies('safety_incidents');
SELECT public.create_company_policies('safety_incidents');

SELECT public.drop_all_policies('meeting_minutes');
SELECT public.create_company_policies('meeting_minutes');

SELECT public.drop_all_policies('punch_list_items');
SELECT public.create_company_policies('punch_list_items');

SELECT public.drop_all_policies('project_schedules');
SELECT public.create_company_policies('project_schedules');

SELECT public.drop_all_policies('sop_checklists');
SELECT public.create_company_policies('sop_checklists');

SELECT public.drop_all_policies('sop_checklist_items');
SELECT public.create_company_policies('sop_checklist_items');

SELECT public.drop_all_policies('sop_forms');
SELECT public.create_company_policies('sop_forms');

SELECT public.drop_all_policies('receipts');
SELECT public.create_company_policies('receipts');

SELECT public.drop_all_policies('commitment_log');
SELECT public.create_company_policies('commitment_log');

SELECT public.drop_all_policies('progress_payments');
SELECT public.create_company_policies('progress_payments');

SELECT public.drop_all_policies('project_documents');
SELECT public.create_company_policies('project_documents');

SELECT public.drop_all_policies('project_photos');
SELECT public.create_company_policies('project_photos');

SELECT public.drop_all_policies('tax_checklist_items');
SELECT public.create_company_policies('tax_checklist_items');

SELECT public.drop_all_policies('tax_alerts');
SELECT public.create_company_policies('tax_alerts');

SELECT public.drop_all_policies('tax_next_steps');
SELECT public.create_company_policies('tax_next_steps');

SELECT public.drop_all_policies('employee_attendance');
SELECT public.create_company_policies('employee_attendance');

SELECT public.drop_all_policies('inventory_transactions');
SELECT public.create_company_policies('inventory_transactions');

SELECT public.drop_all_policies('purchase_order_items');
SELECT public.create_company_policies('purchase_order_items');

SELECT public.drop_all_policies('asset_maintenance');
SELECT public.create_company_policies('asset_maintenance');

SELECT public.drop_all_policies('saved_reports');
SELECT public.create_company_policies('saved_reports');

SELECT public.drop_all_policies('estimate_items');
SELECT public.create_company_policies('estimate_items');

SELECT public.drop_all_policies('invoice_items');
SELECT public.create_company_policies('invoice_items');

-- Companies table: staff see only their own company (or all if no company)
SELECT public.drop_all_policies('companies');
CREATE POLICY company_companies_staff_all ON public.companies
  FOR ALL TO authenticated
  USING (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR id = public.get_user_company_id()
    )
  )
  WITH CHECK (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR id = public.get_user_company_id()
    )
  );

-- user_roles: staff see only roles within their company
DROP POLICY IF EXISTS user_roles_staff_all ON public.user_roles;
CREATE POLICY user_roles_staff_all ON public.user_roles
  FOR ALL TO authenticated
  USING (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR user_id IN (
        SELECT id FROM public.profiles
        WHERE company_id = public.get_user_company_id()
      )
    )
  )
  WITH CHECK (
    public.is_staff(auth.uid()) AND (
      public.get_user_company_id() IS NULL
      OR user_id IN (
        SELECT id FROM public.profiles
        WHERE company_id = public.get_user_company_id()
      )
    )
  );

-- profiles: staff see only profiles within their company
DROP POLICY IF EXISTS profiles_staff_all ON public.profiles;
CREATE POLICY profiles_staff_all ON public.profiles
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

-- company_branding: staff see only their company's branding
DROP POLICY IF EXISTS company_branding_admin_all ON public.company_branding;
CREATE POLICY company_branding_admin_all ON public.company_branding
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

-- rental management specific tables
SELECT public.drop_all_policies('rental_applications');
SELECT public.create_company_policies('rental_applications');

SELECT public.drop_all_policies('rental_application_links');
SELECT public.create_company_policies('rental_application_links');

SELECT public.drop_all_policies('payment_reminders');
SELECT public.create_company_policies('payment_reminders');

SELECT public.drop_all_policies('payment_proofs');
SELECT public.create_company_policies('payment_proofs');

SELECT public.drop_all_policies('rental_messages');
SELECT public.create_company_policies('rental_messages');

SELECT public.drop_all_policies('lease_signatures');
SELECT public.create_company_policies('lease_signatures');

SELECT public.drop_all_policies('rental_id_cards');
SELECT public.create_company_policies('rental_id_cards');

SELECT public.drop_all_policies('rental_listing_banners');
SELECT public.create_company_policies('rental_listing_banners');

SELECT public.drop_all_policies('maintenance_schedules');
SELECT public.create_company_policies('maintenance_schedules');

SELECT public.drop_all_policies('maintenance_images');
SELECT public.create_company_policies('maintenance_images');

SELECT public.drop_all_policies('subscription_plans');
-- subscription_plans are global, keep existing
