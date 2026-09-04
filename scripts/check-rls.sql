-- Check all profiles and their company_ids
SELECT id, company_id, role FROM public.profiles LIMIT 10;

-- Check the quotation's company_id
SELECT id, company_id, quotation_number FROM public.quotations;

-- Check what is_same_company does
SELECT prosrc FROM pg_proc WHERE proname = 'is_same_company';
