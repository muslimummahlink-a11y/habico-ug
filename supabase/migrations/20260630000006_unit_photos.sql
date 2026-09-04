ALTER TABLE public.units ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '{}'::jsonb;
