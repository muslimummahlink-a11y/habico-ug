-- Create the "public" bucket used by FileUpload for all image/file uploads.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public', 'public', true, 20971520, '{image/png,image/jpeg,image/webp,image/gif,application/pdf}')
ON CONFLICT (id) DO NOTHING;
-- Storage RLS: drop any existing defaults, then create ours.
DROP POLICY IF EXISTS "public_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "public_bucket_select" ON storage.objects;
-- Allow authenticated users to upload to the "public" bucket
CREATE POLICY "public_bucket_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public');
-- Allow anon + authenticated to view objects in "public" (for public property images)
CREATE POLICY "public_bucket_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public');
