-- Allow EXE downloads in the public bucket (larger size limit + EXE MIME type)
UPDATE storage.buckets
SET file_size_limit = 209715200,
    allowed_mime_types = '{image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4,video/mpeg,video/quicktime,video/webm,video/x-msvideo,application/x-msdownload}'
WHERE id = 'public';
