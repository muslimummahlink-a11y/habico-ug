-- Phase 1: Rental Management Enhancements
-- Adds missing tables, enhanced columns, and RLS policies for full rental management parity

-- ============ ENHANCE EXISTING TABLES ============

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'residential'
    CHECK (unit_type IN ('residential','commercial','retail','office','warehouse','storage')),
  ADD COLUMN IF NOT EXISTS floor_number INTEGER,
  ADD COLUMN IF NOT EXISTS size_sqm NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.leases
  ADD COLUMN IF NOT EXISTS payment_due_day INTEGER DEFAULT 1
    CHECK (payment_due_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly'
    CHECK (billing_period IN ('monthly','quarterly','bi_annual','annual')),
  ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_grace_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_months INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS special_conditions TEXT,
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'rent'
    CHECK (payment_type IN ('rent','deposit','late_fee','utility','other')),
  ADD COLUMN IF NOT EXISTS months_covered INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS period_end DATE;

ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IN ('plumbing','electrical','hvac','appliance','structural','pest_control','cleaning','landscaping','general','other')),
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS contractor_name TEXT,
  ADD COLUMN IF NOT EXISTS contractor_phone TEXT,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS reported_by TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============ TENANTS TABLE (independent from auth.users) ============
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_type TEXT CHECK (id_type IN ('national_id','passport','drivers_license')),
  id_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  previous_address TEXT,
  occupation TEXT,
  employer TEXT,
  monthly_income NUMERIC(12,2),
  access_pin TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_staff_all" ON public.tenants FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER tenants_touch BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PAYMENT REMINDERS (Recurring Billing) ============
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
  amount NUMERIC(12,2) NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'auto' CHECK (reminder_type IN ('auto','manual')),
  is_active BOOLEAN DEFAULT true,
  last_reminder_sent TIMESTAMPTZ,
  next_reminder_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_reminders TO authenticated;
GRANT ALL ON public.payment_reminders TO service_role;
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pr_staff_all" ON public.payment_reminders FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER pr_touch BEFORE UPDATE ON public.payment_reminders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PAYMENT PROOFS ============
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  payer_name TEXT NOT NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('mtn_momo','airtel_money','bank_transfer','other')),
  transaction_reference TEXT,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_proofs TO authenticated;
GRANT ALL ON public.payment_proofs TO service_role;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pp_staff_all" ON public.payment_proofs FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ RENTAL MESSAGES ============
CREATE TABLE IF NOT EXISTS public.rental_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('manager','tenant')),
  parent_id UUID REFERENCES public.rental_messages(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.rental_messages TO authenticated;
GRANT ALL ON public.rental_messages TO service_role;
ALTER TABLE public.rental_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rm_staff_all" ON public.rental_messages FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ RENTAL APPLICATIONS (E-Leasing) ============
CREATE TABLE IF NOT EXISTS public.rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  id_type TEXT CHECK (id_type IN ('national_id','passport','drivers_license')),
  id_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  occupation TEXT,
  employer TEXT,
  monthly_income NUMERIC(12,2),
  previous_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','screening','approved','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_applications TO authenticated;
GRANT ALL ON public.rental_applications TO service_role;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ra_staff_all" ON public.rental_applications FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ra_touch BEFORE UPDATE ON public.rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ APPLICATION LINKS (shareable e-leasing) ============
CREATE TABLE IF NOT EXISTS public.rental_application_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_application_links TO authenticated;
GRANT ALL ON public.rental_application_links TO service_role;
ALTER TABLE public.rental_application_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ral_staff_all" ON public.rental_application_links FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ LEASE SIGNATURES (Digital Signing) ============
CREATE TABLE IF NOT EXISTS public.lease_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  signed_by TEXT NOT NULL CHECK (signed_by IN ('manager','tenant')),
  signatory_name TEXT NOT NULL,
  signature_data TEXT, -- base64 SVG/PNG or typed signature
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT
);

GRANT SELECT, INSERT, UPDATE ON public.lease_signatures TO authenticated;
GRANT ALL ON public.lease_signatures TO service_role;
ALTER TABLE public.lease_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ls_staff_all" ON public.lease_signatures FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ RENTAL ID CARDS ============
CREATE TABLE IF NOT EXISTS public.rental_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  card_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','lost','returned')),
  lost_reason TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.rental_id_cards TO authenticated;
GRANT ALL ON public.rental_id_cards TO service_role;
ALTER TABLE public.rental_id_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ric_staff_all" ON public.rental_id_cards FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ric_touch BEFORE UPDATE ON public.rental_id_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ LISTING BANNERS ============
CREATE TABLE IF NOT EXISTS public.rental_listing_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  banner_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  qr_scans INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rental_listing_banners TO authenticated;
GRANT ALL ON public.rental_listing_banners TO service_role;
ALTER TABLE public.rental_listing_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rlb_staff_all" ON public.rental_listing_banners FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER rlb_touch BEFORE UPDATE ON public.rental_listing_banners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MAINTENANCE SCHEDULES (Preventative Maintenance) ============
CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('plumbing','electrical','hvac','appliance','structural','pest_control','cleaning','landscaping','general')),
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly','quarterly','bi_annual','annual','one_time')),
  interval_days INTEGER,
  next_due_date DATE,
  last_completed_date DATE,
  assigned_to TEXT,
  estimated_cost NUMERIC(12,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_schedules TO authenticated;
GRANT ALL ON public.maintenance_schedules TO service_role;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ms_staff_all" ON public.maintenance_schedules FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ms_touch BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MAINTENANCE IMAGES ============
CREATE TABLE IF NOT EXISTS public.maintenance_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.maintenance_images TO authenticated;
GRANT ALL ON public.maintenance_images TO service_role;
ALTER TABLE public.maintenance_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mi_staff_all" ON public.maintenance_images FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
