-- Add signed document URL to leases for scanned/stamped tenancy agreement
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS signed_document_url TEXT;

-- Grant rights
GRANT SELECT, INSERT, UPDATE ON public.leases TO authenticated;
