import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Users,
  CheckCircle,
  AlertCircle,
  UserPlus,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface ProjectRow {
  id: string;
  title: string;
  status: string;
  student_id: string;
  tutor_id: string | null;
  student?: {
    id: string;
    display_name: string;
    email_display: string;
  };
  tutor?: {
    id: string;
    display_name: string;
    email_display: string;
  } | null;
  program?: {
    name: string;
  } | null;
}

interface TutorOption {
  id: string;
  name: string;
  email: string;
}

export const AdminAssignments: React.FC = () => {
  const { isSupervising } = useAuth();

  const [tutors, setTutors] = useState<TutorOption[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const notify = (text: string, isError = false) => {
    setNotification({ text, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setTutors([
          { id: 'tut-1', name: 'Dr. Carlos Gutiérrez M.', email: 'carlos.gutierrez@universidad.edu' },
          { id: 'tut-2', name: 'Dra. Valeria Montes', email: 'valeria.montes@universidad.edu' },
        ]);
        setProjects([
          {
            id: 'proj-1',
            title: 'Modelos Semánticos en Biociencias & Extracción Genómica',
            status: 'active',
            student_id: 'usr-4',
            tutor_id: 'tut-1',
            student: { id: 'usr-4', display_name: 'Mateo Restrepo Gaviria', email_display: 'mateo.restrepo@universidad.edu' },
            tutor: { id: 'tut-1', display_name: 'Dr. Carlos Gutiérrez M.', email_display: 'carlos.gutierrez@universidad.edu' },
          },
        ]);
        setLoading(false);
        return;
      }

      // Fetch active tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('profiles')
        .select('id, display_name, email_display')
        .in('role', ['tutor', 'admin'])
        .eq('active', true)
        .order('display_name', { ascending: true });

      if (tutorsError) throw tutorsError;

      const formattedTutors: TutorOption[] = (tutorsData || []).map((t) => ({
        id: t.id,
        name: t.display_name || t.email_display.split('@')[0],
        email: t.email_display,
      }));
      setTutors(formattedTutors);

      // Fetch projects with student and tutor details
      const { data: projectsData, error: projectsError } = await supabase
        .from('research_projects')
        .select(`
          id,
          title,
          status,
          student_id,
          tutor_id,
          student:profiles!research_projects_student_id_fkey(id, display_name, email_display),
          tutor:profiles!research_projects_tutor_id_fkey(id, display_name, email_display)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Filter out admin dummy projects where student_id is actually an admin/tutor
      // Keep projects whose student has role 'student'
      const validProjects = ((projectsData || []) as unknown as ProjectRow[]).filter(p => p.student != null);
      setProjects(validProjects);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar asignaciones';
      notify(message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAssign = (proj: ProjectRow) => {
    if (isSupervising) return;
    setSelectedProject(proj);
    setSelectedTutorId(proj.tutor_id || tutors[0]?.id || '');
  };

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || isSupervising || !selectedTutorId) return;

    setIsSubmitting(true);
    try {
      if (!isSupabaseConfigured()) {
        const chosenTutor = tutors.find((t) => t.id === selectedTutorId);
        setProjects(projects.map((p) => p.id === selectedProject.id ? {
          ...p,
          tutor_id: selectedTutorId,
          tutor: chosenTutor ? { id: chosenTutor.id, display_name: chosenTutor.name, email_display: chosenTutor.email } : null,
          status: p.status === 'awaiting_tutor' ? 'agreements' : p.status,
        } : p));
        notify(`Director asignado exitosamente (modo local).`);
        setSelectedProject(null);
        return;
      }

      const { error } = await supabase.rpc('admin_assign_tutor', {
        p_project_id: selectedProject.id,
        p_tutor_id: selectedTutorId,
      });

      if (error) throw error;

      const chosenTutor = tutors.find((t) => t.id === selectedTutorId);
      notify(`Director ${chosenTutor?.name || ''} formalmente vinculado al proyecto.`);
      setSelectedProject(null);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al asignar director';
      notify(message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <Users className="w-3.5 h-3.5" />
            <span>Coordinación Académica</span>
            <span className="text-[#a48b84]">• Asignación de Directores de Tesis</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Vinculación Tutorial de Doctorandos
          </h1>
          <p className="text-sm text-[#dcc1b9]">
            Asignación y relevo de directores de tesis con registro histórico de eventos en la base de datos.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-2 bg-[#252220] hover:bg-[#373432] text-[#dcc1b9] text-xs font-semibold rounded border border-[#373432] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Actualizar listado de expedientes"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c05c3d]' : ''}`} />
          <span>Actualizar</span>
        </button>
      </header>

      {notification && (
        <div
          role="alert"
          className={`p-3 text-xs rounded flex items-center gap-2 transition-all ${
            notification.isError
              ? 'bg-red-900/30 border border-red-600/50 text-red-300'
              : 'bg-emerald-900/30 border border-emerald-600/50 text-emerald-300'
          }`}
        >
          {notification.isError ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Grid de Expedientes */}
      <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#181614] border-b border-[#2c2a27] flex items-center justify-between text-xs text-[#a48b84]">
          <span className="font-semibold uppercase tracking-wider">
            Expedientes de Tesis Registrados ({projects.length})
          </span>
          <span>Sincronización Autoritativa</span>
        </div>

        <div className="divide-y divide-[#2c2a27]">
          {loading ? (
            <div className="p-8 text-center text-[#a48b84] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#c05c3d]" />
              <span>Cargando expedientes y asignaciones de tesis...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-[#a48b84]">
              No hay expedientes de investigación registrados actualmente.
            </div>
          ) : (
            projects.map((proj) => {
              const hasTutor = Boolean(proj.tutor?.display_name || proj.tutor_id);
              const studentName = proj.student?.display_name || proj.student?.email_display || 'Estudiante';
              const tutorName = proj.tutor?.display_name || proj.tutor?.email_display || null;

              return (
                <div
                  key={proj.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#252220] transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#c05c3d]">
                        Expediente Oficial
                      </span>
                      <span className="text-[#56423d]">•</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          hasTutor
                            ? 'bg-[#2d5a3f]/20 text-[#8cb89f]'
                            : 'bg-[#b38a37]/20 text-[#dfbe76]'
                        }`}
                      >
                        {hasTutor ? 'Director Vinculado' : 'Asignación Pendiente'}
                      </span>
                      <span className="text-[10px] text-[#a48b84] uppercase font-mono">
                        Estado: {proj.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-base font-semibold text-[#faf8f5]">
                      {studentName}
                    </h3>
                    <p className="text-xs text-[#dcc1b9] italic">
                      «{proj.title}»
                    </p>
                    <div className="text-xs text-[#a48b84] pt-1">
                      Director asignado:{' '}
                      <strong className="text-white">
                        {tutorName || 'Pendiente de vinculación'}
                      </strong>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isSupervising}
                      onClick={() => handleOpenAssign(proj)}
                      className="px-3.5 py-2 rounded bg-[#252220] hover:bg-[#c05c3d] text-white text-xs font-semibold border border-[#373432] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{hasTutor ? 'Relevar Director' : 'Asignar Director'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Asignación */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2c2a27] pb-3">
              <span className="font-serif text-lg text-white font-semibold">
                Asignar Director de Tesis
              </span>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Cerrar modal"
                className="cursor-pointer"
              >
                <X className="w-5 h-5 text-[#a48b84] hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div className="text-xs text-[#dcc1b9] space-y-1 bg-[#181614] p-3 rounded border border-[#2c2a27]">
                <div>
                  <strong>Doctorando:</strong> {selectedProject.student?.display_name || selectedProject.student?.email_display}
                </div>
                <div>
                  <strong>Proyecto:</strong> {selectedProject.title}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a48b84]" htmlFor="tutor-select">
                  Seleccione Docente Tutor
                </label>
                <select
                  id="tutor-select"
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                  className="w-full p-2.5 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                >
                  {tutors.length === 0 ? (
                    <option value="">No hay docentes tutores activos disponibles</option>
                  ) : (
                    tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2c2a27]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedProject(null)}
                  className="px-3 py-1.5 rounded bg-[#252220] text-xs text-[#a48b84] hover:bg-[#2c2a27] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || tutors.length === 0}
                  className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Asignando...' : 'Confirmar Asignación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
