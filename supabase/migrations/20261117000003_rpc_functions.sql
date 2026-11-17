-- ==============================================================================
-- MAGIC PLATFORM — RPC Domain Functions & Transactional Workflows
-- Version: 7.0 (November 2026)
-- ==============================================================================

-- 1. REVIEW AGREEMENT (Tutor Decision)
CREATE OR REPLACE FUNCTION public.review_agreement(
  p_agreement_id UUID,
  p_decision TEXT, -- 'approved' | 'changes_requested'
  p_feedback TEXT DEFAULT '',
  p_request_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_tutor_id UUID;
  v_current_status TEXT;
  v_actor_id UUID := auth.uid();
  v_agreement RECORD;
BEGIN
  -- Idempotency check if key provided
  IF p_request_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.operation_receipts WHERE request_key = p_request_key) THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Operación ya procesada previamente');
    END IF;
  END IF;

  -- Validate agreement exists and get context
  SELECT av.id, av.project_id, av.status, rp.tutor_id INTO v_agreement
  FROM public.agreement_versions av
  JOIN public.research_projects rp ON rp.id = av.project_id
  WHERE av.id = p_agreement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acuerdo no encontrado o no autorizado';
  END IF;

  -- Verify caller is the designated tutor of this project (or system admin)
  IF v_agreement.tutor_id != v_actor_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el tutor asignado al proyecto puede dictaminar los acuerdos';
  END IF;

  IF v_agreement.status != 'submitted' THEN
    RAISE EXCEPTION 'El acuerdo no está en estado pendiente de revisión (estado actual: %)', v_agreement.status;
  END IF;

  IF p_decision NOT IN ('approved', 'changes_requested') THEN
    RAISE EXCEPTION 'Decisión inválida. Debe ser approved o changes_requested';
  END IF;

  IF p_decision = 'changes_requested' AND (p_feedback IS NULL OR trim(p_feedback) = '') THEN
    RAISE EXCEPTION 'Debe proporcionar una retroalimentación al solicitar ajustes';
  END IF;

  -- Update agreement version status
  UPDATE public.agreement_versions
  SET
    status = p_decision,
    reviewed_at = now(),
    reviewed_by = v_actor_id,
    feedback = COALESCE(p_feedback, ''),
    updated_at = now()
  WHERE id = p_agreement_id;

  -- If approved, advance research project status to route_configuration
  IF p_decision = 'approved' THEN
    UPDATE public.research_projects
    SET status = 'route_configuration', updated_at = now()
    WHERE id = v_agreement.project_id;
  END IF;

  -- Log institutional audit event
  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    'AGREEMENT_' || upper(p_decision),
    'agreement_versions',
    p_agreement_id,
    jsonb_build_object(
      'project_id', v_agreement.project_id,
      'decision', p_decision,
      'reviewed_at', now()
    )
  );

  -- Record receipt
  IF p_request_key IS NOT NULL THEN
    INSERT INTO public.operation_receipts (request_key, actor_id, operation, result_ref)
    VALUES (p_request_key, v_actor_id, 'review_agreement', p_agreement_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'agreement_id', p_agreement_id,
    'decision', p_decision
  );
END;
$$;

