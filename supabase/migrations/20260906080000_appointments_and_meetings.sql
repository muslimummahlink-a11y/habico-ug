CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'meeting' CHECK (appointment_type IN ('meeting','inspection','viewing','handover','follow_up','other')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  agenda TEXT,
  notes TEXT,
  minutes TEXT,
  action_items TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence TEXT,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizer_email TEXT,
  party_one_name TEXT,
  party_one_email TEXT,
  party_two_name TEXT,
  party_two_email TEXT,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_attachments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
GRANT ALL ON public.appointment_attachments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_staff_all" ON public.appointments;
DROP POLICY IF EXISTS "appointment_attachments_staff_all" ON public.appointment_attachments;
CREATE POLICY "appointments_staff_all" ON public.appointments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "appointment_attachments_staff_all" ON public.appointment_attachments FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());