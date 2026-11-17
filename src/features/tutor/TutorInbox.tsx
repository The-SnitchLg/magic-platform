import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Inbox,
  CheckCircle,
  FileText,
  Check,
  Send,
  X,
  LockOpen
} from 'lucide-react';

interface InboxItem {
  id: string;
  type: 'agreement' | 'evidence' | 'milestone';
  studentName: string;
  program: string;
  title: string;
  deliverableCode: string;
  description: string;
  fileName?: string;
  fileSize?: string;
  dateLabel: string;
  status: 'submitted' | 'approved' | 'changes_requested';
}

export const TutorInbox: React.FC = () => {
  const { isSupervising } = useAuth();

  const [items, setItems] = useState<InboxItem[]>([
    {
      id: 'inv-1',
      type: 'agreement',
      studentName: 'Elena V. Morales',
      program: 'Doctorado en Filosofía',
      title: 'Acta Concertada de Acuerdos Iniciales (Versión 1.2)',
      deliverableCode: 'Acuerdo C01',
      description: 'El plan de trabajo quincenal concertado y la pregunta rectora directriz han sido remitidos.',
      dateLabel: 'Hoy, 09:30',
      status: 'submitted',
    },
    {
      id: 'inv-2',
      type: 'evidence',
      studentName: 'Mateo Restrepo Gaviria',
      program: 'Doctorado en Epistemología',
      title: 'Revisión de protocolo de muestreo metodológico y calibración multivariada',
      deliverableCode: 'Entregable C08 · Etapa 2',
      description: 'Se anexaron 42 fichas técnicas de campo y el script de calibración para rigor experimental.',
      fileName: 'Protocolo_Muestreo_v3.pdf',
      fileSize: '4.8 MB',
      dateLabel: 'Ayer',
      status: 'submitted',
    },
    {
      id: 'inv-3',
      type: 'milestone',
      studentName: 'Diego Saavedra C.',
      program: 'Doctorado en Energía y Sustentabilidad',
      title: 'Comprobación bibliométrica y solicitud de habilitación de compuerta',
      deliverableCode: 'Control de Compuerta · Hito 3',
      description: 'Acreditó artículo indexado Q1 en Journal of Cleaner Production. Requiere levantamiento de compuerta para pase a fase de redacción final.',
      fileName: 'Acreditacion_Articulo_Q1.pdf',
      fileSize: '1.9 MB',
      dateLabel: '2 días atrás',
      status: 'submitted',
    },
  ]);

  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [decisionMode, setDecisionMode] = useState<'approve' | 'request_changes' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenDecision = (item: InboxItem, mode: 'approve' | 'request_changes') => {
    if (isSupervising) return;
    setSelectedItem(item);
    setDecisionMode(mode);
    setFeedbackText(
      mode === 'approve'
        ? 'El trabajo presentado satisface con solvencia los estándares de rigor metodológico y pertinencia epistemológica exigidos para esta fase.'
        : ''
    );
  };

  const handleConfirmDecision = () => {
    if (!selectedItem || !decisionMode || isSupervising) return;

    if (decisionMode === 'request_changes' && !feedbackText.trim()) {
      alert('Debe indicar la retroalimentación para solicitar ajustes.');
      return;
    }

    const updated = items.map((it) => {
      if (it.id === selectedItem.id) {
        return {
          ...it,
          status: decisionMode === 'approve' ? ('approved' as const) : ('changes_requested' as const),
        };
      }
      return it;
    });

    setItems(updated);
    setNotification(
      decisionMode === 'approve'
        ? `Dictamen favorable registrado para ${selectedItem.studentName}.`
        : `Solicitud de ajustes enviada a ${selectedItem.studentName}.`
    );

    setSelectedItem(null);
    setDecisionMode(null);
    setFeedbackText('');
    setTimeout(() => setNotification(null), 4000);
  };

  const pendingCount = items.filter((i) => i.status === 'submitted').length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <Inbox className="w-3.5 h-3.5" />
            <span>Despacho Tutorial</span>
            <span className="text-[#a48b84]">• Suscripción Electrónica de Avales</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Bandeja de Decisiones y Dictámenes
          </h1>
          <p className="text-sm text-[#dcc1b9] max-w-3xl">
            Evaluación de acuerdos, revisión de evidencias empíricas y habilitación de compuertas metodológicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded bg-[#dd7252]/20 text-[#ffb59f] text-xs font-bold">
            {pendingCount} Asuntos Pendientes
          </span>
        </div>
      </header>

      {notification && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-600/50 text-emerald-300 text-xs rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid de Tarjetas en Pergamino Claro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {items.map((item) => {
          const isApproved = item.status === 'approved';
          const isChanges = item.status === 'changes_requested';

          return (
            <div
              key={item.id}
              className="document-sheet rounded-xl p-6 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      isApproved
                        ? 'bg-[#2d5a3f]/15 text-[#2d5a3f]'
                        : isChanges
                        ? 'bg-[#ffb4ab]/30 text-[#831818]'
                        : 'bg-[#c05c3d]/15 text-[#c05c3d]'
                    }`}
                  >
                    {isApproved && 'Aval Emitido'}
                    {isChanges && 'Ajustes Solicitados'}
                    {item.status === 'submitted' && item.deliverableCode}
                  </span>
                  <span className="text-[11px] text-[#7a746e]">{item.dateLabel}</span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1e1c1a] leading-tight">
                    {item.studentName}
                  </h3>
                  <span className="text-xs text-[#7a746e] block">{item.program}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#c05c3d] block">
                    {item.title}
                  </span>
                  <p className="text-xs text-[#57534e] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.fileName && (
                  <div className="bg-[#ede8e1] rounded p-2.5 flex items-center justify-between text-xs text-[#2c2a27]">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#c05c3d] shrink-0" />
                      <span className="font-semibold truncate">{item.fileName}</span>
                    </div>
                    <span className="text-[#7a746e] text-[10px] shrink-0">{item.fileSize}</span>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 border-t border-[#e3dcd1] flex flex-col gap-2">
                {item.status === 'submitted' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSupervising}
                      onClick={() => handleOpenDecision(item, 'approve')}
                      className="flex-1 py-2 px-3 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {item.type === 'milestone' ? <LockOpen className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{item.type === 'milestone' ? 'Habilitar Hito' : 'Aprobar Aval'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSupervising}
                      onClick={() => handleOpenDecision(item, 'request_changes')}
                      className="px-3 py-2 rounded bg-[#ede8e1] hover:bg-[#dfd9cf] text-[#2c2a27] text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Ajustes
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-1.5 bg-[#ede8e1] rounded text-xs font-semibold text-[#2c2a27]">
                    {isApproved ? 'Dictamen Aprobado Registrado' : 'Ajustes Pendientes de Tesista'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Dictamen y Retroalimentación */}
      {selectedItem && decisionMode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2c2a27] pb-3">
              <span className="font-serif text-lg text-white font-semibold">
                {decisionMode === 'approve' ? 'Emitir Aval Favorable' : 'Solicitar Ajustes Metodológicos'}
              </span>
              <button onClick={() => setSelectedItem(null)} aria-label="Cerrar modal">
                <X className="w-5 h-5 text-[#a48b84] hover:text-white" />
              </button>
            </div>

            <div className="text-xs text-[#dcc1b9] space-y-1">
              <div>
                <strong>Tesista:</strong> {selectedItem.studentName}
              </div>
              <div>
                <strong>Asunto:</strong> {selectedItem.title}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a48b84]">
                Observaciones del Director (Obligatorio)
              </label>
              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Especifique el fundamento del dictamen o las correcciones requeridas..."
                className="w-full p-3 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2c2a27]">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-3 py-2 rounded bg-[#252220] text-xs text-[#dcc1b9] hover:bg-[#2c2a27]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                className="px-4 py-2 rounded bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Firmar y Registrar Dictamen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