-- 2. PUBLISH PROJECT ROUTE (Tutor Atomic Route Publication)
CREATE OR REPLACE FUNCTION public.publish_project_route(
  p_project_id UUID,
  p_version_id UUID,
  p_request_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_project RECORD;
  v_version RECORD;
  v_stage_item JSONB;
  v_task_item JSONB;
  v_stage_id UUID;
  v_task_id UUID;
  v_stage_order INT := 1;
  v_task_order INT := 1;
BEGIN
  -- Idempotency check
  IF p_request_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.operation_receipts WHERE request_key = p_request_key) THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Ruta ya publicada');
    END IF;
  END IF;

  -- Lock project record for update
  SELECT id, tutor_id, status INTO v_project
  FROM public.research_projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado';
  END IF;

  IF v_project.tutor_id != v_actor_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el tutor asignado puede publicar la ruta académica del proyecto';
  END IF;

  -- Ensure agreements have been officially approved
  IF NOT EXISTS (
    SELECT 1 FROM public.agreement_versions 
    WHERE project_id = p_project_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'No se puede publicar la ruta sin acuerdos iniciales previamente aprobados';
  END IF;

  -- Fetch route version draft
  SELECT id, version_no, content_json INTO v_version
  FROM public.project_route_versions
  WHERE id = p_version_id AND project_id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrador de ruta no encontrado para este proyecto';
  END IF;

  -- Mark previously published versions as superseded
  UPDATE public.project_route_versions
  SET status = 'superseded', updated_at = now()
  WHERE project_id = p_project_id AND status = 'published';

  -- Update current version to published
  UPDATE public.project_route_versions
  SET
    status = 'published',
    published_at = now(),
    published_by = v_actor_id,
    updated_at = now()
  WHERE id = p_version_id;

  -- Clean up prior unsubmitted tasks if re-publishing or populate newly
  -- Materialize stages and tasks from content_json
  FOR v_stage_item IN SELECT * FROM jsonb_array_elements(v_version.content_json)
  LOOP
    INSERT INTO public.route_stages (
      route_version_id,
      order_no,
      title,
      description,
      status
    )
    VALUES (
      p_version_id,
      v_stage_order,
      COALESCE(v_stage_item->>'title', 'Etapa ' || v_stage_order),
      COALESCE(v_stage_item->>'description', ''),
      CASE WHEN v_stage_order = 1 THEN 'available' ELSE 'locked' END
    )
    RETURNING id INTO v_stage_id;

    v_task_order := 1;
    IF v_stage_item->'tasks' IS NOT NULL AND jsonb_typeof(v_stage_item->'tasks') = 'array' THEN
      FOR v_task_item IN SELECT * FROM jsonb_array_elements(v_stage_item->'tasks')
      LOOP
        INSERT INTO public.academic_tasks (
          stage_id,
          order_no,
          title,
          instructions,
          expected_result,
          requires_submission,
          requires_approval,
          status
        )
        VALUES (
          v_stage_id,
          v_task_order,
          COALESCE(v_task_item->>'title', 'Tarea ' || v_task_order),
          COALESCE(v_task_item->>'instructions', ''),
          COALESCE(v_task_item->>'expected_result', ''),
          COALESCE((v_task_item->>'requires_submission')::boolean, true),
          COALESCE((v_task_item->>'requires_approval')::boolean, true),
          CASE WHEN v_stage_order = 1 AND v_task_order = 1 THEN 'in_progress' ELSE 'pending' END
        );
        v_task_order := v_task_order + 1;
      END LOOP;
    END IF;

    v_stage_order := v_stage_order + 1;
  END LOOP;

  -- Advance project status to active
  UPDATE public.research_projects
  SET status = 'active', updated_at = now()
  WHERE id = p_project_id;

  -- Audit log
  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    'ROUTE_PUBLISHED',
    'project_route_versions',
    p_version_id,
    jsonb_build_object(
      'project_id', p_project_id,
      'stages_count', v_stage_order - 1,
      'published_at', now()
    )
  );

  -- Receipt
  IF p_request_key IS NOT NULL THEN
    INSERT INTO public.operation_receipts (request_key, actor_id, operation, result_ref)
    VALUES (p_request_key, v_actor_id, 'publish_project_route', p_version_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'version_id', p_version_id,
    'status', 'published'
  );
END;
$$;

-- 3. SUBMIT EVIDENCE (Student Uploads & Submits Evidence)
CREATE OR REPLACE FUNCTION public.submit_evidence(
  p_task_id UUID,
  p_storage_key TEXT,
  p_file_name TEXT DEFAULT 'evidencia.pdf',
  p_file_size INT DEFAULT 0,
  p_comment TEXT DEFAULT '',
  p_request_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_task RECORD;
  v_project_id UUID;
  v_next_attempt INT := 1;
  v_submission_id UUID;
BEGIN
  -- Idempotency check
  IF p_request_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.operation_receipts WHERE request_key = p_request_key) THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Entrega ya registrada');
    END IF;
  END IF;

  -- Verify task exists and is accessible to student
  SELECT at.id, at.status, at.requires_submission, prv.project_id INTO v_task
  FROM public.academic_tasks at
  JOIN public.route_stages rs ON rs.id = at.stage_id
  JOIN public.project_route_versions prv ON prv.id = rs.route_version_id
  JOIN public.research_projects rp ON rp.id = prv.project_id
  WHERE at.id = p_task_id AND prv.status = 'published' AND rp.student_id = v_actor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarea no disponible o no pertenece a la ruta publicada del estudiante';
  END IF;

  v_project_id := v_task.project_id;

  -- Compute next attempt number
  SELECT COALESCE(MAX(attempt_no), 0) + 1 INTO v_next_attempt
  FROM public.evidence_submissions
  WHERE task_id = p_task_id;

  -- Insert submission record
  INSERT INTO public.evidence_submissions (
    task_id,
    project_id,
    attempt_no,
    storage_key,
    file_name,
    file_size,
    comment,
    status,
    submitted_at,
    request_key
  )
  VALUES (
    p_task_id,
    v_project_id,
    v_next_attempt,
    p_storage_key,
    COALESCE(p_file_name, 'evidencia.pdf'),
    COALESCE(p_file_size, 0),
    COALESCE(p_comment, ''),
    'submitted',
    now(),
    p_request_key
  )
  RETURNING id INTO v_submission_id;

  -- Update task status to submitted
  UPDATE public.academic_tasks
  SET status = 'submitted'
  WHERE id = p_task_id;

  -- Audit log
  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    'EVIDENCE_SUBMITTED',
    'evidence_submissions',
    v_submission_id,
    jsonb_build_object(
      'task_id', p_task_id,
      'project_id', v_project_id,
      'attempt_no', v_next_attempt,
      'submitted_at', now()
    )
  );

  -- Receipt
  IF p_request_key IS NOT NULL THEN
    INSERT INTO public.operation_receipts (request_key, actor_id, operation, result_ref)
    VALUES (p_request_key, v_actor_id, 'submit_evidence', v_submission_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_submission_id,
    'attempt_no', v_next_attempt
  );
