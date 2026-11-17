// ==============================================================================
// MAGIC PLATFORM — Edge Function: manage-user
// Protected User Provisioning & Role Management
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Create client with caller's authorization header to verify identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Falta cabecera de autorización' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sesión no válida o expirada' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller has 'admin' role in profiles table
    const { data: callerProfile, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single();

    if (profileCheckError || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.active) {
      return new Response(JSON.stringify({ error: 'Acceso denegado: se requieren privilegios de administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, email, targetRole, temporaryPassword, fullName, targetUserId, reason } = body;

    if (action === 'provision') {
      if (!email || !targetRole || !['tutor', 'admin'].includes(targetRole)) {
        return new Response(JSON.stringify({ error: 'Parámetros inválidos. Se requiere email y targetRole (tutor|admin)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already exists
      const { data: listData } = await adminClient.auth.admin.listUsers();
      const existingUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        // User exists: promote profile instead of duplicating
        const { error: promoteError } = await adminClient.rpc('admin_promote_user', {
          p_target_id: existingUser.id,
          p_new_role: targetRole,
          p_reason: reason || 'Promoción de cuenta existente desde panel de administración'
        });

        if (promoteError) {
          return new Response(JSON.stringify({ error: promoteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          promoted: true,
          userId: existingUser.id,
          message: `Cuenta existente promovida al rol '${targetRole}' satisfactoriamente.`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // New user creation
      if (!temporaryPassword || temporaryPassword.length < 8) {
        return new Response(JSON.stringify({ error: 'La contraseña temporal debe tener al menos 8 caracteres' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split('@')[0],
        },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Set profile role to targetRole
      await adminClient
        .from('profiles')
        .update({
          role: targetRole,
          display_name: fullName || email.split('@')[0],
          must_change_password: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', newUserData.user.id);

      // Audit log
      await adminClient.from('audit_events').insert({
        actor_id: user.id,
        event_type: 'USER_PROVISIONED',
        entity: 'profiles',
        entity_id: newUserData.user.id,
        safe_metadata: {
          assigned_role: targetRole,
          email_domain: email.split('@')[1],
          created_at: new Date().toISOString()
        }
      });

      return new Response(JSON.stringify({
        success: true,
        userId: newUserData.user.id,
        message: `Usuario creado con éxito con rol '${targetRole}'.`
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle_active') {
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: 'Falta targetUserId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: targetProfile } = await adminClient
        .from('profiles')
        .select('role, active')
        .eq('id', targetUserId)
        .single();

      if (!targetProfile) {
        return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prevent deactivating last admin
      if (targetProfile.role === 'admin' && targetProfile.active) {
        const { count } = await adminClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')
          .eq('active', true);

        if ((count || 0) <= 1) {
          return new Response(JSON.stringify({ error: 'No es posible desactivar al único administrador activo' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const newActive = !targetProfile.active;
      await adminClient
        .from('profiles')
        .update({ active: newActive, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      await adminClient.from('audit_events').insert({
        actor_id: user.id,
        event_type: newActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entity: 'profiles',
        entity_id: targetUserId,
        safe_metadata: { timestamp: new Date().toISOString() }
      });

      return new Response(JSON.stringify({
        success: true,
        active: newActive
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Acción no soportada' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
