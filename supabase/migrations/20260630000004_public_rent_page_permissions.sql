-- Grant the anon role SELECT on properties and units so the public
-- rental-browsing page (/rent) can fetch data.  RLS policies
-- (properties_public_select, units_public_select) further restrict which
-- rows are visible; without the table-level GRANT the anon role cannot
-- touch the tables at all.

GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.units TO anon;
