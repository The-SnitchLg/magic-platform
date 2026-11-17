# ADR-003: Route Versioning & Private Evidence Storage

## Status
Accepted

## Context
Dissertation trajectories require custom academic routes (phases, milestones, deliverables) tailored to the doctoral project. Furthermore, submitted thesis evidence files (PDF, DOCX, datasets) are confidential intellectual property.

## Decision
1. **Canonical Templates vs. Customized Routes**: Institutional templates (`route_templates`) approved by the academic committee are canonical and immutable. When a tutor assigns a route, a project-specific copy is generated in `project_route_versions`.
2. **Atomic Publication**: Only the assigned tutor can publish a route, and only after the Initial Concerted Agreements (C01) have been formally approved. Publishing executes an atomic transaction `publish_project_route` that materializes stages (`route_stages`) and tasks (`academic_tasks`), and sets any previous published version to `superseded` without destroying historical submissions.
3. **Private Evidence Storage**: All evidence files are deposited into a private bucket `academic-evidence`. RLS policies restrict read/write access to the titular student and their designated tutor. Download access uses short-lived signed URLs.
4. **Milestone Unlocking**: Milestone releases are conditioned on explicit dependency satisfaction (`task_dependencies`). A stage is validated only when all required activities in that stage receive formal approval from the tutor.

## Consequences
- Complete auditability and version persistence across academic semesters.
- Full protection of student intellectual property in private cloud storage.
