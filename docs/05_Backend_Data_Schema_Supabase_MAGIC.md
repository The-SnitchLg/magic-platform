# 05 · Backend & Data Schema — MAGIC | Proyecto Supabase nuevo

**Versión:** 7.0 · 17/11/2026. Diseño objetivo del sistema académico, sin migración ejecutada en servicio remoto.  
**No usar jamás el proyecto Supabase anterior, su Auth, Storage, usuarios o service key.**

## 1. Recursos de infraestructura por entorno

| Recurso | Staging | Producción | Regla |
|---|---|---|---|
| Supabase | `posgrados-academico-stg` (nuevo) | `posgrados-academico-prd` (nuevo) | IDs y URL diferentes de todos los previos |
| Postgres | nuevo, sin datos heredados | nuevo, migración Git | no copiar tablas del proyecto anterior |
| Auth | emails de prueba no reales | usuarios reales al autorizar | perfiles nacen student |
| Storage | bucket `academic-evidence`, privado | mismo nombre bucket, otro proyecto | ACL RLS |
| Edge Functions | `manage-user`, `file-access` | idem | secret key solo en función |
| GitHub | repo único nuevo con ramas | rama protegida `main` | documentación + SQL + workflows |
| Vercel | deployments preview enlazados stg | `production` enlazado prod | variables separadas y pruebas post-deploy |

**Importante:** nombres de recursos son convenciones propuestas; no significa que existan. Guardar `project_id` y `url` en registro sin credenciales; comparar contra `supabase projects list` para verificar aislamiento.

## 2. Modelo de identidad y roles — contrato prioritario

`auth.users` guarda credenciales mediante Supabase Auth. `public.profiles.id` es FK `auth.users.id`. `public.profiles.role` pertenece a `{student,tutor,admin}` con default y trigger `student`; está bloqueado para escritura directa de cliente. `active=false` revoca permisos de aplicación. Las credenciales **no** aparecen como columna en `profiles`; no existe campo `password`, `password_hash` de aplicación ni CSV de claves.

### Bootstrap del primer administrador

1. Crear proyecto nuevo vacío, aplicar migración y confirmar RLS.
2. En estación de operador confiable, definir temporalmente `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` vía gestor de secretos o entrada interactiva (sin `echo`, sin commit). Correo y clave de la solicitud **nunca se incrustan** en archivo versionado.
3. Ejecutar bootstrap una sola vez, con proyecto ID verificado contra un `EXPECTED_SUPABASE_PROJECT_REF` explícito.
4. El proceso crea la cuenta por `supabase.auth.admin.createUser` o usa cuenta creada manualmente; comprueba que corresponde al proyecto nuevo y promueve con operación server-side auditada. Debe fallar si existe un admin preexistente distinto o si los datos no coinciden.
5. Probar login admin en Vercel, exigir cambio de clave inicial y habilitar MFA recomendado. Rotar o sustituir la clave temporal compartida en conversación. No conservarla en historial de terminal, GitHub Actions ni `.env` versionado.

> El correo y la contraseña pedidos para la cuenta inicial **no han sido creados** en un servicio externo desde esta sesión. El script `scripts/bootstrap-admin.mjs` es preparación; requiere conexión explícita, ejecución y prueba real.

### Provisionamiento posterior

- Panel admin envía email + `targetRole` + contraseña temporal (o `invite`); Edge Function autentica, consulta `profiles` para comprobar admin vigente, rate limit, valida fortaleza y confirma identidad antes de `auth.admin.createUser`. La contraseña jamás regresa en respuesta ni se loguea.
- Si correo existe como estudiante: operación `assignRole(existingUserId, 'tutor'|'admin')`, confirmación visible, sin nueva contraseña automática. Un cambio de clave requiere recuperación oficial.
- Registrar `role_assignments` (`actor_id`, `target_id`, `previous_role`, `new_role`, `reason`, `created_at`). Revertir solo con permisos de admin y sin dejar cero administradores activos.
- La UI selecciona destino al login, pero RLS revalida rol del perfil fresco en cada consulta. **No** depender de `user_metadata.role` por ser autodeclarable.
- Si el tutor se hace admin, su vista principal pasa a admin; sus asignaciones docentes permanecen si la política permite. La experiencia admin puede inspeccionar tutoría en modo lectura.

