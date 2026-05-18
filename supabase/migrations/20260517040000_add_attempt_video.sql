-- Move practice videos from local IndexedDB to Supabase Storage.
-- Videos are private (signed URLs only) and scoped to the user's folder.
-- skill_attempt gains:
--   video_path        — object key in the bucket (NULL means no video)
--   video_size_bytes  — size at upload time; used for the Settings stats card

ALTER TABLE skill_attempt
  ADD COLUMN video_path TEXT,
  ADD COLUMN video_size_bytes BIGINT CHECK (video_size_bytes IS NULL OR video_size_bytes >= 0);

-- Bucket: private, capped at 200 MB per object (well above the 5-min recording cap),
-- restricted to the two MIME types MediaRecorder produces in supported browsers.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'practice-videos',
  'practice-videos',
  false,
  209715200,
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — users can only read/insert/delete files under their own UUID folder.
-- Path convention enforced by the app: <auth.uid()>/<random-uuid>.<ext>
CREATE POLICY practice_videos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'practice-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY practice_videos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'practice-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY practice_videos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'practice-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
