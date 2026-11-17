import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Upload,
  CheckCircle,
  Clock,
  FileCheck,
  Send
} from 'lucide-react';

interface TaskItem {
  id: string;
  stageNo: number;
  stageTitle: string;
  title: string;
  instructions: string;
  expectedResult: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'changes_requested';
  submissions: {
    attemptNo: number;
    fileName: string;
    fileSize: string;
    submittedAt: string;
    comment: string;
    status: 'submitted' | 'approved' | 'changes_requested';
    feedback?: string;
  }[];
}

export const StudentTasks: React.FC = () => {
  const { isSupervising } = useAuth();

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      stageNo: 1,
      stageTitle: 'Etapa 1: Delimitación Problemática y Marco Teórico',
      title: 'Actividad 1.1: Revisión Sistemática de Literatura y Matriz PRISMA',
      instructions: 'Presentar búsqueda documental sistemática en Scopus/WoS con protocolo PRISMA.',
      expectedResult: 'Documento monográfico de revisión con al menos 45 fuentes Q1/Q2.',
      status: 'approved',
      submissions: [
        {
          attemptNo: 1,
          fileName: 'Revision_Literatura_PRISMA_v1.pdf',
          fileSize: '3.4 MB',
          submittedAt: '10/01/2026',
          comment: 'Se adjunta matriz documental consolidada.',
          status: 'approved',
          feedback: 'Excelente rigor en la aplicación de los criterios de exclusión.',
        },
      ],
    },
    {
      id: 'task-2',
      stageNo: 1,
      stageTitle: 'Etapa 1: Delimitación Problemática y Marco Teórico',
      title: 'Actividad 1.2: Delimitación de Pregunta Rectora y Objetivos',
      instructions: 'Redactar pregunta central, hipótesis o presupuestos epistemológicos y objetivos.',
      expectedResult: 'Ficha capitular con marco teórico preliminar avalado.',
      status: 'approved',
      submissions: [
        {
          attemptNo: 1,
          fileName: 'Ficha_Pregunta_Rectora_v1.pdf',
          fileSize: '1.2 MB',
          submittedAt: '25/01/2026',
          comment: 'Versión concertada con el director en sesión tutorial.',
          status: 'approved',
          feedback: 'Aprobado formalmente.',
        },
      ],
    },
    {
      id: 'task-3',
      stageNo: 2,
      stageTitle: 'Etapa 2: Diseño Metodológico y Calibración Empírica',
      title: 'Actividad 2.1: Protocolo de Muestreo y Validación de Instrumentos',
      instructions: 'Adjuntar matriz metodológica de consistencia, plan de muestreo y dictamen de jueces expertos.',
      expectedResult: 'Protocolo metodológico validado con coeficiente de fiabilidad.',
      status: 'submitted',
      submissions: [
        {
          attemptNo: 1,
          fileName: 'Protocolo_Muestreo_Metodologico_v1.pdf',
          fileSize: '4.8 MB',
          submittedAt: '16/11/2026 14:30',
          comment: 'Se incluyen 42 fichas técnicas de campo y el script de calibración.',
          status: 'submitted',
        },
      ],
    },
    {
      id: 'task-4',
      stageNo: 2,
      stageTitle: 'Etapa 2: Diseño Metodológico y Calibración Empírica',
      title: 'Actividad 2.2: Aprobación Bioética y Consentimientos Informados',
      instructions: 'Remitir expediente para evaluación del comité ético de investigación institucional.',
      expectedResult: 'Dictamen de comité ético o constancia de bajo riesgo.',
      status: 'in_progress',
      submissions: [],
    },
  ]);

  const [selectedTask, setSelectedTask] = useState<TaskItem>(tasks[2]);
  const [uploadComment, setUploadComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleDepositEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupervising) return;
    if (!selectedFile && !uploadComment) return;

    const newSubmission = {
      attemptNo: selectedTask.submissions.length + 1,
      fileName: selectedFile ? selectedFile.name : 'Evidencia_Capitular_v' + (selectedTask.submissions.length + 1) + '.pdf',
      fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '2.5 MB',
      submittedAt: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      comment: uploadComment || 'Nueva entrega remitida para evaluación.',
      status: 'submitted' as const,
    };

    const updatedTasks = tasks.map((t) => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          status: 'submitted' as const,
          submissions: [newSubmission, ...t.submissions],
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setSelectedTask({
      ...selectedTask,
      status: 'submitted',
      submissions: [newSubmission, ...selectedTask.submissions],
    });

    setUploadSuccess('Evidencia depositada exitosamente. Se encuentra pendiente de revisión tutorial.');
    setSelectedFile(null);
    setUploadComment('');
    setTimeout(() => setUploadSuccess(null), 4000);
  };

  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-[#2c2a27]">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
          Tareas y Depósito de Evidencias
        </h1>
        <p className="text-sm text-[#dcc1b9]">
          Gestión de actividades curriculares, entrega de manuscritos y dictámenes de la dirección.
        </p>
      </header>

      {uploadSuccess && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-600/50 text-emerald-300 text-xs rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Listado de Tareas */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a48b84] block">
            Actividades de la Ruta
          </span>
          <div className="space-y-3">
            {tasks.map((task) => {
              const isSelected = selectedTask.id === task.id;
              const isApproved = task.status === 'approved';
              const isSubmitted = task.status === 'submitted';

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#252220] border-[#c05c3d] shadow-md'
                      : 'bg-[#181614] border-[#2c2a27] hover:border-[#373432]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#a48b84]">
                      Etapa 0{task.stageNo}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        isApproved
                          ? 'bg-[#2d5a3f]/20 text-[#8cb89f]'
                          : isSubmitted
                          ? 'bg-[#b38a37]/20 text-[#dfbe76]'
                          : 'bg-[#2c2a27] text-[#a48b84]'
                      }`}
                    >
                      {isApproved && <CheckCircle className="w-3 h-3" />}
                      {isSubmitted && <Clock className="w-3 h-3" />}
                      <span>
                        {isApproved && 'Aprobada'}
                        {isSubmitted && 'En Revisión'}
                        {task.status === 'in_progress' && 'En Curso'}
                        {task.status === 'pending' && 'Pendiente'}
                      </span>
                    </span>
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-[#faf8f5] leading-snug">
                    {task.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Detalle de Actividad y Formulario de Entrega */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-[#2c2a27] pb-4">
              <span className="text-xs uppercase tracking-wider text-[#c05c3d] font-bold">
                {selectedTask.stageTitle}
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-[#faf8f5] mt-1 font-semibold">
                {selectedTask.title}
              </h2>
            </div>

            {/* Instrucciones y Entregable Esperado */}
            <div className="space-y-4">
              <div className="bg-[#181614] p-4 rounded-lg border border-[#2c2a27] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84] block">
                  Instrucciones Metodológicas
                </span>
                <p className="text-xs sm:text-sm text-[#dcc1b9] leading-relaxed">
                  {selectedTask.instructions}
                </p>
              </div>

              <div className="bg-[#181614] p-4 rounded-lg border border-[#2c2a27] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84] block">
                  Entregable Exigible
                </span>
                <p className="text-xs sm:text-sm text-[#faf8f5] leading-relaxed">
                  {selectedTask.expectedResult}
                </p>
              </div>
            </div>

            {/* Formulario de Depósito de Evidencia */}
            <form onSubmit={handleDepositEvidence} className="space-y-4 pt-4 border-t border-[#2c2a27]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#faf8f5] block">
                Depositar Evidencia (Bucket Privado academic-evidence)
              </span>

              <div className="border-2 border-dashed border-[#373432] hover:border-[#c05c3d] rounded-lg p-6 text-center space-y-2 bg-[#181614] transition-colors cursor-pointer relative">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.docx,.png,.jpg"
                  disabled={isSupervising}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-[#c05c3d] mx-auto" />
                <div className="text-xs text-[#faf8f5] font-semibold">
                  {selectedFile ? selectedFile.name : 'Haga clic para seleccionar o arrastre el archivo de evidencia'}
                </div>
                <p className="text-[10px] text-[#a48b84]">
                  Formatos admitidos: PDF, DOCX, PNG (Máximo 50 MB)
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#a48b84]">
                  Comentario aclaratorio para el tutor
                </label>
                <textarea
                  rows={2}
                  disabled={isSupervising}
                  value={uploadComment}
                  onChange={(e) => setUploadComment(e.target.value)}
                  placeholder="Detalles sobre la versión remitida, respuestas a observaciones previas..."
                  className="w-full p-2.5 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                />
              </div>

              <button
                type="submit"
                disabled={isSupervising}
                className="w-full py-2.5 px-4 bg-[#c05c3d] hover:bg-[#ab5034] text-white font-semibold text-xs rounded transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar y Enviar Evidencia</span>
              </button>
            </form>

            {/* Historial de Envíos */}
            <div className="pt-6 border-t border-[#2c2a27] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a48b84] block">
                Historial de Entregas e Intentos ({selectedTask.submissions.length})
              </span>

              {selectedTask.submissions.length === 0 ? (
                <p className="text-xs text-[#a48b84] italic">No se han presentado entregas para esta tarea.</p>
              ) : (
                <div className="space-y-3">
                  {selectedTask.submissions.map((sub, idx) => (
                    <div key={idx} className="bg-[#181614] p-4 rounded-lg border border-[#2c2a27] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#faf8f5]">
                          <FileCheck className="w-4 h-4 text-[#c05c3d]" />
                          <span>Intento #{sub.attemptNo}: {sub.fileName}</span>
                          <span className="text-[#a48b84] font-normal">({sub.fileSize})</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            sub.status === 'approved'
                              ? 'bg-[#2d5a3f]/20 text-[#8cb89f]'
                              : sub.status === 'changes_requested'
                              ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                              : 'bg-[#b38a37]/20 text-[#dfbe76]'
                          }`}
                        >
                          {sub.status === 'approved' && 'Aprobado'}
                          {sub.status === 'changes_requested' && 'Ajustes Requeridos'}
                          {sub.status === 'submitted' && 'En Revisión'}
                        </span>
                      </div>

                      {sub.comment && (
                        <p className="text-xs text-[#dcc1b9]">
                          <strong>Estudiante:</strong> {sub.comment}
                        </p>
                      )}

                      {sub.feedback && (
                        <div className="bg-[#211f1d] p-3 rounded border border-[#2c2a27] text-xs text-[#dfbe76] space-y-0.5">
                          <span className="font-bold block text-white">Dictamen de Dirección:</span>
                          <p className="italic">«{sub.feedback}»</p>
                        </div>
                      )}

                      <div className="text-[10px] text-[#56423d] text-right">
                        Remitido: {sub.submittedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
