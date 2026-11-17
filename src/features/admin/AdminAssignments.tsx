import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  CheckCircle,
  UserPlus,
  X
} from 'lucide-react';

interface ProjectAssignment {
  projectId: string;
  studentName: string;
  studentEmail: string;
  program: string;
  projectTitle: string;
  tutorId: string | null;
  tutorName: string | null;
  status: string;
}

interface TutorOption {
  id: string;
  name: string;
  email: string;
}

export const AdminAssignments: React.FC = () => {
  const { isSupervising } = useAuth();

  const [tutors] = useState<TutorOption[]>([
    { id: 'tut-1', name: 'Dr. Carlos Gutiérrez M.', email: 'carlos.gutierrez@universidad.edu' },
    { id: 'tut-2', name: 'Dra. Valeria Montes', email: 'valeria.montes@universidad.edu' },
    { id: 'tut-3', name: 'Dr. Aurelio Cifuentes', email: 'aurelio.cifuentes@universidad.edu' },
  ]);

  const [projects, setProjects] = useState<ProjectAssignment[]>([
    {
      projectId: 'proj-1',
      studentName: 'Mateo Restrepo Gaviria',
      studentEmail: 'mateo.restrepo@universidad.edu',
      program: 'Doctorado en Epistemología',
      projectTitle: 'Modelos Semánticos en Biociencias & Extracción Genómica',
      tutorId: 'tut-1',
      tutorName: 'Dr. Carlos Gutiérrez M.',
      status: 'active',
    },
    {
      projectId: 'proj-2',
      studentName: 'Elena V. Morales',
      studentEmail: 'elena.morales@universidad.edu',
      program: 'Doctorado en Filosofía',
      projectTitle: 'Impacto de la Economía Circular en MIPYMES Industriales',
      tutorId: 'tut-1',
      tutorName: 'Dr. Carlos Gutiérrez M.',
      status: 'agreements',
    },
    {
      projectId: 'proj-3',
      studentName: 'Sofía Valenzuela L.',
      studentEmail: 'sofia.valenzuela@universidad.edu',
      program: 'Doctorado en Ciencias de la Educación',
      projectTitle: 'Epistemología de la Complejidad y Mediación Tecnológica',
      tutorId: null,
      tutorName: null,
      status: 'awaiting_tutor',
    },
  ]);

  const [selectedProject, setSelectedProject] = useState<ProjectAssignment | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenAssign = (proj: ProjectAssignment) => {
    if (isSupervising) return;
    setSelectedProject(proj);
    setSelectedTutorId(proj.tutorId || tutors[0]?.id || '');
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || isSupervising) return;

    const chosenTutor = tutors.find((t) => t.id === selectedTutorId);
    if (!chosenTutor) return;

    const updated = projects.map((p) => {
      if (p.projectId === selectedProject.projectId) {
        return {
          ...p,
          tutorId: chosenTutor.id,
          tutorName: chosenTutor.name,
          status: p.status === 'awaiting_tutor' ? 'agreements' : p.status,
        };
      }
      return p;
    });

    setProjects(updated);
    setNotification(
      `Director ${chosenTutor.name} formalmente asignado a ${selectedProject.studentName}.`
    );

    setSelectedProject(null);
    setTimeout(() => setNotification(null), 4000);
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
            Asignación y relevo de directores de tesis con registro histórico de eventos.
          </p>
        </div>
      </header>

      {notification && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-600/50 text-emerald-300 text-xs rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid de Expedientes */}
      <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#181614] border-b border-[#2c2a27] flex items-center justify-between text-xs text-[#a48b84]">
          <span className="font-semibold uppercase tracking-wider">
            Expedientes de Tesis en la Cohorte ({projects.length})
          </span>
          <span>Sede Central</span>
        </div>

        <div className="divide-y divide-[#2c2a27]">
          {projects.map((proj) => {
            const hasTutor = Boolean(proj.tutorName);

            return (
              <div
                key={proj.projectId}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#252220] transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c05c3d]">
                      {proj.program}
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
                  </div>

                  <h3 className="font-serif text-base font-semibold text-[#faf8f5]">
                    {proj.studentName}
                  </h3>
                  <p className="text-xs text-[#dcc1b9] italic">
                    «{proj.projectTitle}»
                  </p>
                  <div className="text-xs text-[#a48b84] pt-1">
                    Director actual:{' '}
                    <strong className="text-white">
                      {proj.tutorName || 'No asignado'}
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
          })}
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
              <button onClick={() => setSelectedProject(null)} aria-label="Cerrar modal">
                <X className="w-5 h-5 text-[#a48b84] hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div className="text-xs text-[#dcc1b9] space-y-1 bg-[#181614] p-3 rounded border border-[#2c2a27]">
                <div>
                  <strong>Doctorando:</strong> {selectedProject.studentName}
                </div>
                <div>
                  <strong>Programa:</strong> {selectedProject.program}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a48b84]">
                  Seleccione Docente Tutor
                </label>
                <select
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                  className="w-full p-2.5 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2c2a27]">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-3 py-1.5 rounded bg-[#252220] text-xs text-[#a48b84] hover:bg-[#2c2a27]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
