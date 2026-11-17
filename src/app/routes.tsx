import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/shared/AppShell';

import { AuthPage } from '@/features/auth/AuthPage';
import { StudentWorkspace } from '@/features/student/StudentWorkspace';
import { StudentAgreements } from '@/features/student/StudentAgreements';
import { StudentRoute } from '@/features/student/StudentRoute';
import { StudentTasks } from '@/features/student/StudentTasks';

import { TutorDashboard } from '@/features/tutor/TutorDashboard';
import { TutorInbox } from '@/features/tutor/TutorInbox';
import { TutorRouteEditor } from '@/features/tutor/TutorRouteEditor';

import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { AdminUsers } from '@/features/admin/AdminUsers';
import { AdminAssignments } from '@/features/admin/AdminAssignments';
import { AdminAudit } from '@/features/admin/AdminAudit';

export const AppRoutes: React.FC = () => {
  const { profile, loading, viewMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151311] flex items-center justify-center text-[#dcc1b9] text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c05c3d] border-t-transparent rounded-full animate-spin"></div>
          <span className="font-serif italic">Cargando plataforma académica MAGIC...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and in live Supabase mode, redirect to /acceso
  // Note: if user is null and no dev profile exists, render AuthPage
  if (!profile) {
    return (
      <Routes>
        <Route path="/acceso" element={<AuthPage />} />
        <Route path="/registro" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/acceso" replace />} />
      </Routes>
    );
  }

  const roleHome =
    viewMode === 'admin'
      ? '/administracion'
      : viewMode === 'tutor'
      ? '/tutor'
      : '/estudiante';

  return (
    <Routes>
      <Route path="/acceso" element={<Navigate to={roleHome} replace />} />
      <Route path="/registro" element={<Navigate to={roleHome} replace />} />

      {/* Index Redirect to appropriate space */}
      <Route path="/" element={<Navigate to={roleHome} replace />} />

      {/* STUDENT ROUTES */}
      <Route
        path="/estudiante"
        element={
          <AppShell>
            <StudentWorkspace />
          </AppShell>
        }
      />
      <Route
        path="/estudiante/acuerdos"
        element={
          <AppShell>
            <StudentAgreements />
          </AppShell>
        }
      />
      <Route
        path="/estudiante/ruta"
        element={
          <AppShell>
            <StudentRoute />
          </AppShell>
        }
      />
      <Route
        path="/estudiante/tareas"
        element={
          <AppShell>
            <StudentTasks />
          </AppShell>
        }
      />

      {/* TUTOR ROUTES */}
      <Route
        path="/tutor"
        element={
          <AppShell>
            <TutorDashboard />
          </AppShell>
        }
      />
      <Route
        path="/tutor/bandeja"
        element={
          <AppShell>
            <TutorInbox />
          </AppShell>
        }
      />
      <Route
        path="/tutor/editor-ruta"
        element={
          <AppShell>
            <TutorRouteEditor />
          </AppShell>
        }
      />
      <Route
        path="/tutor/estudiantes"
        element={
          <AppShell>
            <TutorDashboard />
          </AppShell>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/administracion"
        element={
          <AppShell>
            <AdminDashboard />
          </AppShell>
        }
      />
      <Route
        path="/administracion/usuarios"
        element={
          <AppShell>
            <AdminUsers />
          </AppShell>
        }
      />
      <Route
        path="/administracion/asignaciones"
        element={
          <AppShell>
            <AdminAssignments />
          </AppShell>
        }
      />
      <Route
        path="/administracion/catalogo"
        element={
          <AppShell>
            <TutorRouteEditor />
          </AppShell>
        }
      />
      <Route
        path="/administracion/auditoria"
        element={
          <AppShell>
            <AdminAudit />
          </AppShell>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
