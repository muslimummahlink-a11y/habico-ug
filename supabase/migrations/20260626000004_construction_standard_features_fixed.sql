-- Phase 6: Construction Standard Features (retry-safe)
-- Schedules, Meeting Minutes, Punch List, Safety, Docs, Photos, Commitments, Progress Payments

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
CREATE POLICY IF NOT EXISTS "psched_staff_all" ON public.project_schedules FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS psched_touch ON public.project_schedules;
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
CREATE POLICY IF NOT EXISTS "mm_staff_all" ON public.meeting_minutes FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS mm_touch ON public.meeting_minutes;
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
CREATE POLICY IF NOT EXISTS "pli_staff_all" ON public.punch_list_items FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS pli_touch ON public.punch_list_items;
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
CREATE POLICY IF NOT EXISTS "si_staff_all" ON public.safety_incidents FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS si_touch ON public.safety_incidents;
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
CREATE POLICY IF NOT EXISTS "pd_staff_all" ON public.project_documents FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS pd_touch ON public.project_documents;
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
CREATE POLICY IF NOT EXISTS "pp_staff_all" ON public.project_photos FOR ALL TO authenticated
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
CREATE POLICY IF NOT EXISTS "cl_staff_all" ON public.commitment_log FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS cl_touch ON public.commitment_log;
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
CREATE POLICY IF NOT EXISTS "ppay_staff_all" ON public.progress_payments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP TRIGGER IF EXISTS ppay_touch ON public.progress_payments;
CREATE TRIGGER ppay_touch BEFORE UPDATE ON public.progress_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
