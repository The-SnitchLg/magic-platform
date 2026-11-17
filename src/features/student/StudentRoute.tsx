import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Check, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface StageData {
  order: number;
  title: string;
  description: string;
  status: 'validated' | 'available' | 'locked';
  tasksCount: number;
  completedTasks: number;
}

export const StudentRoute: React.FC = () => {
  const [stages] = useState<StageData[]>([
    {
      order: 1,
      title: 'Delimitación Problemática y Marco Teórico',
      description: 'Consolidación del estado del arte, formulación de preguntas rectoras y justificación epistemológica.',
      status: 'validated',
      tasksCount: 2,
      completedTasks: 2,
    },
    {
      order: 2,
      title: 'Diseño Metodológico y Calibración Empírica',
      description: 'Definición del universo de muestreo, operacionalización de variables y diseño de instrumentos.',
      status: 'available',
      tasksCount: 2,
      completedTasks: 1,
    },
    {
      order: 3,
      title: 'Trabajo de Campo y Análisis Multivariado',
      description: 'Levantamiento de evidencias en terreno, sistematización de datos y triangulación teórica.',
      status: 'locked',
      tasksCount: 2,
      completedTasks: 0,
    },
    {
      order: 4,
      title: 'Disertación Doctoral y Manuscrito Final',
      description: 'Conclusiones, discusión epistemológica, implicaciones prácticas y redacción integral del tomo de tesis.',
      status: 'locked',
      tasksCount: 1,
      completedTasks: 0,
    },
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#dfbe76]">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Itinerario Doctoral Publicado</span>
            <span className="text-[#a48b84]">• Versión Oficial 1.0</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Ruta Académica y Compuertas Metodológicas
          </h1>
          <p className="text-sm text-[#dcc1b9] max-w-3xl">
            Secuencia canónica configurada por la dirección de tesis con dependencias de aprobación colegiada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/estudiante/tareas"
            className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all flex items-center gap-1.5"
          >
            <span>Ir a Tareas y Entregas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Visual Step Roadmap */}
      <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 space-y-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#c05c3d]" />
            <span className="text-sm font-semibold text-[#faf8f5]">
              Progreso General del Itinerario
            </span>
          </div>
          <span className="text-xs font-bold text-[#8cb89f] bg-[#2d5a3f]/20 px-2.5 py-0.5 rounded">
            50% de Etapas Habilitadas
          </span>
        </div>

        {/* Timeline visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {stages.map((stage) => {
            const isValidated = stage.status === 'validated';
            const isAvailable = stage.status === 'available';

            return (
              <div
                key={stage.order}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                  isValidated
                    ? 'bg-[#181614] border-[#2d5a3f]/50'
                    : isAvailable
                    ? 'bg-[#252220] border-[#c05c3d] shadow-lg'
                    : 'bg-[#181614]/60 border-[#2c2a27] opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a48b84]">
                      Etapa 0{stage.order}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isValidated
                          ? 'bg-[#2d5a3f] text-white'
                          : isAvailable
                          ? 'bg-[#c05c3d] text-white'
                          : 'bg-[#2c2a27] text-[#a48b84]'
                      }`}
                    >
                      {isValidated ? (
                        <Check className="w-4 h-4" />
                      ) : isAvailable ? (
                        <span>0{stage.order}</span>
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-[#faf8f5] leading-snug">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-[#a48b84] leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#2c2a27] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#a48b84]">
                    {stage.completedTasks} de {stage.tasksCount} tareas aprobadas
                  </span>
                  <span
                    className={`font-semibold ${
                      isValidated
                        ? 'text-[#8cb89f]'
                        : isAvailable
                        ? 'text-[#ffb59f]'
                        : 'text-[#56423d]'
                    }`}
                  >
                    {isValidated && 'Validada'}
                    {isAvailable && 'En Curso'}
                    {stage.status === 'locked' && 'Bloqueada'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
