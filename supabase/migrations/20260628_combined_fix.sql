-- ============================================================
-- Combined Migration: Phase 5 + Phase 6 (idempotent)
-- Drops existing policies/triggers first, then creates fresh
-- ============================================================

-- ===== DROP EXISTING POLICIES (Phase 5) =====
DROP POLICY IF EXISTS "leads_staff_all" ON public.leads;
DROP POLICY IF EXISTS "estimates_staff_all" ON public.estimates;
DROP POLICY IF EXISTS "ei_staff_all" ON public.estimate_items;
DROP POLICY IF EXISTS "proposals_staff_all" ON public.proposals;
DROP POLICY IF EXISTS "bp_staff_all" ON public.bid_packages;
DROP POLICY IF EXISTS "pt_staff_all" ON public.project_tasks;
DROP POLICY IF EXISTS "dl_staff_all" ON public.daily_logs;
DROP POLICY IF EXISTS "rfis_staff_all" ON public.rfis;
DROP POLICY IF EXISTS "submittals_staff_all" ON public.submittals;
DROP POLICY IF EXISTS "invoices_staff_all" ON public.invoices;
DROP POLICY IF EXISTS "ii_staff_all" ON public.invoice_items;
DROP POLICY IF EXISTS "subs_staff_all" ON public.subcontracts;
DROP POLICY IF EXISTS "co_staff_all" ON public.change_orders;
DROP POLICY IF EXISTS "ts_staff_all" ON public.timesheets;
DROP POLICY IF EXISTS "allow_staff_all" ON public.allowances;
DROP POLICY IF EXISTS "pb_staff_all" ON public.project_budgets;
DROP POLICY IF EXISTS "bills_staff_all" ON public.bills;
DROP POLICY IF EXISTS "lw_staff_all" ON public.lien_waivers;
DROP POLICY IF EXISTS "sopc_staff_all" ON public.sop_checklists;
DROP POLICY IF EXISTS "sopci_staff_all" ON public.sop_checklist_items;
DROP POLICY IF EXISTS "sopf_staff_all" ON public.sop_forms;
DROP POLICY IF EXISTS "cc_staff_all" ON public.cost_codes;
DROP POLICY IF EXISTS "receipts_staff_all" ON public.receipts;

-- ===== DROP EXISTING POLICIES (Phase 6) =====
DROP POLICY IF EXISTS "psched_staff_all" ON public.project_schedules;
DROP POLICY IF EXISTS "mm_staff_all" ON public.meeting_minutes;
DROP POLICY IF EXISTS "pli_staff_all" ON public.punch_list_items;
DROP POLICY IF EXISTS "si_staff_all" ON public.safety_incidents;
DROP POLICY IF EXISTS "pd_staff_all" ON public.project_documents;
DROP POLICY IF EXISTS "pp_staff_all" ON public.project_photos;
DROP POLICY IF EXISTS "cl_staff_all" ON public.commitment_log;
DROP POLICY IF EXISTS "ppay_staff_all" ON public.progress_payments;
DROP POLICY IF EXISTS "ric_tenant_read" ON public.rental_id_cards;

-- ===== DROP EXISTING TRIGGERS =====
DROP TRIGGER IF EXISTS leads_touch ON public.leads;
DROP TRIGGER IF EXISTS estimates_touch ON public.estimates;
DROP TRIGGER IF EXISTS proposals_touch ON public.proposals;
DROP TRIGGER IF EXISTS bp_touch ON public.bid_packages;
DROP TRIGGER IF EXISTS pt_touch ON public.project_tasks;
DROP TRIGGER IF EXISTS dl_touch ON public.daily_logs;
DROP TRIGGER IF EXISTS rfis_touch ON public.rfis;
DROP TRIGGER IF EXISTS submittals_touch ON public.submittals;
DROP TRIGGER IF EXISTS invoices_touch ON public.invoices;
DROP TRIGGER IF EXISTS subs_touch ON public.subcontracts;
DROP TRIGGER IF EXISTS co_touch ON public.change_orders;
DROP TRIGGER IF EXISTS ts_touch ON public.timesheets;
DROP TRIGGER IF EXISTS allow_touch ON public.allowances;
DROP TRIGGER IF EXISTS pb_touch ON public.project_budgets;
DROP TRIGGER IF EXISTS bills_touch ON public.bills;
DROP TRIGGER IF EXISTS lw_touch ON public.lien_waivers;
DROP TRIGGER IF EXISTS sopc_touch ON public.sop_checklists;
DROP TRIGGER IF EXISTS sopf_touch ON public.sop_forms;
DROP TRIGGER IF EXISTS cc_touch ON public.cost_codes;
DROP TRIGGER IF EXISTS psched_touch ON public.project_schedules;
DROP TRIGGER IF EXISTS mm_touch ON public.meeting_minutes;
DROP TRIGGER IF EXISTS pli_touch ON public.punch_list_items;
DROP TRIGGER IF EXISTS si_touch ON public.safety_incidents;
DROP TRIGGER IF EXISTS pd_touch ON public.project_documents;
DROP TRIGGER IF EXISTS cl_touch ON public.commitment_log;
DROP TRIGGER IF EXISTS ppay_touch ON public.progress_payments;

