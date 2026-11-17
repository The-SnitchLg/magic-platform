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

-- 2. Storage RLS Policies
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Upload policy: Authenticated student can upload evidence to their project folder
DROP POLICY IF EXISTS "academic_evidence_upload" ON storage.objects;
CREATE POLICY "academic_evidence_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'academic-evidence'
    AND auth.role() = 'authenticated'
    -- The first path segment is the project_id; verify student or tutor ownership
    AND (
      public.is_student_of_project((storage.foldername(name))[1]::uuid)
      OR public.is_tutor_of_project((storage.foldername(name))[1]::uuid)
      OR public.is_admin()
    )
  );

-- Select policy: Student titular, assigned tutor or admin can read/download evidence
DROP POLICY IF EXISTS "academic_evidence_download" ON storage.objects;
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

-- Delete policy: Only admin or tutor can prune invalid objects
DROP POLICY IF EXISTS "academic_evidence_delete" ON storage.objects;
CREATE POLICY "academic_evidence_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'academic-evidence'
    AND public.is_admin()
  );
