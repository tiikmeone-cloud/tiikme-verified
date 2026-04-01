-- Fix avatars bucket (profile photos only)
UPDATE storage.buckets 
SET 
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE name = 'avatars';

-- Fix work-assets bucket (images + PDFs for work items)
UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf']
WHERE name = 'work-assets';

-- Fix pings-pdfs bucket (PDFs only, private)
UPDATE storage.buckets
SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'],
  public = false
WHERE name = 'pings-pdfs';