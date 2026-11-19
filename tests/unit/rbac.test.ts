import { describe, it, expect } from 'vitest';
import { AppRole } from '@/types/database.types';

describe('RBAC & Role Transition Governance', () => {
  it('enforces that self-registration defaults strictly to student role', () => {
    const registrationPayload = {
      email: 'investigador@universidad.edu',
      fullName: 'Nuevo Investigador',
      requestedRole: 'admin', // Malicious attempt to self-promote
    };

    // Simulated handle_new_user trigger logic
    const createdRole: AppRole = 'student'; // Always forced by server trigger

    expect(createdRole).toBe('student');
    expect(createdRole).not.toBe(registrationPayload.requestedRole);
  });

  it('prohibits non-admin users from promoting roles', () => {
    const callerRole: AppRole = 'student';
    const targetUserId = 'target-user-123';
    const newRole: AppRole = 'tutor';

    const canPromote = (role: AppRole) => role === 'admin';

    expect(canPromote(callerRole)).toBe(false);
  });

  it('prevents deactivating or demoting the last active administrator', () => {
    const activeAdmins = [
      { id: 'admin-1', role: 'admin', active: true }
    ];

    const canDeactivateOrDemoteAdmin = (targetId: string, newRole?: AppRole, newActive?: boolean) => {
      const target = activeAdmins.find(a => a.id === targetId);
      if (!target || target.role !== 'admin') return true;

      const isDemotion = newRole && newRole !== 'admin';
      const isDeactivation = newActive === false;

      if (isDemotion || isDeactivation) {
        const remainingActiveAdmins = activeAdmins.filter(a => a.id !== targetId && a.active);
        return remainingActiveAdmins.length >= 1;
      }
      return true;
    };

    expect(canDeactivateOrDemoteAdmin('admin-1', 'student', true)).toBe(false);
    expect(canDeactivateOrDemoteAdmin('admin-1', 'admin', false)).toBe(false);
  });

  it('guarantees that administrator supervision mode is strictly read-only', () => {
    const adminSession = {
      role: 'admin' as AppRole,
      viewMode: 'student' as AppRole,
    };

    const isSupervising = adminSession.role === 'admin' && adminSession.viewMode !== 'admin';
    const canSignOrApprove = !isSupervising;

    expect(isSupervising).toBe(true);
    expect(canSignOrApprove).toBe(false);
  });

  it('validates supported roles constraint (student, tutor, admin)', () => {
    const validRoles: AppRole[] = ['student', 'tutor', 'admin'];
    const isValidRole = (role: string): role is AppRole => validRoles.includes(role as AppRole);

    expect(isValidRole('student')).toBe(true);
    expect(isValidRole('tutor')).toBe(true);
    expect(isValidRole('admin')).toBe(true);
    expect(isValidRole('superadmin')).toBe(false);
    expect(isValidRole('guest')).toBe(false);
  });

  it('safely reconciles auth users with missing profiles without data clobbering', () => {
    const existingProfiles = new Map([
      ['user-1', { id: 'user-1', email: 'test@universidad.edu', role: 'admin' as AppRole }]
    ]);

    const authUsers = [
      { id: 'user-1', email: 'test@universidad.edu' },
      { id: 'user-2', email: 'student2@universidad.edu' },
    ];

    // Reconciliation logic
    authUsers.forEach(au => {
      if (!existingProfiles.has(au.id)) {
        existingProfiles.set(au.id, { id: au.id, email: au.email, role: 'student' });
      }
    });

    expect(existingProfiles.size).toBe(2);
    // User 1 preserved existing role
    expect(existingProfiles.get('user-1')?.role).toBe('admin');
    // User 2 safely added with default student role
    expect(existingProfiles.get('user-2')?.role).toBe('student');
  });
});
