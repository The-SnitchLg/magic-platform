import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Send,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer
} from 'lucide-react';

export const StudentAgreements: React.FC = () => {
  const { isSupervising } = useAuth();

  const [status, setStatus] = useState<'draft' | 'submitted' | 'changes_requested' | 'approved'>('submitted');
  const [title, setTitle] = useState('Impacto de la Economía Circular en la Competitividad de MIPYMES Industriales');
  const [question, setQuestion] = useState('¿De qué manera los modelos de simbiosis industrial y recirculación de materiales incrementan la resiliencia operativa y rentabilidad marginal en el sector manufacturero intermedio?');
  const methodology = 'Mixto Concurrente (Cualitativo + Cuantitativo)';
  const universe = '35 Fabricantes en censo manufacturero regional';
  const regimen = 'Quincenal Sincrónico · Miércoles 09:00 - 11:00';
  const [commitments, setCommitments] = useState('Entrega de estado del arte preliminar en 4 semanas; revisión de fichas técnicas quincenal.');
  const feedback = 'El marco epistemológico y la delimitación del universo de empresas reflejan sólida madurez conceptual. El cronograma semestral es riguroso pero factible para cumplir con el hito.';
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupervising) return;
    setSaveNotification('Borrador guardado exitosamente.');
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const handleSubmitForReview = () => {
    if (isSupervising) return;
    setStatus('submitted');
    setSaveNotification('Acuerdo enviado a la bandeja del Director de Tesis para su revisión.');
    setTimeout(() => setSaveNotification(null), 3000);
  };

  const isEditable = (status === 'draft' || status === 'changes_requested') && !isSupervising;

  return (
    <div className="space-y-8">
      {/* Encabezado Editorial */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c05c3d]" />
            <span>Fase 01 • Formalización de Candidatura</span>
            <span className="text-[#a48b84]">• Módulo C01</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Acta Concertada de Acuerdos Iniciales
          </h1>
          <p className="text-sm text-[#dcc1b9] max-w-2xl">
            Estipulación formal del plan de trabajo, compromisos epistemológicos y régimen tutorial colegiado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded bg-[#2c2a27] text-xs text-[#a48b84] font-medium">
            Versión 1.2
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#252220] hover:bg-[#2c2a27] text-xs text-[#faf8f5] transition-colors border border-[#373432]"
          >
            <Printer className="w-3.5 h-3.5 text-[#c05c3d]" />
            <span>Imprimir Folio</span>
          </button>
        </div>
      </header>

      {saveNotification && (
        <div className="p-3 rounded bg-emerald-900/30 border border-emerald-600/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* Grid: Hoja Folio Pergamino (Izq) & Veredicto Tutorial (Der) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Folio Pergamino Claro */}
        <section className="lg:col-span-7 document-sheet rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#e3dcd1] pb-3">
            <div className="flex items-center gap-2 text-[#c05c3d] font-bold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Ficha Técnica Concertada</span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-[#eadece] text-[#4a3f35] text-[11px] font-bold">
              ID: DOC-EP-2026-04
            </span>
          </div>

          <form onSubmit={handleSaveDraft} className="space-y-5">
            {/* Título de Tesis */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7f7469]">
                Título Registrado de la Tesis
              </label>
              {isEditable ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#f2ece1] rounded text-[#1e1c1a] font-serif text-lg font-semibold border border-[#e3dcd1] focus:bg-white focus:outline-none"
                />
              ) : (
                <h2 className="font-serif text-xl sm:text-2xl text-[#1e1c1a] font-semibold leading-snug">
                  {title}
                </h2>
              )}
            </div>

            {/* Pregunta Rectora Directriz */}
            <div className="bg-[#f2ece1] rounded-lg p-4 border-l-4 border-[#c05c3d] space-y-1.5">
              <span className="text-xs font-bold text-[#c05c3d] uppercase tracking-wider block">
                Pregunta Rectora Directriz
              </span>
              {isEditable ? (
                <textarea
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-2 bg-white rounded text-[#1e1c1a] font-serif text-sm italic border border-[#e3dcd1] focus:outline-none"
                />
              ) : (
                <p className="font-serif text-base italic text-[#2e2924] leading-relaxed">
                  «{question}»
                </p>
              )}
            </div>

            {/* Metadatos de Enfoque */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded bg-white border border-[#e3dcd1] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#7f7469] block">Enfoque Metodológico</span>
                <span className="text-xs font-semibold text-[#1e1c1a] block">{methodology}</span>
              </div>
              <div className="p-3 rounded bg-white border border-[#e3dcd1] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#7f7469] block">Universo y Muestra</span>
                <span className="text-xs font-semibold text-[#1e1c1a] block">{universe}</span>
              </div>
              <div className="p-3 rounded bg-white border border-[#e3dcd1] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#7f7469] block">Régimen Tutorial</span>
                <span className="text-xs font-semibold text-[#1e1c1a] block">{regimen}</span>
              </div>
            </div>

            {/* Compromisos y Entregas */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7f7469]">
                Compromisos Específicos y Acuerdos de Sesión
              </label>
              {isEditable ? (
                <textarea
                  rows={3}
                  value={commitments}
                  onChange={(e) => setCommitments(e.target.value)}
                  className="w-full p-2.5 bg-[#f2ece1] rounded text-[#1e1c1a] text-sm border border-[#e3dcd1] focus:bg-white focus:outline-none"
                />
              ) : (
                <p className="text-xs sm:text-sm text-[#57534e] leading-relaxed bg-[#f2ece1] p-3 rounded">
                  {commitments}
                </p>
              )}
            </div>

            {/* Acciones del Estudiante */}
            {isEditable && (
              <div className="pt-4 border-t border-[#e3dcd1] flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#252220] text-white text-xs font-semibold rounded hover:bg-[#373432] transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Borrador</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  className="px-4 py-2 bg-[#c05c3d] text-white text-xs font-semibold rounded hover:bg-[#ab5034] transition-colors flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar para Revisión del Tutor</span>
                </button>
              </div>
            )}
          </form>

          <div className="pt-4 border-t border-[#e3dcd1] flex items-center justify-between text-xs text-[#686058]">
            <span>Última modificación: 17/11/2026 10:42 UTC</span>
            <span className="flex items-center gap-1 text-[#2d5a3f] font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Acuerdo Base Sincronizado</span>
            </span>
          </div>
        </section>

        {/* Veredicto Tutorial y Dictamen (Columna Derecha) */}
        <section className="lg:col-span-5 bg-[#211f1d] border border-[#2c2a27] rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#2c2a27]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a48b84]">
              Veredicto Tutorial
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1.5 ${
                status === 'approved'
                  ? 'bg-[#2d5a3f]/25 text-[#8cb89f]'
                  : status === 'submitted'
                  ? 'bg-[#b38a37]/20 text-[#dfbe76]'
                  : status === 'changes_requested'
                  ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                  : 'bg-[#2c2a27] text-[#a48b84]'
              }`}
            >
              {status === 'approved' && <CheckCircle className="w-3.5 h-3.5" />}
              {status === 'submitted' && <Clock className="w-3.5 h-3.5" />}
              {status === 'changes_requested' && <AlertCircle className="w-3.5 h-3.5" />}
              <span>
                {status === 'approved' && 'Aval Favorable Concedido'}
                {status === 'submitted' && 'En Revisión por Director'}
                {status === 'changes_requested' && 'Ajustes Requeridos'}
                {status === 'draft' && 'Borrador sin Enviar'}
              </span>
            </span>
          </div>

          {/* Director Profile Badge */}
          <div className="flex items-center gap-3 bg-[#1d1b19] p-3 rounded-lg border border-[#2c2a27]">
            <div className="w-12 h-12 rounded-lg bg-[#dd7252]/20 text-[#c05c3d] flex items-center justify-center shrink-0 font-serif font-bold text-lg">
              CG
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[#faf8f5] truncate">
                Dr. Carlos Gutiérrez M.
              </div>
              <div className="text-xs text-[#a48b84] truncate">
                Director de Tesis • Centro de Estudios del Desarrollo
              </div>
              <div className="text-[10px] text-[#56423d] font-mono mt-0.5">
                ORCID: 0000-0002-8921-4190
              </div>
            </div>
          </div>

          {/* Observaciones de la Dirección */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a48b84] block">
              Observaciones de la Dirección
            </span>
            <blockquote className="font-serif text-sm text-[#e7e1de] italic bg-[#181614] p-4 rounded-lg border border-[#2c2a27] leading-relaxed">
              «{feedback}»
            </blockquote>
          </div>

          {/* Si estado es submitted o approved */}
          <div className="p-4 rounded-lg bg-[#181614] border border-[#2c2a27] text-xs text-[#a48b84] space-y-1">
            <div className="font-semibold text-white">Siguiente paso normativo:</div>
            {status === 'approved' ? (
              <p>El aval de acuerdos habilita la configuración de la ruta curricular por parte del Director.</p>
            ) : status === 'submitted' ? (
              <p>El Director emitirá dictamen con observaciones. Si requiere ajustes, se notificará para corrección.</p>
            ) : (
              <p>Complete la ficha concertada y envíela a revisión.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