## 3. Entidades, claves y relaciones

| Tabla | Campos esenciales | Relación / integridad |
|---|---|---|
| `profiles` | `id`, `email_display`, `display_name`, `role`, `active`, `must_change_password`, `created_at` | id=auth.users.id; email no decide rol por sí solo |
| `role_assignments` | `id`, `actor_id`, `target_id`, `previous_role`, `new_role`, `reason`, `created_at` | sólo admin; log no editable |
| `academic_programs` | `id`, `name`, `active` | catálogo institucional, no inventar maestrías |
| `cohorts` | `id`, `program_id`, `label` | opcional para KPI si tiene datos reales |
| `research_projects` | `id`, `student_id`, `tutor_id`, `cohort_id`, `title`, `status`, `created_at`, `revision` | un estudiante puede tener proyectos según decisión; tutor asignado explícito |
| `tutor_assignment_events` | `id`, `project_id`, `old_tutor_id`, `new_tutor_id`, `actor_id`, `at` | histórico real de asignaciones |
| `agreement_versions` | `id`, `project_id`, `version_no`, `conversation_date`, `topics`, `agreements`, `commitments`, `notes`, `status`, `submitted_at`, `reviewed_at`, `reviewed_by`, `feedback`, `revision` | versión presentada no se edita silenciosamente; `UNIQUE(project_id,version_no)` |
| `methodology_catalog` | `id`, `title`, `approved_by`, `active` | enfoques aprobados; sin seis fases prefijadas |
| `route_templates` | `id`, `methodology_id`, `version_no`, `name`, `content_json`, `approved_at`, `active` | inmutables tras aprobación; fuentes verificables |
| `project_route_versions` | `id`, `project_id`, `template_id`, `version_no`, `status`, `content_json`, `published_at`, `published_by`, `revision` | draft privado tutor / published visible al estudiante |
| `route_stages` | `id`, `route_version_id`, `order_no`, `title`, `description`, `status` | etapas de ruta publicada, no del catálogo vivo |
| `academic_tasks` | `id`, `stage_id`, `order_no`, `title`, `instructions`, `expected_result`, `requires_submission`, `requires_approval`, `status` | tareas propias por versión |
| `task_dependencies` | `task_id`, `depends_on_task_id`, `requires_approved` | define bloqueos reales, detectar ciclos |
| `evidence_submissions` | `id`, `task_id`, `project_id`, `attempt_no`, `storage_key`, `comment`, `status`, `submitted_at`, `reviewed_by`, `reviewed_at`, `review_feedback`, `request_key` | cada intento permanece; estados revisables |
| `audit_events` | `id`, `actor_id`, `event_type`, `entity`, `entity_id`, `safe_metadata`, `created_at`, `request_id` | append-only y sin contenido académico sensible |
| `operation_receipts` | `request_key`, `actor_id`, `operation`, `result_ref`, `created_at` | idempotencia transaccional |
| `research_notes` | `id`, `project_id`, `author_id`, `kind`, `body` | P2; no es evidencia aprobada |
| `committee_members` / `advisory_sessions` | claves por proyecto y participación | P2; solo al aprobar reglamento |

**Normalización:** IDs UUID, `timestamptz` UTC, índices por claves de autorización, constraints de pertenencia cruzada, restricciones únicas para versión activa y de intentos, transacciones para publicar/revisar. El JSON de la plantilla es fuente editorial editable; cuando se publica se materializa en tablas de etapa/tarea para consultas e integridad. Nunca editar plantillas aprobadas in-place.

## 4. Integridad y estados

