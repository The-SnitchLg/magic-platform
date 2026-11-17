export type AppRole = 'student' | 'tutor' | 'admin';
export type ProjectStatus = 'awaiting_tutor' | 'agreements' | 'route_configuration' | 'active' | 'execution_finished';
export type AgreementStatus = 'draft' | 'submitted' | 'changes_requested' | 'approved';
export type RouteVersionStatus = 'draft' | 'published' | 'superseded';
export type StageStatus = 'locked' | 'available' | 'in_progress' | 'validated';
export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'changes_requested' | 'approved';
export type SubmissionStatus = 'submitted' | 'changes_requested' | 'approved';

export interface Profile {
  id: string;
  email_display: string;
  display_name: string;
  role: AppRole;
  active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchProject {
  id: string;
  student_id: string;
  tutor_id: string | null;
  program_id: string | null;
  cohort_id: string | null;
  title: string;
  status: ProjectStatus;
  revision: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  student?: Profile;
  tutor?: Profile;
  program?: AcademicProgram;
  cohort?: Cohort;
}

export interface AcademicProgram {
  id: string;
  code: string;
  name: string;
  degree_level: string;
  active: boolean;
  created_at: string;
}

export interface Cohort {
  id: string;
  program_id: string | null;
  label: string;
  period: string;
  created_at: string;
}

export interface AgreementVersion {
  id: string;
  project_id: string;
  version_no: number;
  conversation_date: string;
  topics: string;
  agreements: string;
  commitments: string;
  notes: string;
  status: AgreementStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  feedback: string;
  revision: number;
  created_at: string;
  updated_at: string;
  reviewer?: Profile;
}

export interface Methodology {
  id: string;
  title: string;
  description: string;
  approved_by: string;
  active: boolean;
  created_at: string;
}

export interface RouteTemplate {
  id: string;
  methodology_id: string | null;
  version_no: number;
  name: string;
  description: string;
  content_json: TemplateStage[];
  active: boolean;
  approved_at: string;
  created_at: string;
}

export interface TemplateTask {
  title: string;
  instructions: string;
  expected_result?: string;
  expectedResult?: string;
  requires_submission: boolean;
  requires_approval: boolean;
}

export interface TemplateStage {
  title: string;
  description: string;
  tasks: TemplateTask[];
}

export interface ProjectRouteVersion {
  id: string;
  project_id: string;
  template_id: string | null;
  version_no: number;
  status: RouteVersionStatus;
  content_json: TemplateStage[];
  published_at: string | null;
  published_by: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface RouteStage {
  id: string;
  route_version_id: string;
  order_no: number;
  title: string;
  description: string;
  status: StageStatus;
  created_at: string;
  tasks?: AcademicTask[];
}

export interface AcademicTask {
  id: string;
  stage_id: string;
  order_no: number;
  title: string;
  instructions: string;
  expected_result: string;
  requires_submission: boolean;
  requires_approval: boolean;
  status: TaskStatus;
  created_at: string;
  submissions?: EvidenceSubmission[];
}

export interface EvidenceSubmission {
  id: string;
  task_id: string;
  project_id: string;
  attempt_no: number;
  storage_key: string;
  file_name: string;
  file_size: number;
  comment: string;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_feedback: string;
  request_key: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  actor_id: string | null;
  event_type: string;
  entity: string;
  entity_id: string | null;
  safe_metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}
