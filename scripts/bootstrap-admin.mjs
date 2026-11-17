#!/usr/bin/env node

/**
 * ==============================================================================
 * MAGIC PLATFORM — Initial Administrator Bootstrap Script (Isolated Runtime)
 * ==============================================================================
 * 
 * MANDATORY CREDENTIAL CONFIDENTIALITY POLICY:
 * This script strictly reads administrator credentials from secure runtime
 * environment variables (e.g. injected at execution time or from a secret manager).
 * No emails, passwords, tokens, or hashes are ever hardcoded or printed to stdout/stderr.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31m[ERROR] Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided.\x1b[0m');
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\x1b[31m[ERROR] Missing administrator credentials: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be provided via secure runtime input.\x1b[0m');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function bootstrapAdmin() {
  console.log('\x1b[34m[BOOTSTRAP] Connecting to isolated Supabase instance...\x1b[0m');

  // 1. Check if user already exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('\x1b[31m[ERROR] Failed to communicate with Supabase Auth Admin API:\x1b[0m', listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  let targetUserId;

  if (existingUser) {
    targetUserId = existingUser.id;
    console.log('\x1b[33m[BOOTSTRAP] User account already exists in Auth. Updating password and promoting to admin role...\x1b[0m');
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(targetUserId, {
      password: ADMIN_PASSWORD,
      email_confirm: true
    });
    if (updateAuthError) {
      console.error('\x1b[31m[ERROR] Failed to update Auth credentials:\x1b[0m', updateAuthError.message);
      process.exit(1);
    }
  } else {
    console.log('\x1b[34m[BOOTSTRAP] Provisioning new administrator user in Supabase Auth...\x1b[0m');
    const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador Institucional'
      }
    });

    if (createError) {
      console.error('\x1b[31m[ERROR] Failed to create administrator user:\x1b[0m', createError.message);
      process.exit(1);
    }
    targetUserId = createdData.user.id;
  }

  // 2. Set profile role to 'admin' and mark must_change_password
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: targetUserId,
      email_display: ADMIN_EMAIL,
      display_name: 'Administrador Institucional',
      role: 'admin',
      active: true,
      must_change_password: true,
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('\x1b[31m[ERROR] Failed to update administrator profile:\x1b[0m', profileError.message);
    process.exit(1);
  }

  // 3. Log audit event
  await supabase.from('audit_events').insert({
    actor_id: targetUserId,
    event_type: 'INITIAL_ADMIN_BOOTSTRAP',
    entity: 'profiles',
    entity_id: targetUserId,
    safe_metadata: {
      action: 'bootstrap_completed',
      timestamp: new Date().toISOString()
    }
  });

  console.log('\x1b[32m[BOOTSTRAP SUCCESS] Initial administrator provisioned successfully with role="admin".\x1b[0m');
  console.log('\x1b[32m[SECURITY POLICY] Credentials were processed in volatile memory only and NOT persisted to disk or logs.\x1b[0m');
}

bootstrapAdmin().catch(err => {
  console.error('\x1b[31m[FATAL] Bootstrap exception occurred:\x1b[0m', err.message);
  process.exit(1);
});