| Objeto | Transición autorizada | Quien la ejecuta |
|---|---|---|
| `profiles` | `student → tutor/admin`, `tutor → admin`, `active→disabled` | solo admin privilegiado, auditado |
| `agreement_versions` | `draft→submitted` | estudiante titular |
| `agreement_versions` | `submitted→approved/changes_requested` | tutor asignado |
| `project_route_versions` | `draft→published` | tutor asignado, acuerdos approved |
| `academic_tasks` | `pending→in_progress→submitted` | estudiante titular y guardias |
| `evidence_submissions` | `submitted→approved/changes_requested` | tutor asignado |
| `academic_tasks` | `submitted→approved/changes_requested` | derivado de la revisión correspondiente |
| `route_stages` | `locked→available→in_progress→validated` | servicio, según dependencias explícitas |

**No modelar** «semáforo de riesgo» como campo automático sin metodología. Los porcentajes se calculan únicamente de denominadores explícitos (`#tareas aprobadas / #tareas exigibles` si dirección lo aprueba), nunca desde una captura de Stitch.

## 5. Reglas RLS propuestas por tabla

| Tabla/objeto | Estudiante | Tutor | Admin | anon |
|---|---|---|---|---|
| profiles | sólo propio | sólo propio y datos mínimos de asignados | gestión autorizada | ninguno |
| projects, agreements | sólo propios | proyectos vinculados | lectura/gestión institucional | ninguno |
| route_templates | lectura si activas/aprobadas | lectura | escritura supervisada | ninguno |
| project_route_versions | sólo published de proyecto propio | draft+published de asignados | lectura | ninguno |
| academic_tasks | propias, publicadas | asignadas | lectura | ninguno |
| evidence_submissions | propias | asignadas | lectura según finalidad | ninguno |
| storage.objects | sólo propios por ruta/metadata | asignados, con permisos de lectura | accesos justificados/auditados | ninguno |
| audit_events | sólo eventos propios seleccionados si se habilita | restringido | consulta auditada | ninguno |
| role_assignments | ninguno | ninguno | lectura | ninguno |

Las policies deben usar servidor `(select auth.uid())`, funciones privadas definidas `SECURITY DEFINER` con search_path controlado **y sin recursividad RLS**, y grants explícitos por operación. `auth.uid()` para usuario autenticado y comparación de `project.student_id` / `project.tutor_id`; `private.is_admin()` consulta perfil actual, no JWT editable. Las operaciones de escritura crítica se ejecutan por RPC, no por update directo a tablas sin constraints.

> La migración inicial adjunta es una **base para ejecución y endurecimiento**, no certificación de seguridad. Antes de producción implementar y probar policies de todas las tablas y bucket, funciones de aprobación/publicación y reglas de roles. Una policy genérica «admin OR owner» no habilita automáticamente a un admin para aprobar acuerdos: el control de operación debe restringir actor tutor.

## 6. Storage y seguridad de evidencias

- Bucket `academic-evidence`, `public=false`; cada objeto usa clave opaca `project_uuid/task_uuid/submission_uuid/file_uuid`, no email, nombres de tesistas o título.
- Alta de archivo **primero** validada en `createEvidenceIntent`, que deriva propietario y tarea desde sesión y DB. Registrar `pending_upload` si se necesita y caducidad para limpiar huérfanos.
- `storage.objects` RLS debe comprobar que `bucket_id` es esperado, que el proyecto pertenece al estudiante o tutor y la ruta es la esperada; no confiar solo en el prefijo seleccionado por navegador.
- Revisión desde tutor obtiene URL temporal tras permiso; registrar descarga/consulta. La expiración no sustituye revocación o política de archivos.
- No exponer `service_role`/secret en `VITE_`, network del navegador, logs, GitHub, imágenes del diseño ni `.env.example` con valores.
- Antivirus/escaneo, MIME real, tamaño, límite de intentos, retención y eliminación son controles a establecer antes de aceptar información sensible.

## 7. Contratos RPC/Edge y consistencia

