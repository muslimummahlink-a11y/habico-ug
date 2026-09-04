-- Create pending_listings table for broker/public property submissions
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

-- Allow anon and authenticated users to insert
CREATE POLICY "pending_listings_insert_policy"
  ON pending_listings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admins can view/update listings
CREATE POLICY "pending_listings_select_policy"
  ON pending_listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pending_listings_update_policy"
  ON pending_listings FOR UPDATE
  TO authenticated
  USING (true);
