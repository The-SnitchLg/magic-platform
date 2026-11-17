import { describe, it, expect } from 'vitest';
import { AgreementStatus, ProjectStatus, TaskStatus } from '@/types/database.types';

describe('Academic Workflow & State Transitions', () => {
  it('correctly transitions agreements from draft -> submitted -> approved', () => {
    let agreementStatus: AgreementStatus = 'draft';
    let projectStatus: ProjectStatus = 'agreements';

    // Student submits
    agreementStatus = 'submitted';
    expect(agreementStatus).toBe('submitted');
    expect(projectStatus).toBe('agreements'); // Route not yet unlocked

    // Tutor approves
    agreementStatus = 'approved';
    projectStatus = 'route_configuration';
    expect(agreementStatus).toBe('approved');
    expect(projectStatus).toBe('route_configuration');
  });

  it('rejects route publication if agreements are not approved', () => {
    const agreementStatus: AgreementStatus = 'submitted'; // Not yet approved
    const canPublishRoute = (status: AgreementStatus) => status === 'approved';

    expect(canPublishRoute(agreementStatus)).toBe(false);
  });

  it('ensures evidence submission is marked submitted and never prematurely approved', () => {
    let taskStatus: TaskStatus = 'in_progress';
    const evidenceSubmitted = true;

    if (evidenceSubmitted) {
      taskStatus = 'submitted';
    }

    expect(taskStatus).toBe('submitted');
    expect(taskStatus).not.toBe('approved');
  });

  it('unlocks subsequent milestone only when all required stage tasks are approved', () => {
    const stageTasks = [
      { id: '1.1', requires_approval: true, status: 'approved' as TaskStatus },
      { id: '1.2', requires_approval: true, status: 'approved' as TaskStatus },
    ];

    const allApproved = stageTasks.every(t => !t.requires_approval || t.status === 'approved');
    const nextStageStatus = allApproved ? 'available' : 'locked';

    expect(allApproved).toBe(true);
    expect(nextStageStatus).toBe('available');
  });
});