-- ============================================================
-- PHASE 5: Construction Management Expansion
-- ============================================================

-- ============ PRECONSTRUCTION ============

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'direct' CHECK (source IN ('direct','website','referral','phone','email','social_media','other')),
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  company TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','won','lost')),
  budget_range_min NUMERIC(12,2),
  budget_range_max NUMERIC(12,2),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_staff_all" ON public.leads FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  estimate_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimates TO authenticated;
GRANT ALL ON public.estimates TO service_role;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estimates_staff_all" ON public.estimates FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER estimates_touch BEFORE UPDATE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estimate_items TO authenticated;
GRANT ALL ON public.estimate_items TO service_role;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ei_staff_all" ON public.estimate_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,
  proposal_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','reviewing','accepted','rejected')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  valid_until DATE,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_staff_all" ON public.proposals FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER proposals_touch BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','under_review','awarded','closed')),
  due_date DATE,
  estimated_budget NUMERIC(12,2),
  actual_award NUMERIC(12,2),
  awarded_to TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bid_packages TO authenticated;
GRANT ALL ON public.bid_packages TO service_role;
ALTER TABLE public.bid_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_staff_all" ON public.bid_packages FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER bp_touch BEFORE UPDATE ON public.bid_packages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PROJECT MANAGEMENT ENHANCEMENTS ============

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tasks TO authenticated;
GRANT ALL ON public.project_tasks TO service_role;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_staff_all" ON public.project_tasks FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER pt_touch BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT,
  temperature TEXT,
  workers_on_site INTEGER DEFAULT 0,
  hours_worked NUMERIC(6,2) DEFAULT 0,
  notes TEXT,
  delays TEXT,
  safety_incidents TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, log_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dl_staff_all" ON public.daily_logs FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER dl_touch BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rfi_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  response TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  asked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfis TO authenticated;
