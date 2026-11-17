-- ==============================================================================
-- MAGIC PLATFORM — Initial Database Schema Migration
-- Academic Research Tracking & Postgraduate Supervision
-- Version: 7.0 (November 2026)
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Extends auth.users, strictly enforced role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_display TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('student', 'tutor', 'admin')) DEFAULT 'student',
  active BOOLEAN NOT NULL DEFAULT true,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on profiles role and active state
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);

-- 2. ROLE ASSIGNMENTS LOG (Immutable audit log of role transitions)
CREATE TABLE IF NOT EXISTS public.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_role TEXT NOT NULL,
  new_role TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ACADEMIC PROGRAMS
CREATE TABLE IF NOT EXISTS public.academic_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  degree_level TEXT NOT NULL DEFAULT 'Doctorado',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. COHORTS
CREATE TABLE IF NOT EXISTS public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.academic_programs(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RESEARCH PROJECTS (Individual dossier linking Student, Tutor and Program)
CREATE TABLE IF NOT EXISTS public.research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.academic_programs(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Proyecto de Investigación en Definición',
  status TEXT NOT NULL CHECK (status IN ('awaiting_tutor', 'agreements', 'route_configuration', 'active', 'execution_finished')) DEFAULT 'awaiting_tutor',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_student ON public.research_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_projects_tutor ON public.research_projects(tutor_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.research_projects(status);

-- 6. TUTOR ASSIGNMENT EVENTS (Audit trail of tutor changes)
CREATE TABLE IF NOT EXISTS public.tutor_assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  old_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  new_tutor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. AGREEMENT VERSIONS (C01 Initial Concerted Agreements)
CREATE TABLE IF NOT EXISTS public.agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL DEFAULT 1,
  conversation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  topics TEXT NOT NULL DEFAULT '',
  agreements TEXT NOT NULL DEFAULT '',
  commitments TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved')) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  feedback TEXT DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_agreement_project_version UNIQUE (project_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_agreements_project ON public.agreement_versions(project_id, version_no DESC);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON public.agreement_versions(status);

-- 8. METHODOLOGY CATALOG
CREATE TABLE IF NOT EXISTS public.methodology_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  approved_by TEXT NOT NULL DEFAULT 'Comisión de Posgrados',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ROUTE TEMPLATES (Canonical, immutable templates)
CREATE TABLE IF NOT EXISTS public.route_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id UUID REFERENCES public.methodology_catalog(id) ON DELETE SET NULL,
  version_no INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. PROJECT ROUTE VERSIONS (Tutor-customized version for student)
CREATE TABLE IF NOT EXISTS public.project_route_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.route_templates(id) ON DELETE SET NULL,
  version_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'superseded')) DEFAULT 'draft',
  content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_route_version UNIQUE (project_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_route_versions_project ON public.project_route_versions(project_id, status);

-- 11. ROUTE STAGES (Materialized from published route version)
CREATE TABLE IF NOT EXISTS public.route_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_version_id UUID NOT NULL REFERENCES public.project_route_versions(id) ON DELETE CASCADE,
  order_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('locked', 'available', 'in_progress', 'validated')) DEFAULT 'locked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_stages_version ON public.route_stages(route_version_id, order_no);

-- 12. ACADEMIC TASKS (Specific tasks under stages)
CREATE TABLE IF NOT EXISTS public.academic_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.route_stages(id) ON DELETE CASCADE,
  order_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  expected_result TEXT NOT NULL DEFAULT '',
  requires_submission BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'submitted', 'changes_requested', 'approved')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academic_tasks_stage ON public.academic_tasks(stage_id, order_no);
CREATE INDEX IF NOT EXISTS idx_academic_tasks_status ON public.academic_tasks(status);

-- 13. TASK DEPENDENCIES (Explicit milestone gates)
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.academic_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.academic_tasks(id) ON DELETE CASCADE,
  requires_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_task_id)
);

-- 14. EVIDENCE SUBMISSIONS (Private evidence files & versions)
CREATE TABLE IF NOT EXISTS public.evidence_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.academic_tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT 'evidencia.pdf',
  file_size INTEGER NOT NULL DEFAULT 0,
  comment TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('submitted', 'changes_requested', 'approved')) DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_feedback TEXT DEFAULT '',
  request_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_task ON public.evidence_submissions(task_id, attempt_no DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_project ON public.evidence_submissions(project_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON public.evidence_submissions(status);

-- 15. AUDIT EVENTS (Append-only institutional traceability)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON public.audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON public.audit_events(event_type, created_at DESC);

-- 16. OPERATION RECEIPTS (Idempotency enforcement)
CREATE TABLE IF NOT EXISTS public.operation_receipts (
  request_key TEXT PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  result_ref UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (Forces student role on signup)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always force 'student' role on public self-registration, regardless of client metadata
  INSERT INTO public.profiles (
    id,
    email_display,
    display_name,
    role,
    active,
    must_change_password
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student',
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create an initial research project for the new student
  INSERT INTO public.research_projects (
    student_id,
    title,
    status
  )
  VALUES (
    NEW.id,
    'Proyecto de Tesis Doctoral · ' || COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'awaiting_tutor'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
