# ADR-002: Role Governance & Confidential Initial Admin Bootstrap

## Status
Accepted

## Context
Academic supervision requires strict role segregation across three profiles: `student`, `tutor`, and `admin`. Public self-registration must never grant elevated privileges. Furthermore, the initial administrator credentials supplied by project leadership are strictly confidential and must never leak into version control, markdown specifications, logs, or client bundles.

## Decision
1. **Server-Side Role Forcing**: A PostgreSQL trigger `on_auth_user_created` automatically sets `profiles.role = 'student'` on every self-registration, unconditionally discarding any client-provided role metadata.
2. **Confidential Bootstrap**: Initial administrator provisioning is performed via a standalone, protected Node.js script (`scripts/bootstrap-admin.mjs`) executing outside the browser, reading credentials exclusively from secure runtime environment variables.
3. **No Duplicate Identity on Promotion**: When an existing student account is promoted to tutor or administrator, the system promotes the existing record in `profiles` and logs an immutable audit event, rather than creating a duplicate Auth user.
4. **Read-Only Supervision Mode**: When an administrator switches to the visual space of a student or tutor, the interface displays a persistent `ReadOnlySupervisionBanner` and locks all approval, verdict, and file submission controls to prevent identity spoofing.
5. **Secret Scanning**: Automated pre-commit and CI scanner (`scripts/scan-secrets.mjs`) verifies that no forbidden credential patterns exist anywhere in the repository.

## Consequences
- Guaranteed zero-leakage of administrator credentials.
- Total protection against privilege escalation attacks.
