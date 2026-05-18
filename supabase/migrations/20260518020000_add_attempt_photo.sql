-- Per-attempt photo. Parallel to video: independent column so an attempt can have
-- one, both, or neither. Storage is the `practice-photos` bucket, scoped to the
-- user's UUID folder via the same RLS shape used for videos.

ALTER TABLE skill_attempt
  ADD COLUMN photo_path TEXT,
  ADD COLUMN photo_size_bytes BIGINT CHECK (photo_size_bytes IS NULL OR photo_size_bytes >= 0);

-- Private bucket, 20 MB cap per object (photos are small even from modern phones).
-- HEIC is included because iOS Safari hands HEIC straight from the camera.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'practice-photos',
  'practice-photos',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/webp', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY practice_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'practice-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY practice_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'practice-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY practice_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'practice-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
