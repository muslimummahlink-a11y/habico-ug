-- Add pending_listing_id to properties so we can trace back from reject → unpublish
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pending_listing_id UUID REFERENCES pending_listings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_pending_listing_id ON properties(pending_listing_id);
