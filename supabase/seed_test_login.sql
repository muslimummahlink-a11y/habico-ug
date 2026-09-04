-- 1. Create the validation function (run first)
-- Copy and run the contents of supabase/migrations/20260630000009_card_login_function.sql

-- 2. Insert test data
INSERT INTO public.properties (id, name, address, location, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Habico Towers', '123 Kampala Road', 'Central/Kampala/Kawempe', true);

INSERT INTO public.units (id, property_id, unit_number, bedrooms, bathrooms, monthly_rent, status)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'A101', 2, 1, 800000, 'vacant');

INSERT INTO public.tenants (id, full_name, email, phone, access_pin, status)
VALUES ('00000000-0000-0000-0000-000000000100', 'John Doe', 'test@example.com', '+256700000000', '7747', 'active');

INSERT INTO public.rental_id_cards (id, unit_id, tenant_id, card_number, status)
VALUES ('00000000-0000-0000-0000-000000001000', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000100', 'HBC-PUUX-BCXT', 'active');