GRANT ALL ON public.rfis TO service_role;
ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rfis_staff_all" ON public.rfis FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER rfis_touch BEFORE UPDATE ON public.rfis
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','revised')),
  due_date DATE,
  submitted_date DATE,
  reviewed_by TEXT,
  review_notes TEXT,
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submittals TO authenticated;
GRANT ALL ON public.submittals TO service_role;
ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submittals_staff_all" ON public.submittals FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER submittals_touch BEFORE UPDATE ON public.submittals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ FINANCIAL MANAGEMENT ============

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_staff_all" ON public.invoices FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER invoices_touch BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ii_staff_all" ON public.invoice_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.subcontracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  contract_number TEXT UNIQUE NOT NULL,
  scope_of_work TEXT NOT NULL,
  contract_amount NUMERIC(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','terminated')),
  retention_percent NUMERIC(5,2) DEFAULT 5,
  paid_to_date NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontracts TO authenticated;
GRANT ALL ON public.subcontracts TO service_role;
ALTER TABLE public.subcontracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_staff_all" ON public.subcontracts FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER subs_touch BEFORE UPDATE ON public.subcontracts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  change_order_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  amount NUMERIC(12,2) DEFAULT 0,
  reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_orders TO authenticated;
GRANT ALL ON public.change_orders TO service_role;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "co_staff_all" ON public.change_orders FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER co_touch BEFORE UPDATE ON public.change_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timesheets TO authenticated;
GRANT ALL ON public.timesheets TO service_role;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ts_staff_all" ON public.timesheets FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER ts_touch BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  budgeted_amount NUMERIC(12,2) DEFAULT 0,
  spent_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','exhausted','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.allowances TO authenticated;
GRANT ALL ON public.allowances TO service_role;
ALTER TABLE public.allowances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_staff_all" ON public.allowances FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER allow_touch BEFORE UPDATE ON public.allowances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  budgeted NUMERIC(12,2) DEFAULT 0,
  committed NUMERIC(12,2) DEFAULT 0,
  spent NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_budgets TO authenticated;
GRANT ALL ON public.project_budgets TO service_role;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pb_staff_all" ON public.project_budgets FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER pb_touch BEFORE UPDATE ON public.project_budgets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  bill_number TEXT UNIQUE NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','cancelled')),
  paid_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bills_staff_all" ON public.bills FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER bills_touch BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.lien_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  waiver_type TEXT NOT NULL CHECK (waiver_type IN ('partial','final')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','received')),
  signed_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lien_waivers TO authenticated;
GRANT ALL ON public.lien_waivers TO service_role;
ALTER TABLE public.lien_waivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lw_staff_all" ON public.lien_waivers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER lw_touch BEFORE UPDATE ON public.lien_waivers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ STANDARD OPERATING PROCEDURES ============

CREATE TABLE IF NOT EXISTS public.sop_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_checklists TO authenticated;
GRANT ALL ON public.sop_checklists TO service_role;
ALTER TABLE public.sop_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sopc_staff_all" ON public.sop_checklists FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER sopc_touch BEFORE UPDATE ON public.sop_checklists
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.sop_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.sop_checklists(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_checklist_items TO authenticated;
GRANT ALL ON public.sop_checklist_items TO service_role;
ALTER TABLE public.sop_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sopci_staff_all" ON public.sop_checklist_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.sop_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  form_config JSONB DEFAULT '{}',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_forms TO authenticated;
GRANT ALL ON public.sop_forms TO service_role;
ALTER TABLE public.sop_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sopf_staff_all" ON public.sop_forms FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER sopf_touch BEFORE UPDATE ON public.sop_forms
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ COST CODES ============

CREATE TABLE IF NOT EXISTS public.cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_codes TO authenticated;
GRANT ALL ON public.cost_codes TO service_role;
ALTER TABLE public.cost_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_staff_all" ON public.cost_codes FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER cc_touch BEFORE UPDATE ON public.cost_codes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ RECEIPTS (Construction) ============

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  vendor TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts_staff_all" ON public.receipts FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================================
-- PHASE 6: Construction Standard Features
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_schedules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  milestone BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','delayed')),
  progress NUMERIC(5,2) DEFAULT 0,
  assignee TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_schedules TO authenticated;
GRANT ALL ON public.project_schedules TO service_role;
ALTER TABLE public.project_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psched_staff_all" ON public.project_schedules FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER psched_touch BEFORE UPDATE ON public.project_schedules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  attendees TEXT,
  agenda TEXT,
  notes TEXT,
  action_items JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_minutes TO authenticated;
GRANT ALL ON public.meeting_minutes TO service_role;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mm_staff_all" ON public.meeting_minutes FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER mm_touch BEFORE UPDATE ON public.meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.punch_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','verified')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assignee TEXT,
  due_date DATE,
  completed_date DATE,
  verified_by TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.punch_list_items TO authenticated;
GRANT ALL ON public.punch_list_items TO service_role;
ALTER TABLE public.punch_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pli_staff_all" ON public.punch_list_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER pli_touch BEFORE UPDATE ON public.punch_list_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('near_miss','first_aid','medical_treatment','lost_time','property_damage','fatality')),
  description TEXT NOT NULL,
  root_cause TEXT,
  corrective_action TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported','investigating','resolved','closed')),
  reported_by TEXT,
  location TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_incidents TO authenticated;
GRANT ALL ON public.safety_incidents TO service_role;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "si_staff_all" ON public.safety_incidents FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER si_touch BEFORE UPDATE ON public.safety_incidents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  file_size NUMERIC,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  version TEXT DEFAULT '1.0',
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pd_staff_all" ON public.project_documents FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER pd_touch BEFORE UPDATE ON public.project_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  photo_date DATE DEFAULT CURRENT_DATE,
  location TEXT,
  category TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_photos TO authenticated;
GRANT ALL ON public.project_photos TO service_role;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_staff_all" ON public.project_photos FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.commitment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('subcontract','purchase_order','change_order','other')),
  description TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  budget_line TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','executed','completed')),
  executed_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commitment_log TO authenticated;
GRANT ALL ON public.commitment_log TO service_role;
ALTER TABLE public.commitment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cl_staff_all" ON public.commitment_log FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER cl_touch BEFORE UPDATE ON public.commitment_log
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.progress_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  application_number TEXT NOT NULL,
  period_label TEXT,
  period_start DATE,
  period_end DATE,
  amount NUMERIC(12,2) DEFAULT 0,
  retainage NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','paid','rejected')),
  submit_date DATE,
  approved_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_payments TO authenticated;
GRANT ALL ON public.progress_payments TO service_role;
ALTER TABLE public.progress_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppay_staff_all" ON public.progress_payments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER ppay_touch BEFORE UPDATE ON public.progress_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- RLS Policy for rental_id_cards
-- ============================================================
CREATE POLICY ric_tenant_read ON public.rental_id_cards FOR SELECT TO authenticated USING (tenant_id IN (SELECT id FROM public.tenants WHERE auth_user_id = auth.uid()));
