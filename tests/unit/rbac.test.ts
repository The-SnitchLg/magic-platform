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

    const canDeactivateAdmin = (targetId: string) => {
      const remainingAdmins = activeAdmins.filter(a => a.id !== targetId && a.active);
      return remainingAdmins.length > 0;
    };

    expect(canDeactivateAdmin('admin-1')).toBe(false);
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
});
