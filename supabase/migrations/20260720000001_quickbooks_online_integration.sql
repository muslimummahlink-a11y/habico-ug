-- QuickBooks Online Integration
-- Stores OAuth 2.0 tokens per company for QBO API access

CREATE TABLE IF NOT EXISTS public.company_qbo_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_qbo_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qbo_tokens_staff_all" ON public.company_qbo_tokens
  FOR ALL TO authenticated
  USING (public.is_same_company(company_id))
  WITH CHECK (public.is_same_company(company_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_qbo_tokens TO authenticated;
GRANT ALL ON public.company_qbo_tokens TO service_role;

CREATE TRIGGER qbo_tokens_touch BEFORE UPDATE ON public.company_qbo_tokens
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- QBO sync log for tracking sync history
CREATE TABLE IF NOT EXISTS public.qbo_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('customers','vendors','invoices','bills','payments','full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qbo_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qbo_sync_log_staff_all" ON public.qbo_sync_log
  FOR ALL TO authenticated
  USING (public.is_same_company(company_id))
  WITH CHECK (public.is_same_company(company_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qbo_sync_log TO authenticated;
GRANT ALL ON public.qbo_sync_log TO service_role;
