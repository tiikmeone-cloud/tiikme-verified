-- Remove broad public object-listing policies from public storage buckets.
-- Public buckets still serve files via direct public URLs, but clients cannot enumerate bucket contents via list/select APIs.
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read cover images" ON storage.objects;
DROP POLICY IF EXISTS "Public read org assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read post images" ON storage.objects;
DROP POLICY IF EXISTS "cert_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "ol_read" ON storage.objects;
DROP POLICY IF EXISTS "pa_read" ON storage.objects;
DROP POLICY IF EXISTS "Auth read message attachments" ON storage.objects;