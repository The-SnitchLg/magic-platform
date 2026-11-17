import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Upload
} from 'lucide-react';

export const StudentWorkspace: React.FC = () => {
  const { profile } = useAuth();
  
  // State representation for the student dossier
  const [hasTutor] = useState(true); // Can be toggled or fetched from Supabase
  const [agreementStatus] = useState<'draft' | 'submitted' | 'approved'>('submitted');
  const [hasPublishedRoute] = useState(true);

  if (!hasTutor) {
    return (
      <div className="space-y-6">
        <header className="border-b border-[#2c2a27] pb-4">
          <h1 className="font-serif text-3xl text-[#faf8f5]">Mi Proyecto de Investigación</h1>
          <p className="text-sm text-[#a48b84]">Expediente de Candidatura Doctoral</p>
        </header>

        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-8 text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-14 h-14 bg-[#b38a37]/20 text-[#c49a45] rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-[#faf8f5]">
            Asignación de Tutor Pendiente
          </h2>
          <p className="text-sm text-[#dcc1b9] leading-relaxed">
            Su expediente se encuentra formalmente registrado. La coordinación académica está procesando la asignación de su Director de Tesis. Una vez formalizada la vinculación, se habilitará la redacción del Acta de Acuerdos Iniciales.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2c2a27] text-xs text-[#a48b84]">
              <span className="w-2 h-2 rounded-full bg-[#c49a45] animate-pulse"></span>
              En espera de designación por secretaría técnica
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Encabezado Editorial del Expediente */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#2c2a27]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#a48b84]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c05c3d]"></span>
            <span>Expediente Doctoral Activo • Plan Curricular 2026-I</span>
            <span>•</span>
            <span className="text-[#8cb89f] font-semibold">Inscrito</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#faf8f5] tracking-tight max-w-4xl">
            Modelos Semánticos en Biociencias & Extracción Genómica
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-[#dcc1b9]">
            <span>
              Candidato: <strong className="text-white">{profile?.display_name || 'Mateo Restrepo Gaviria'}</strong>
            </span>
            <span>•</span>
            <span>
              Director: <strong className="text-white">Dr. Carlos Gutiérrez M.</strong>
            </span>
            <span>•</span>
            <span>
              Línea: <span className="italic">Epistemología & Bioinformática</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-end">
          <Link
            to="/estudiante/acuerdos"
            className="px-4 py-2 rounded bg-[#252220] hover:bg-[#2c2a27] text-white text-xs font-semibold border border-[#373432] transition-colors"
          >
            Consultar Acuerdos
          </Link>
          <Link
            to="/estudiante/tareas"
            className="px-4 py-2 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
          >
            <span>Ver Tareas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Compromiso Prioritario Banner */}
      <section className="relative overflow-hidden rounded-xl bg-[#1d1b19] border border-[#2c2a27] p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow">
        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-lg bg-[#dd7252]/20 flex items-center justify-center shrink-0 text-[#c05c3d]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#c05c3d]/20 text-[#ffb59f] text-[11px] uppercase tracking-wider font-semibold">
                Compromiso Prioritario C09
              </span>
              <span className="text-xs text-[#a48b84]">• Entrega Ordinaria de Hito</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl text-[#faf8f5]">
              Capítulo II: Protocolo de Muestreo y Validación de Instrumentos
            </h2>
            <p className="text-xs sm:text-sm text-[#dcc1b9] max-w-2xl">
              Plazo normativo para la remisión del protocolo metodológico con el plan de muestreo y dictamen de jueces expertos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10 shrink-0 border-t md:border-t-0 md:border-l border-[#2c2a27] pt-4 md:pt-0 md:pl-8">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#a48b84]">Fecha Límite</span>
            <span className="block text-sm font-bold text-white">22 de Mayo, 2026</span>
            <span className="text-[11px] text-[#dfbe76] flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Quedan 14 días hábiles
            </span>
          </div>
          <Link
            to="/estudiante/tareas"
            className="px-4 py-2.5 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow transition-all flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Depositar Evidencia</span>
          </Link>
        </div>
      </section>

      {/* Tarjetas Métricas de Estado (Folio Pergamino Claro + Paneles) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pergamino Claro */}
        <div className="document-sheet rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#686058]">
                Madurez de la Investigación
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#2d5a3f]/15 text-[#2d5a3f]">
                Etapa 2 de 4
              </span>
            </div>
            <div>
              <span className="font-serif text-3xl font-semibold text-[#1e1c1a]">40%</span>
              <p className="text-xs text-[#57534e] mt-1 leading-relaxed">
                2 de 5 actividades curriculares aprobadas formalmente por la dirección.
              </p>
            </div>
          </div>
          <div className="w-full bg-[#ede8e1] h-1.5 rounded mt-4 overflow-hidden">
            <div className="bg-[#2d5a3f] h-full w-[40%]"></div>
          </div>
        </div>

        {/* Card 2: Estado de Acuerdos */}
        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a48b84]">
                Acuerdos Iniciales
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#2d5a3f]/20 text-[#8cb89f]">
                {agreementStatus === 'approved' ? 'Aprobados' : 'Consensuados'}
              </span>
            </div>
            <div>
              <span className="font-serif text-xl font-semibold text-[#faf8f5]">Acta Concertada 1.2</span>
              <p className="text-xs text-[#a48b84] mt-1">
                Concertación inicial con el Dr. Carlos Gutiérrez avalada el 15/02/2026.
              </p>
            </div>
          </div>
          <Link
            to="/estudiante/acuerdos"
            className="text-xs text-[#c05c3d] hover:underline font-semibold flex items-center gap-1 mt-4"
          >
            <span>Ver acta completa</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 3: Ruta Publicada */}
        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a48b84]">
                Ruta Personalizada
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#2c2a27] text-[#dfbe76]">
                {hasPublishedRoute ? 'Versión 1.0 Activa' : 'En Preparación'}
              </span>
            </div>
            <div>
              <span className="font-serif text-xl font-semibold text-[#faf8f5]">Itinerario Doctoral</span>
              <p className="text-xs text-[#a48b84] mt-1">
                Ruta adaptada por el tutor con 4 etapas y compuertas colegiadas explícitas.
              </p>
            </div>
          </div>
          <Link
            to="/estudiante/ruta"
            className="text-xs text-[#c05c3d] hover:underline font-semibold flex items-center gap-1 mt-4"
          >
            <span>Explorar mapa de ruta</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