**`publish_project_route(projectId, versionId, requestKey)`**: comienza transacción, bloquea proyecto, comprueba `tutor_id=auth.uid()`, acuerdos aprobados, contenido válido, referencias existentes, que no existe otra publicación duplicada y que cambio a ruta activa cumple política. Materializa etapas/tareas y dependencies, cambia versión a published, inserta evento y receipt idempotente, commit. Si cualquier paso falla, rollback.

**`review_agreement(agreementId, decision, feedback, requestKey)`**: comprueba tutor vinculado, estado submitted, versión vigente; añade `reviewed_by`, fecha y evento, actualiza estado de proyecto si aprobada; solicitud de ajustes requiere razón.

**`submit_evidence(taskId, objectKey, requestKey)`**: comprueba estudiante titular, tarea habilitada, objeto privado realmente cargado, versión siguiente, crea submission submitted. No consume evidencia externa por URL arbitraria.

**`review_evidence(submissionId, decision, feedback, requestKey)`**: tutor asignado, la versión es pendiente y la tarea pertenece a ruta publicada del proyecto. `approved` evalúa dependencias de sucesoras y sólo habilita tareas/etapas si todas las exigibles se satisfacen. No aprobar documentos de otro tutor.

**`admin_manage_user()` (Edge)**: autenticar sesión, comprobar rol admin vigente en DB, valida correo/rol/contraseña temporal de un solo uso. Para usuario nuevo Auth Admin API crea cuenta; para existente no duplicar y sólo promover. Audita, maneja errores de sincronización y oculta detalles sensibles de errores.

## 8. Índices y capacidad

Índices mínimos: `projects(student_id)`, `projects(tutor_id)`, `agreement_versions(project_id,version_no DESC)`, `project_route_versions(project_id,status)`, `route_stages(route_version_id,order_no)`, `academic_tasks(stage_id,order_no)`, `evidence_submissions(task_id,attempt_no DESC)`, `evidence_submissions(status,submitted_at)`, `audit_events(actor_id,created_at DESC)`. Aplicar límites/paginación en bandejas, no traer la cohorte completa al navegador por defecto.

El volumen de usuarios no está en la reunión; no inventar escalabilidad, SLA o tamaño de base. Medir latencia en preview con 1/10/100 proyectos sintéticos antes de establecer objetivos definitivos.

## 9. Pruebas obligatorias de protección

`DB01` autorregistro student; `DB02` inyección user_metadata admin bloqueada; `DB03` admin crea tutor; `DB04` estudiante no crea tutor; `DB05` correo existente se promociona sin duplicar Auth; `DB06` tutor sólo asignados; `DB07` admin no firma como tutor por cambiar vista; `DB08` acuerdos no aprobados bloquean publish; `DB09` draft no visible alumno; `DB10` doble publicación no duplica; `DB11` archivo subido sólo al bucket privado; `DB12` lectura Storage cruzada denegada; `DB13` doble aval idempotente; `DB14` historial de versiones conservado; `DB15` revocación de rol en sesión antigua; `DB16` no perder último admin; `DB17` pruebas desde URL Vercel producen escrituras observables en nuevo Supabase.

## 10. Privacidad, tratamiento y respaldo

Antes de producción definir: responsable y finalidad del tratamiento, aviso de privacidad, base jurídica para datos de estudiantes, retención, acceso admin a expedientes, exportaciones, gestión de eliminación, RPO/RTO, logs, recuperación y mecanismo de incidentes. Colombia: verificar obligaciones aplicables de protección de datos con asesoría institucional; no copiar texto legal genérico como aviso válido.

## 11. Referencias y runbooks

- Implementación de DB en `supabase/migrations/` del paquete.
- Alta admin en `scripts/bootstrap-admin.mjs` con credenciales mediante variables **solo al ejecutar**.
- Reglas de RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Storage privado: https://supabase.com/docs/guides/storage/security/access-control
- Usuarios/invitaciones: https://supabase.com/docs/guides/auth/users
- Auth hooks: https://supabase.com/docs/guides/auth/auth-hooks
