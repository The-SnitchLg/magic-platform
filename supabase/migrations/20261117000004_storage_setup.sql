-- ==============================================================================
-- MAGIC PLATFORM — Storage Configuration & Access Control
-- Private Bucket 'academic-evidence' for Thesis Artifacts
-- ==============================================================================

-- 1. Create private bucket if not existing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'academic-evidence',
  'academic-evidence',
  false,
  52428800, -- 50 MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Storage RLS Policies (storage.objects has RLS enabled by default)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'academic_evidence_upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "academic_evidence_upload" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'academic-evidence'
        AND auth.role() = 'authenticated'
        AND (
          public.is_student_of_project((storage.foldername(name))[1]::uuid)
          OR public.is_tutor_of_project((storage.foldername(name))[1]::uuid)
          OR public.is_admin()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'academic_evidence_download' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "academic_evidence_download" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'academic-evidence'
        AND auth.role() = 'authenticated'
        AND (
          public.is_student_of_project((storage.foldername(name))[1]::uuid)
          OR public.is_tutor_of_project((storage.foldername(name))[1]::uuid)
          OR public.is_admin()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'academic_evidence_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "academic_evidence_delete" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'academic-evidence'
        AND public.is_admin()
      );
  END IF;
END $$;
