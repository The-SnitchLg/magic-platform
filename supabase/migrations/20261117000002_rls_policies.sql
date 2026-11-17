-- ==============================================================================
-- MAGIC PLATFORM — Row Level Security (RLS) Policies
-- Strict Multi-Tenant Separation & Server-Enforced RBAC
-- ==============================================================================

-- Helper Functions (SECURITY DEFINER with strict search_path to prevent recursion)

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tutor_of_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.research_projects 
    WHERE id = p_project_id AND tutor_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student_of_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.research_projects 
    WHERE id = p_project_id AND student_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all profiles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() 
    OR public.is_admin()
    -- Tutors can view profiles of their assigned students
    OR EXISTS (
      SELECT 1 FROM public.research_projects 
      WHERE tutor_id = auth.uid() AND student_id = public.profiles.id
    )
    -- Students can view profile of their assigned tutor
    OR EXISTS (
      SELECT 1 FROM public.research_projects 
      WHERE student_id = auth.uid() AND tutor_id = public.profiles.id
    )
  );

-- Users can update non-critical profile fields (display_name); role is protected
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    -- Prohibit client modification of role directly via standard update
    (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 2. ROLE ASSIGNMENTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_assignments_admin_only" ON public.role_assignments
  FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. ACADEMIC PROGRAMS & COHORTS & CATALOGS (Readable by authenticated users)
-- ------------------------------------------------------------------------------
ALTER TABLE public.academic_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "programs_read_all" ON public.academic_programs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "programs_write_admin" ON public.academic_programs FOR ALL USING (public.is_admin());

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cohorts_read_all" ON public.cohorts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cohorts_write_admin" ON public.cohorts FOR ALL USING (public.is_admin());

ALTER TABLE public.methodology_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "methodology_read_all" ON public.methodology_catalog FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "methodology_write_admin" ON public.methodology_catalog FOR ALL USING (public.is_admin());

ALTER TABLE public.route_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "route_templates_read_all" ON public.route_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "route_templates_write_admin" ON public.route_templates FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. RESEARCH PROJECTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_accessible" ON public.research_projects
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR tutor_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "projects_update_authorized" ON public.research_projects
  FOR UPDATE
  USING (
    student_id = auth.uid()
    OR tutor_id = auth.uid()
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 5. TUTOR ASSIGNMENT EVENTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.tutor_assignment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_events_select" ON public.tutor_assignment_events
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.research_projects WHERE id = project_id AND (student_id = auth.uid() OR tutor_id = auth.uid()))
  );

-- ------------------------------------------------------------------------------
-- 6. AGREEMENT VERSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.agreement_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agreements_select_accessible" ON public.agreement_versions
  FOR SELECT
  USING (
    public.is_student_of_project(project_id)
    OR public.is_tutor_of_project(project_id)
    OR public.is_admin()
  );

CREATE POLICY "agreements_insert_student" ON public.agreement_versions
  FOR INSERT
  WITH CHECK (
    public.is_student_of_project(project_id)
  );

CREATE POLICY "agreements_update_participants" ON public.agreement_versions
  FOR UPDATE
  USING (
    -- Student can update only their draft or changes_requested versions
    (public.is_student_of_project(project_id) AND status IN ('draft', 'changes_requested'))
    -- Tutor can update when submitted to review/approve
    OR (public.is_tutor_of_project(project_id) AND status = 'submitted')
    OR public.is_admin()
  )
  WITH CHECK (
    -- Student can transition to draft or submitted
    (public.is_student_of_project(project_id) AND status IN ('draft', 'submitted'))
    -- Tutor can transition to changes_requested or approved
    OR (public.is_tutor_of_project(project_id) AND status IN ('submitted', 'changes_requested', 'approved'))
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 7. PROJECT ROUTE VERSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.project_route_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "route_versions_select" ON public.project_route_versions
  FOR SELECT
  USING (
    -- Students only see published versions of their own project
    (public.is_student_of_project(project_id) AND status = 'published')
    -- Tutors see all versions (draft, published, superseded) for assigned projects
    OR public.is_tutor_of_project(project_id)
    OR public.is_admin()
  );

CREATE POLICY "route_versions_modify_tutor" ON public.project_route_versions
  FOR ALL
  USING (
    public.is_tutor_of_project(project_id)
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 8. ROUTE STAGES & ACADEMIC TASKS & DEPENDENCIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.route_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_select_accessible" ON public.route_stages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_route_versions prv
      WHERE prv.id = route_version_id
      AND (
        (public.is_student_of_project(prv.project_id) AND prv.status = 'published')
        OR public.is_tutor_of_project(prv.project_id)
        OR public.is_admin()
      )
    )
  );

ALTER TABLE public.academic_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_accessible" ON public.academic_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.route_stages rs
      JOIN public.project_route_versions prv ON prv.id = rs.route_version_id
      WHERE rs.id = stage_id
      AND (
        (public.is_student_of_project(prv.project_id) AND prv.status = 'published')
        OR public.is_tutor_of_project(prv.project_id)
        OR public.is_admin()
      )
    )
  );

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dependencies_select" ON public.task_dependencies
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- 9. EVIDENCE SUBMISSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.evidence_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_select_accessible" ON public.evidence_submissions
  FOR SELECT
  USING (
    public.is_student_of_project(project_id)
    OR public.is_tutor_of_project(project_id)
    OR public.is_admin()
  );

CREATE POLICY "evidence_insert_student" ON public.evidence_submissions
  FOR INSERT
  WITH CHECK (
    public.is_student_of_project(project_id)
  );

CREATE POLICY "evidence_update_tutor" ON public.evidence_submissions
  FOR UPDATE
  USING (
    public.is_tutor_of_project(project_id)
    OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 10. AUDIT EVENTS & OPERATION RECEIPTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_admin" ON public.audit_events
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "audit_insert_system" ON public.audit_events
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.operation_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_select_own" ON public.operation_receipts
  FOR SELECT
  USING (actor_id = auth.uid() OR public.is_admin());
