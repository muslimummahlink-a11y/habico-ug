ALTER TABLE public.pending_listings ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id ON public.app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_app_notifications_unread ON public.app_notifications(user_id, is_read);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.app_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.app_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.app_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-notify admin/manager staff when a property is submitted via public forms
CREATE OR REPLACE FUNCTION public.notify_staff_on_pending_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  staff_user RECORD;
BEGIN
  FOR staff_user IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'manager')
  LOOP
    INSERT INTO public.app_notifications (user_id, title, description, link, type, metadata)
    VALUES (
      staff_user.user_id,
      'New property submitted',
      NEW.name || ' (' || COALESCE(NEW.property_type, 'property') || ') — ' || COALESCE(NEW.city, NEW.location, 'unknown location'),
      '/pending-listings',
      'info',
      jsonb_build_object('pending_listing_id', NEW.id, 'contact_name', NEW.contact_name)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_pending_listing_insert
  AFTER INSERT ON public.pending_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_staff_on_pending_listing();
