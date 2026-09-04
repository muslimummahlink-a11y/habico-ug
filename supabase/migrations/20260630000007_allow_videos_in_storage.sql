-- Allow video uploads in the public bucket (MIME types + size limit)
UPDATE storage.buckets
SET file_size_limit = 52428800,
    allowed_mime_types = '{image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4,video/mpeg,video/quicktime,video/webm,video/x-msvideo}'
WHERE id = 'public';
