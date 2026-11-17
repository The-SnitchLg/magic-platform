import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Inbox,
  GitBranch,
  Search,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface StudentDossier {
  id: string;
  fullName: string;
  program: string;
  projectTitle: string;
  stageLabel: string;
  pendingItems: number;
  status: 'agreements' | 'active' | 'route_configuration';
}

export const TutorDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [students] = useState<StudentDossier[]>([
    {
      id: 'stud-1',
      fullName: 'Mateo Restrepo Gaviria',
      program: 'Doctorado en Epistemología',
      projectTitle: 'Modelos Semánticos en Biociencias & Extracción Genómica',
      stageLabel: 'Etapa 2: Diseño Metodológico',
      pendingItems: 1,
      status: 'active',
    },
    {
      id: 'stud-2',
      fullName: 'Elena V. Morales',
      program: 'Doctorado en Filosofía',
      projectTitle: 'Impacto de la Economía Circular en MIPYMES Industriales',
      stageLabel: 'Etapa 1: Formalización de Acuerdos',
      pendingItems: 1,
      status: 'agreements',
    },
    {
      id: 'stud-3',
      fullName: 'Camilo Benítez R.',
      program: 'Doctorado en Ciencias Sociales',
      projectTitle: 'Modelado Estocástico y Validación Empírica en Políticas Públicas',
      stageLabel: 'Etapa 3: Análisis Multivariado',
      pendingItems: 1,
      status: 'active',
    },
  ]);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Encabezado Editorial del Despacho */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#2c2a27]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c05c3d]" />
            <span>Despacho del Director de Tesis</span>
            <span className="text-[#a48b84]">• Período Activo 2026-I</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Observatorio y Seguimiento de Tesistas
          </h1>
          <p className="text-sm text-[#dcc1b9]">
            Director:{' '}
            <strong className="text-white">
              {profile?.display_name || 'Dr. Carlos Gutiérrez M.'}
            </strong>{' '}
            • Revisión de avances, emisión de avales colegiados y personalización de rutas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tutor/bandeja"
            className="px-4 py-2 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow flex items-center gap-2 transition-all"
          >
            <Inbox className="w-4 h-4" />
            <span>Bandeja de Decisiones (3 Pendientes)</span>
          </Link>
        </div>
      </header>

      {/* Contadores Prioritarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
                Atención Crítica
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-4xl font-semibold text-[#ffb59f]">03</span>
                <span className="text-xs text-[#a48b84]">asuntos inmediatos</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#dd7252]/20 text-[#c05c3d] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 border-t border-[#2c2a27] text-xs text-[#dcc1b9] space-y-1">
            <div>• 1 Acuerdo inicial por suscribir</div>
            <div>• 2 Evidencias capitulares por dictaminar</div>
          </div>
        </div>

        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
                Tesistas Asignados
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-4xl font-semibold text-[#faf8f5]">
                  {students.length}
                </span>
                <span className="text-xs text-[#a48b84]">candidatos en cohorte</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#2c2a27] text-[#8cb89f] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 border-t border-[#2c2a27] text-xs text-[#8cb89f] flex items-center gap-1 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>100% de expedientes al día</span>
          </div>
        </div>

        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
                Rutas Configuradas
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-serif text-4xl font-semibold text-[#dfbe76]">02</span>
                <span className="text-xs text-[#a48b84]">publicadas activas</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#b38a37]/20 text-[#c49a45] flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-4 border-t border-[#2c2a27] text-xs text-[#a48b84]">
            <span>1 expediente pendiente de acuerdos para habilitar ruta</span>
          </div>
        </div>
      </div>

      {/* Listado de Tesistas Asignados */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#a48b84] font-bold block">
              Censo Doctoral a Cargo
            </span>
            <h2 className="font-serif text-2xl text-[#faf8f5]">
              Expedientes en Seguimiento Activo
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tesista o título..."
              className="w-full pl-9 pr-3 py-2 bg-[#211f1d] rounded-lg text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="bg-[#211f1d] border border-[#2c2a27] p-8 rounded-xl text-center text-sm text-[#a48b84]">
            No se encontraron expedientes que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredStudents.map((stud) => (
              <div
                key={stud.id}
                className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-[#373432] transition-colors shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c05c3d]">
                      {stud.program}
                    </span>
                    {stud.pendingItems > 0 && (
                      <span className="px-2 py-0.5 rounded bg-[#dd7252]/20 text-[#ffb59f] text-[10px] font-bold">
                        {stud.pendingItems} pendiente
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#faf8f5]">
                    {stud.fullName}
                  </h3>
                  <p className="text-xs text-[#dcc1b9] line-clamp-2 leading-relaxed">
                    {stud.projectTitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2c2a27] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#a48b84]">{stud.stageLabel}</span>
                  <Link
                    to="/tutor/bandeja"
                    className="text-[#c05c3d] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Revisar</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