END;
$$;

-- 4. REVIEW EVIDENCE (Tutor Evaluates & Conditionally Unlocks Milestones)
CREATE OR REPLACE FUNCTION public.review_evidence(
  p_submission_id UUID,
  p_decision TEXT, -- 'approved' | 'changes_requested'
  p_feedback TEXT DEFAULT '',
  p_request_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_submission RECORD;
  v_task_id UUID;
  v_stage_id UUID;
  v_project_id UUID;
  v_all_stage_tasks_approved BOOLEAN;
  v_next_stage_id UUID;
  v_current_order INT;
  v_route_version_id UUID;
BEGIN
  -- Idempotency check
  IF p_request_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.operation_receipts WHERE request_key = p_request_key) THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Evaluación ya procesada');
    END IF;
  END IF;

  -- Fetch submission and lock
  SELECT es.id, es.task_id, es.project_id, es.status, rp.tutor_id INTO v_submission
  FROM public.evidence_submissions es
  JOIN public.research_projects rp ON rp.id = es.project_id
  WHERE es.id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega no encontrada o no autorizada';
  END IF;

  IF v_submission.tutor_id != v_actor_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el tutor asignado al proyecto puede evaluar evidencias';
  END IF;

  IF v_submission.status != 'submitted' THEN
    RAISE EXCEPTION 'La entrega no se encuentra en estado pendiente (estado actual: %)', v_submission.status;
  END IF;

  IF p_decision NOT IN ('approved', 'changes_requested') THEN
    RAISE EXCEPTION 'Decisión inválida. Debe ser approved o changes_requested';
  END IF;

  IF p_decision = 'changes_requested' AND (p_feedback IS NULL OR trim(p_feedback) = '') THEN
    RAISE EXCEPTION 'Debe registrar retroalimentación detallada para solicitar cambios';
  END IF;

  v_task_id := v_submission.task_id;
  v_project_id := v_submission.project_id;

  -- Update submission
  UPDATE public.evidence_submissions
  SET
    status = p_decision,
    reviewed_by = v_actor_id,
    reviewed_at = now(),
    review_feedback = COALESCE(p_feedback, '')
  WHERE id = p_submission_id;

  -- Update task status
  UPDATE public.academic_tasks
  SET status = p_decision
  WHERE id = v_task_id;

  -- If approved, check if all tasks in stage are approved to validate stage
  IF p_decision = 'approved' THEN
    SELECT stage_id INTO v_stage_id FROM public.academic_tasks WHERE id = v_task_id;
    SELECT route_version_id, order_no INTO v_route_version_id, v_current_order 
    FROM public.route_stages WHERE id = v_stage_id;

    -- Check if any remaining task in this stage requires approval and is not approved
    SELECT NOT EXISTS (
      SELECT 1 FROM public.academic_tasks 
      WHERE stage_id = v_stage_id AND requires_approval = true AND status != 'approved'
    ) INTO v_all_stage_tasks_approved;

    IF v_all_stage_tasks_approved THEN
      -- Validate current stage
      UPDATE public.route_stages SET status = 'validated' WHERE id = v_stage_id;

      -- Unlock next sequential stage
      SELECT id INTO v_next_stage_id
      FROM public.route_stages
      WHERE route_version_id = v_route_version_id AND order_no = v_current_order + 1;

      IF v_next_stage_id IS NOT NULL THEN
        UPDATE public.route_stages SET status = 'available' WHERE id = v_next_stage_id;
        
        -- Activate first task of next stage
        UPDATE public.academic_tasks
        SET status = 'in_progress'
        WHERE stage_id = v_next_stage_id AND order_no = 1 AND status = 'pending';
      END IF;
    END IF;
  END IF;

  -- Audit log
  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    'EVIDENCE_' || upper(p_decision),
    'evidence_submissions',
    p_submission_id,
    jsonb_build_object(
      'task_id', v_task_id,
      'project_id', v_project_id,
      'decision', p_decision,
      'reviewed_at', now()
    )
  );

  -- Receipt
  IF p_request_key IS NOT NULL THEN
    INSERT INTO public.operation_receipts (request_key, actor_id, operation, result_ref)
    VALUES (p_request_key, v_actor_id, 'review_evidence', p_submission_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', p_submission_id,
    'decision', p_decision
  );
