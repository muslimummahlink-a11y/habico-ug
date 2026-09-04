-- Create land_inquiries table for the /land route (contact-locked inquiries)
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

-- Allow anon and authenticated users to insert inquiries
CREATE POLICY "land_inquiries_insert_policy"
  ON land_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admins can view inquiries
CREATE POLICY "land_inquiries_select_policy"
  ON land_inquiries FOR SELECT
  TO authenticated
  USING (true);
