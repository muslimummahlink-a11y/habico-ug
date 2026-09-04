-- Enhanced meeting minutes for full secretary recording
-- Adds structured fields for detailed minute-taking

ALTER TABLE public.meeting_minutes
  ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS secretary_name TEXT,
  ADD COLUMN IF NOT EXISTS chairperson_name TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_by TEXT,
  ADD COLUMN IF NOT EXISTS distribution_list TEXT,
  ADD COLUMN IF NOT EXISTS discussions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS matters_arising JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS resolutions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS aob JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS next_meeting JSONB DEFAULT '{}';
