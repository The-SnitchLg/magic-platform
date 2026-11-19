import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Search, Activity, RefreshCw, Loader2 } from 'lucide-react';

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
  const [events, setEvents] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setEvents([
          {
            id: 'aud-1',
            eventType: 'INITIAL_ADMIN_BOOTSTRAP',
            actorName: 'Administrador Inicial',
            actorRole: 'admin',
            entity: 'profiles',
            timestamp: '17/11/2026 10:00:15 UTC',
            metadata: '{"action": "bootstrap_completed", "security": "credential_confidentiality_enforced"}',
          },
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('audit_events')
        .select(`
          id,
          event_type,
          entity,
          entity_id,
          safe_metadata,
          created_at,
          actor:profiles!audit_events_actor_id_fkey(display_name, email_display, role)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      interface RawAuditRecord {
        id: string;
        event_type: string;
        entity: string;
        entity_id: string | null;
        safe_metadata: Record<string, unknown> | null;
        created_at: string;
        actor: {
          display_name?: string;
          email_display?: string;
          role?: string;
        } | null;
      }

      const formatted: AuditItem[] = ((data || []) as unknown as RawAuditRecord[]).map((row) => ({
        id: row.id,
        eventType: row.event_type,
        actorName: row.actor?.display_name || row.actor?.email_display || 'Sistema / Desconocido',
        actorRole: row.actor?.role || 'system',
        entity: row.entity,
        timestamp: new Date(row.created_at).toLocaleString(),
        metadata: JSON.stringify(row.safe_metadata || {}),
      }));

      setEvents(formatted);
    } catch (err) {
      console.warn('Error fetching audit events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
            Eventos críticos de seguridad, provisión de identidades, avales de dirección y modificaciones de itinerario persistidos en Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEvents}
          disabled={loading}
          className="px-3 py-2 bg-[#252220] hover:bg-[#373432] text-[#dcc1b9] text-xs font-semibold rounded border border-[#373432] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c05c3d]' : ''}`} />
          <span>Actualizar</span>
        </button>
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
          {loading ? 'Cargando eventos...' : `${filteredEvents.length} eventos registrados`}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#a48b84]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#c05c3d]" />
                      <span>Cargando bitácora de auditoría...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#a48b84]">
                    No se registran eventos con los filtros especificados.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
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
                    <td className="py-3 px-4 font-mono text-[10px] text-[#8cb89f] max-w-xs truncate" title={ev.metadata}>
                      {ev.metadata}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