END;
$$;

-- 5. ADMIN ASSIGN TUTOR
CREATE OR REPLACE FUNCTION public.admin_assign_tutor(
  p_project_id UUID,
  p_tutor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_old_tutor_id UUID;
  v_project RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores institucionales pueden asignar o modificar directores de tesis';
  END IF;

  -- Verify tutor exists, is active and has tutor or admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_tutor_id AND role IN ('tutor', 'admin') AND active = true
  ) THEN
    RAISE EXCEPTION 'El usuario seleccionado no tiene rol docente/tutor activo';
  END IF;

  SELECT id, tutor_id, status INTO v_project
  FROM public.research_projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proyecto no encontrado';
  END IF;

  v_old_tutor_id := v_project.tutor_id;

  -- Update tutor on project
  UPDATE public.research_projects
  SET
    tutor_id = p_tutor_id,
    status = CASE WHEN status = 'awaiting_tutor' THEN 'agreements' ELSE status END,
    updated_at = now()
  WHERE id = p_project_id;

  -- Record event
  INSERT INTO public.tutor_assignment_events (
    project_id,
    old_tutor_id,
    new_tutor_id,
    actor_id
  )
  VALUES (
    p_project_id,
    v_old_tutor_id,
    p_tutor_id,
    v_actor_id
  );

  -- Audit log
  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    'TUTOR_ASSIGNED',
    'research_projects',
    p_project_id,
    jsonb_build_object(
      'old_tutor_id', v_old_tutor_id,
      'new_tutor_id', p_tutor_id,
      'assigned_at', now()
    )
  );

  RETURN jsonb_build_object('success', true, 'project_id', p_project_id, 'new_tutor_id', p_tutor_id);
END;
$$;

-- 6. ADMIN PROMOTE USER
CREATE OR REPLACE FUNCTION public.admin_promote_user(
  p_target_id UUID,
  p_new_role TEXT,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_prev_role TEXT;
  v_admin_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede promover o reasignar roles';
  END IF;

  IF p_new_role NOT IN ('student', 'tutor', 'admin') THEN
    RAISE EXCEPTION 'Rol destino inválido';
  END IF;

  SELECT role INTO v_prev_role
  FROM public.profiles
  WHERE id = p_target_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario objetivo no encontrado';
  END IF;

  -- Ensure we never eliminate the last active administrator
  IF v_prev_role = 'admin' AND p_new_role != 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin' AND active = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Operación rechazada: no es posible revocar el rol al último administrador activo del sistema';
    END IF;
  END IF;

  -- Update role
  UPDATE public.profiles
  SET role = p_new_role, updated_at = now()
  WHERE id = p_target_id;

  -- Record assignment
  INSERT INTO public.role_assignments (
    actor_id,
    target_id,
    previous_role,
    new_role,
    reason
  )
  VALUES (
    v_actor_id,
    p_target_id,
    v_prev_role,
    p_new_role,
    COALESCE(p_reason, 'Promoción autorizada por administración')
  );

  -- Audit log
  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    'ROLE_PROMOTED',
    'profiles',
    p_target_id,
    jsonb_build_object(
      'previous_role', v_prev_role,
      'new_role', p_new_role,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object('success', true, 'target_id', p_target_id, 'new_role', p_new_role);
END;
$$;
