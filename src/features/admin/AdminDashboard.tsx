import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Users,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  BookOpen,
  Activity,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    studentsCount: 0,
    tutorsCount: 0,
    adminsCount: 0,
    activeProjects: 0,
    pendingAssignments: 0,
    auditEventsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setStats({
          totalUsers: 5,
          studentsCount: 2,
          tutorsCount: 2,
          adminsCount: 1,
          activeProjects: 2,
          pendingAssignments: 1,
          auditEventsCount: 6,
        });
        setLoading(false);
        return;
      }

      // Fetch profiles counts
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('role, active');

      if (pError) throw pError;

      const totalUsers = profiles?.length || 0;
      const studentsCount = profiles?.filter((p) => p.role === 'student').length || 0;
      const tutorsCount = profiles?.filter((p) => p.role === 'tutor').length || 0;
      const adminsCount = profiles?.filter((p) => p.role === 'admin').length || 0;

      // Fetch research projects counts
      const { data: projects, error: projError } = await supabase
        .from('research_projects')
        .select('id, status, tutor_id');

      if (projError) throw projError;

      const activeProjects = projects?.filter((p) => p.status !== 'awaiting_tutor').length || 0;
      const pendingAssignments = projects?.filter((p) => !p.tutor_id).length || 0;

      // Fetch audit count
      const { count: auditEventsCount, error: auditError } = await supabase
        .from('audit_events')
        .select('*', { count: 'exact', head: true });

      if (auditError) throw auditError;

      setStats({
        totalUsers,
        studentsCount,
        tutorsCount,
        adminsCount,
        activeProjects,
        pendingAssignments,
        auditEventsCount: auditEventsCount || 0,
      });
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Encabezado Editorial Institucional */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Gobernanza Institucional & Auditoría</span>
            <span className="text-[#a48b84]">• Sede Central de Posgrados</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Panel Rector de Administración
          </h1>
          <p className="text-sm text-[#dcc1b9]">
            Gestión de identidades, provisión de directores, vinculación tutorial y trazabilidad de expedientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-2 bg-[#252220] hover:bg-[#373432] text-[#dcc1b9] text-xs font-semibold rounded border border-[#373432] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c05c3d]' : ''}`} />
            <span>Actualizar</span>
          </button>

          <Link
            to="/administracion/usuarios"
            className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Gestionar Cuentas y Roles</span>
          </Link>
        </div>
      </header>

      {/* Tarjetas Métricas Institucionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-5 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
              Población Total
            </span>
            <Users className="w-4 h-4 text-[#c05c3d]" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-[#faf8f5]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#c05c3d]" /> : stats.totalUsers}
            </span>
            <span className="text-xs text-[#a48b84] block mt-0.5">
              {stats.studentsCount} estudiantes • {stats.tutorsCount} tutores • {stats.adminsCount} admin
            </span>
          </div>
        </div>

        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-5 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
              Expedientes Vinculados
            </span>
            <BookOpen className="w-4 h-4 text-[#8cb89f]" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-[#faf8f5]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#8cb89f]" /> : stats.activeProjects}
            </span>
            <span className="text-xs text-[#8cb89f] block mt-0.5">
              En seguimiento académico activo
            </span>
          </div>
        </div>

        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-5 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
              Asignación Pendiente
            </span>
            <AlertCircle className="w-4 h-4 text-[#c49a45]" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-[#dfbe76]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#dfbe76]" /> : stats.pendingAssignments}
            </span>
            <Link
              to="/administracion/asignaciones"
              className="text-xs text-[#c05c3d] hover:underline font-semibold block mt-0.5"
            >
              Vincular tutor ahora →
            </Link>
          </div>
        </div>

        <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl p-5 flex flex-col justify-between shadow">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#a48b84]">
              Registro de Auditoría
            </span>
            <Activity className="w-4 h-4 text-[#a48b84]" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-[#faf8f5]">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#a48b84]" /> : stats.auditEventsCount}
            </span>
            <span className="text-xs text-[#a48b84] block mt-0.5">
              Eventos inmutables en Supabase
            </span>
          </div>
        </div>
      </div>

      {/* Módulos Principales de Administración */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/administracion/usuarios"
          className="bg-[#211f1d] border border-[#2c2a27] p-6 rounded-xl hover:border-[#c05c3d] transition-all flex flex-col justify-between space-y-4 shadow group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#dd7252]/20 text-[#c05c3d] flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#faf8f5] group-hover:text-[#ffb59f] transition-colors">
              Gestión de Usuarios y Roles
            </h2>
            <p className="text-xs text-[#a48b84] leading-relaxed">
              Creación de cuentas docentes y administrativas mediante credencial temporal de un solo uso o invitación, promoción de cuentas y control de accesos.
            </p>
          </div>
          <div className="text-xs text-[#c05c3d] font-semibold flex items-center gap-1">
            <span>Abrir padrón de usuarios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/administracion/asignaciones"
          className="bg-[#211f1d] border border-[#2c2a27] p-6 rounded-xl hover:border-[#c05c3d] transition-all flex flex-col justify-between space-y-4 shadow group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#2c2a27] text-[#8cb89f] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#faf8f5] group-hover:text-[#ffb59f] transition-colors">
              Asignación Estudiante–Tutor
            </h2>
            <p className="text-xs text-[#a48b84] leading-relaxed">
              Vinculación formal entre proyectos de investigación doctoral y directores de tesis activos, con trazabilidad histórica de relevos.
            </p>
          </div>
          <div className="text-xs text-[#c05c3d] font-semibold flex items-center gap-1">
            <span>Administrar vinculaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/administracion/auditoria"
          className="bg-[#211f1d] border border-[#2c2a27] p-6 rounded-xl hover:border-[#c05c3d] transition-all flex flex-col justify-between space-y-4 shadow group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#b38a37]/20 text-[#c49a45] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#faf8f5] group-hover:text-[#ffb59f] transition-colors">
              Auditoría y Trazabilidad
            </h2>
            <p className="text-xs text-[#a48b84] leading-relaxed">
              Registro append-only de cada alta, cambio de rol, aprobación de acuerdos, emisión de avales, publicación de rutas e inspecciones.
            </p>
          </div>
          <div className="text-xs text-[#c05c3d] font-semibold flex items-center gap-1">
            <span>Ver bitácora de auditoría</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
};
