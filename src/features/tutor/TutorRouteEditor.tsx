import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  GitBranch,
  Plus,
  Trash2,
  Save,
  Send,
  CheckCircle,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { TemplateStage, TemplateTask } from '@/types/database.types';

export const TutorRouteEditor: React.FC = () => {
  const { isSupervising } = useAuth();

  const [selectedStudent, setSelectedStudent] = useState('Mateo Restrepo Gaviria');
  const templateName = 'Ruta Doctoral Canónica: Tesis y Candidatura';

  const [stages, setStages] = useState<TemplateStage[]>([
    {
      title: 'Etapa 1: Delimitación Problemática y Marco Teórico',
      description: 'Consolidación del estado del arte, formulación de preguntas rectoras y justificación epistemológica.',
      tasks: [
        {
          title: 'Actividad 1.1: Revisión Sistemática de Literatura y Matriz PRISMA',
          instructions: 'Presentar búsqueda documental sistemática en Scopus/WoS con protocolo PRISMA.',
          expectedResult: 'Documento monográfico de revisión con al menos 45 fuentes Q1/Q2 indexadas.',
          requires_submission: true,
          requires_approval: true,
        },
        {
          title: 'Actividad 1.2: Delimitación de Pregunta Rectora y Objetivos',
          instructions: 'Redactar pregunta central, hipótesis o presupuestos epistemológicos y objetivos.',
          expectedResult: 'Ficha capitular con marco teórico preliminar avalado.',
          requires_submission: true,
          requires_approval: true,
        },
      ],
    },
    {
      title: 'Etapa 2: Diseño Metodológico y Calibración Empírica',
      description: 'Definición del universo de muestreo, operacionalización de variables y diseño de instrumentos.',
      tasks: [
        {
          title: 'Actividad 2.1: Protocolo de Muestreo y Validación de Instrumentos',
          instructions: 'Adjuntar matriz metodológica de consistencia, plan de muestreo y dictamen de jueces.',
          expectedResult: 'Protocolo metodológico validado con coeficiente de fiabilidad.',
          requires_submission: true,
          requires_approval: true,
        },
        {
          title: 'Actividad 2.2: Aprobación Bioética y Consentimientos Informados',
          instructions: 'Remitir expediente para evaluación del comité ético de investigación institucional.',
          expectedResult: 'Dictamen de comité ético o constancia de bajo riesgo.',
          requires_submission: true,
          requires_approval: true,
        },
      ],
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handleAddStage = () => {
    if (isSupervising) return;
    const newStage: TemplateStage = {
      title: `Etapa ${stages.length + 1}: Nueva Etapa de Investigación`,
      description: 'Descripción de los objetivos epistemológicos de esta etapa.',
      tasks: [
        {
          title: 'Nueva Actividad Metodológica',
          instructions: 'Detalle de las pautas para la ejecución de esta actividad.',
          expectedResult: 'Manuscrito o evidencia empírica esperada.',
          requires_submission: true,
          requires_approval: true,
        },
      ],
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (index: number) => {
    if (isSupervising) return;
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleAddTask = (stageIndex: number) => {
    if (isSupervising) return;
    const newTask: TemplateTask = {
      title: 'Nueva Actividad Curricular',
      instructions: 'Instrucciones para el tesista...',
      expectedResult: 'Entregable exigible...',
      requires_submission: true,
      requires_approval: true,
    };

    const updated = [...stages];
    updated[stageIndex].tasks.push(newTask);
    setStages(updated);
  };

  const handleRemoveTask = (stageIndex: number, taskIndex: number) => {
    if (isSupervising) return;
    const updated = [...stages];
    updated[stageIndex].tasks.splice(taskIndex, 1);
    setStages(updated);
  };

  const handlePublish = () => {
    if (isSupervising) return;
    setShowPublishModal(false);
    setNotification('Ruta académica publicada exitosamente. Las tareas han quedado activadas en el cuaderno del estudiante.');
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Editor de Ruta por Tesista</span>
            <span className="text-[#a48b84]">• Personalización Individual</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Configurador de Itinerario Doctoral
          </h1>
          <p className="text-sm text-[#dcc1b9]">
            Ajuste de fases, tareas y compuertas colegiadas a partir de la plantilla institucional aprobada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSupervising}
            onClick={() => {
              setNotification('Borrador de ruta guardado.');
              setTimeout(() => setNotification(null), 3000);
            }}
            className="px-4 py-2 rounded bg-[#252220] hover:bg-[#2c2a27] text-white text-xs font-semibold border border-[#373432] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#c05c3d]" />
            <span>Guardar Borrador</span>
          </button>
          <button
            type="button"
            disabled={isSupervising}
            onClick={() => setShowPublishModal(true)}
            className="px-4 py-2 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publicar Ruta Definitiva</span>
          </button>
        </div>
      </header>

      {notification && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-600/50 text-emerald-300 text-xs rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Selector de Tesista y Plantilla */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#211f1d] border border-[#2c2a27] p-5 rounded-xl">
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#a48b84]">
            Tesista Asignado
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full p-2.5 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
          >
            <option value="Mateo Restrepo Gaviria">Mateo Restrepo Gaviria (Doctorado en Epistemología)</option>
            <option value="Elena V. Morales">Elena V. Morales (Doctorado en Filosofía)</option>
            <option value="Camilo Benítez R.">Camilo Benítez R. (Doctorado en Ciencias Sociales)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#a48b84]">
            Plantilla Base Institucional
          </label>
          <input
            type="text"
            readOnly
            value={templateName}
            className="w-full p-2.5 bg-[#181614] rounded text-xs text-[#a48b84] border border-[#2c2a27] cursor-not-allowed"
          />
        </div>
      </div>

      {/* Editor de Etapas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#faf8f5]">
            <Layers className="w-4 h-4 text-[#c05c3d]" />
            <span>Etapas del Itinerario ({stages.length})</span>
          </div>

          <button
            type="button"
            disabled={isSupervising}
            onClick={handleAddStage}
            className="px-3 py-1.5 rounded bg-[#252220] hover:bg-[#2c2a27] text-xs text-[#faf8f5] border border-[#373432] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 text-[#c05c3d]" />
            <span>Agregar Nueva Etapa</span>
          </button>
        </div>

        <div className="space-y-6">
          {stages.map((stage, stageIdx) => (
            <div
              key={stageIdx}
              className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 space-y-4 shadow-md"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#2c2a27] pb-3">
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c05c3d]">
                    Etapa 0{stageIdx + 1}
                  </span>
                  <input
                    type="text"
                    disabled={isSupervising}
                    value={stage.title}
                    onChange={(e) => {
                      const updated = [...stages];
                      updated[stageIdx].title = e.target.value;
                      setStages(updated);
                    }}
                    className="w-full bg-[#181614] p-2 rounded text-sm font-serif font-semibold text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                  />
                  <input
                    type="text"
                    disabled={isSupervising}
                    value={stage.description}
                    onChange={(e) => {
                      const updated = [...stages];
                      updated[stageIdx].description = e.target.value;
                      setStages(updated);
                    }}
                    placeholder="Descripción de la etapa..."
                    className="w-full bg-[#181614] p-2 rounded text-xs text-[#a48b84] border border-[#2c2a27] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isSupervising || stages.length <= 1}
                    onClick={() => handleRemoveStage(stageIdx)}
                    className="p-1.5 text-[#a48b84] hover:text-[#ffb4ab] transition-colors disabled:opacity-30"
                    title="Eliminar etapa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tareas bajo esta etapa */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-[#a48b84]">
                  <span className="font-semibold uppercase tracking-wider">Actividades Curriculares</span>
                  <button
                    type="button"
                    disabled={isSupervising}
                    onClick={() => handleAddTask(stageIdx)}
                    className="text-xs text-[#c05c3d] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir Actividad</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {stage.tasks.map((task, taskIdx) => (
                    <div
                      key={taskIdx}
                      className="bg-[#181614] p-4 rounded-lg border border-[#2c2a27] space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          disabled={isSupervising}
                          value={task.title}
                          onChange={(e) => {
                            const updated = [...stages];
                            updated[stageIdx].tasks[taskIdx].title = e.target.value;
                            setStages(updated);
                          }}
                          className="flex-1 bg-transparent text-xs font-semibold text-[#faf8f5] border-b border-transparent focus:border-[#c05c3d] focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={isSupervising}
                          onClick={() => handleRemoveTask(stageIdx, taskIdx)}
                          className="text-[#56423d] hover:text-[#ffb4ab] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <input
                          type="text"
                          disabled={isSupervising}
                          value={task.instructions}
                          placeholder="Instrucciones para el estudiante..."
                          onChange={(e) => {
                            const updated = [...stages];
                            updated[stageIdx].tasks[taskIdx].instructions = e.target.value;
                            setStages(updated);
                          }}
                          className="bg-[#211f1d] p-2 rounded text-xs text-[#dcc1b9] border border-[#2c2a27] focus:outline-none"
                        />
                        <input
                          type="text"
                          disabled={isSupervising}
                          value={task.expectedResult}
                          placeholder="Entregable esperado..."
                          onChange={(e) => {
                            const updated = [...stages];
                            updated[stageIdx].tasks[taskIdx].expectedResult = e.target.value;
                            setStages(updated);
                          }}
                          className="bg-[#211f1d] p-2 rounded text-xs text-[#dcc1b9] border border-[#2c2a27] focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Confirmación de Publicación Atómica */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#c05c3d]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif text-lg font-bold text-white">
                Confirmar Publicación de Ruta
              </h3>
            </div>
            <p className="text-xs text-[#dcc1b9] leading-relaxed">
              La publicación materializará {stages.length} etapas y sus tareas correspondientes en el expediente del estudiante <strong>{selectedStudent}</strong>. Esta acción activará la ruta y la hará visible al tesista de forma inmediata.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#2c2a27]">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-3 py-1.5 rounded bg-[#252220] text-xs text-[#a48b84] hover:bg-[#2c2a27]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow"
              >
                Confirmar y Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
