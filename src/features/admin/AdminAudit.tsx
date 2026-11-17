import React, { useState } from 'react';
import { Search, Activity } from 'lucide-react';

interface AuditItem {
  id: string;
  eventType: string;
  actorName: string;
  actorRole: string;
  entity: string;
  timestamp: string;
  metadata: string;
}

export const AdminAudit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [events] = useState<AuditItem[]>([
    {
      id: 'aud-1',
      eventType: 'INITIAL_ADMIN_BOOTSTRAP',
      actorName: 'Administrador Inicial',
      actorRole: 'admin',
      entity: 'profiles',
      timestamp: '17/11/2026 10:00:15 UTC',
      metadata: '{"action": "bootstrap_completed", "security": "credential_confidentiality_enforced"}',
    },
    {
      id: 'aud-2',
      eventType: 'USER_PROVISIONED',
      actorName: 'Administrador Institucional',
      actorRole: 'admin',
      entity: 'profiles',
      timestamp: '17/11/2026 10:15:30 UTC',
      metadata: '{"assigned_role": "tutor", "email_domain": "universidad.edu"}',
    },
    {
      id: 'aud-3',
      eventType: 'TUTOR_ASSIGNED',
      actorName: 'Administrador Institucional',
      actorRole: 'admin',
      entity: 'research_projects',
      timestamp: '17/11/2026 10:20:00 UTC',
      metadata: '{"student_id": "usr-4", "tutor_id": "usr-2"}',
    },
    {
      id: 'aud-4',
      eventType: 'AGREEMENT_SUBMITTED',
      actorName: 'Mateo Restrepo Gaviria',
      actorRole: 'student',
      entity: 'agreement_versions',
      timestamp: '17/11/2026 10:30:12 UTC',
      metadata: '{"version_no": 1, "status": "submitted"}',
    },
    {
      id: 'aud-5',
      eventType: 'AGREEMENT_APPROVED',
      actorName: 'Dr. Carlos Gutiérrez M.',
      actorRole: 'tutor',
      entity: 'agreement_versions',
      timestamp: '17/11/2026 10:45:00 UTC',
      metadata: '{"decision": "approved", "project_status": "route_configuration"}',
    },
    {
      id: 'aud-6',
      eventType: 'ROUTE_PUBLISHED',
      actorName: 'Dr. Carlos Gutiérrez M.',
      actorRole: 'tutor',
      entity: 'project_route_versions',
      timestamp: '17/11/2026 11:00:22 UTC',
      metadata: '{"stages_count": 4, "tasks_count": 7, "status": "published"}',
    },
  ]);

  const filteredEvents = events.filter(
    (ev) =>
      ev.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <Activity className="w-3.5 h-3.5" />
            <span>Trazabilidad Institucional</span>
            <span className="text-[#a48b84]">• Bitácora Inmutable Append-Only</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Registro de Auditoría de Operaciones
          </h1>
          <p className="text-sm text-[#dcc1b9]">
            Eventos críticos de seguridad, provisión de identidades, avales de dirección y modificaciones de itinerario.
          </p>
        </div>
      </header>

      {/* Barra de Búsqueda */}
      <div className="bg-[#211f1d] border border-[#2c2a27] p-4 rounded-xl flex items-center justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por evento, actor o entidad..."
            className="w-full pl-9 pr-3 py-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
          />
        </div>

        <span className="text-xs text-[#a48b84]">
          {filteredEvents.length} eventos registrados
        </span>
      </div>

      {/* Tabla de Eventos */}
      <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181614] border-b border-[#2c2a27] text-[#a48b84] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Tipo de Evento</th>
                <th className="py-3 px-4">Actor Responsable</th>
                <th className="py-3 px-4">Entidad Afectada</th>
                <th className="py-3 px-4">Metadatos Seguros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2c2a27]">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#252220] transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-[#a48b84]">
                    {ev.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#373432] text-[#ffb59f]">
                      {ev.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#faf8f5]">{ev.actorName}</div>
                    <span className="text-[10px] text-[#a48b84] uppercase">{ev.actorRole}</span>
                  </td>
                  <td className="py-3 px-4 text-[#dcc1b9] font-mono text-[11px]">
                    {ev.entity}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-[#8cb89f] max-w-xs truncate">
                    {ev.metadata}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
