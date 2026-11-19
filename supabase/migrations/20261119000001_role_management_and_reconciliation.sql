-- ==============================================================================
-- MAGIC PLATFORM — Migration: Role Management, Admin Protection & Reconciliation
-- Version: 7.1 (November 2026)
-- ==============================================================================

-- 1. Reconcile existing auth.users missing application profiles
INSERT INTO public.profiles (
  id,
  email_display,
  display_name,
  role,
  active,
  must_change_password
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_app_meta_data->>'role', 'student'),
  true,
  false
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure every student has an associated research project
INSERT INTO public.research_projects (
  student_id,
  title,
  status
)
SELECT
  p.id,
  'Proyecto de Tesis Doctoral · ' || p.display_name,
  'awaiting_tutor'
FROM public.profiles p
LEFT JOIN public.research_projects rp ON rp.student_id = p.id
WHERE p.role = 'student' AND rp.id IS NULL
ON CONFLICT DO NOTHING;

-- 3. Database-level trigger to strictly prohibit removing or deactivating the last active admin
CREATE OR REPLACE FUNCTION public.check_admin_protection()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_count INT;
BEGIN
  IF OLD.role = 'admin' AND (NEW.role != 'admin' OR NEW.active = false) THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles
    WHERE role = 'admin' AND active = true AND id != OLD.id;

    IF v_admin_count < 1 THEN
      RAISE EXCEPTION 'Operación rechazada: no es posible revocar el rol ni desactivar al último administrador activo del sistema';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_last_admin'
  ) THEN
    CREATE TRIGGER trg_protect_last_admin
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.check_admin_protection();
  END IF;
END $$;

-- 4. Server-enforced account toggle function
CREATE OR REPLACE FUNCTION public.admin_toggle_user_active(p_target_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_target RECORD;
  v_new_active BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo un administrador puede modificar el estado de activación de cuentas';
  END IF;

  SELECT id, role, active INTO v_target
  FROM public.profiles
  WHERE id = p_target_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario objetivo no encontrado';
  END IF;

  v_new_active := NOT v_target.active;

  UPDATE public.profiles
  SET active = v_new_active, updated_at = now()
  WHERE id = p_target_id;

  INSERT INTO public.audit_events (actor_id, event_type, entity, entity_id, safe_metadata)
  VALUES (
    v_actor_id,
    CASE WHEN v_new_active THEN 'USER_ACTIVATED' ELSE 'USER_DEACTIVATED' END,
    'profiles',
    p_target_id,
    jsonb_build_object('active', v_new_active, 'timestamp', now())
  );

  RETURN jsonb_build_object('success', true, 'target_id', p_target_id, 'active', v_new_active);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_toggle_user_active(UUID) TO authenticated;

-- 5. Enhanced handle_new_user trigger supporting role metadata & idempotent upsert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT := 'student';
BEGIN
  IF NEW.raw_app_meta_data->>'role' IN ('tutor', 'admin') THEN
    v_role := NEW.raw_app_meta_data->>'role';
  END IF;

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
    v_role,
    true,
    COALESCE((NEW.raw_app_meta_data->>'must_change_password')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email_display = EXCLUDED.email_display,
    display_name = CASE WHEN public.profiles.display_name = '' THEN EXCLUDED.display_name ELSE public.profiles.display_name END;

  IF v_role = 'student' THEN
    IF NOT EXISTS (SELECT 1 FROM public.research_projects WHERE student_id = NEW.id) THEN
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
