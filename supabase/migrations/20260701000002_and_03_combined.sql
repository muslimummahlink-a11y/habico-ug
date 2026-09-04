-- ============================================================
-- COMBINED MIGRATION: land_inquiries + pending_listings tables
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 1. LAND INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS land_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','resolved','archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE land_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "land_inquiries_insert_policy" ON land_inquiries;
CREATE POLICY "land_inquiries_insert_policy"
  ON land_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "land_inquiries_select_policy" ON land_inquiries;
CREATE POLICY "land_inquiries_select_policy"
  ON land_inquiries FOR SELECT
  TO authenticated
  USING (true);

-- 2. PENDING LISTINGS TABLE
CREATE TABLE IF NOT EXISTS pending_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential','commercial','industrial','land','mixed_use')),
  location TEXT,
  city TEXT,
  address TEXT,
  description TEXT,
  price NUMERIC(12,2),
  size_sqm NUMERIC(10,2),
  bedrooms INT,
  bathrooms INT,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pending_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_listings_insert_policy" ON pending_listings;
CREATE POLICY "pending_listings_insert_policy"
  ON pending_listings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "pending_listings_select_policy" ON pending_listings;
CREATE POLICY "pending_listings_select_policy"
  ON pending_listings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "pending_listings_update_policy" ON pending_listings;
CREATE POLICY "pending_listings_update_policy"
  ON pending_listings FOR UPDATE
  TO authenticated
  USING (true);
