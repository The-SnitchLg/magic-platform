import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@/types/database.types';
import {
  BookOpen,
  GitBranch,
  CheckSquare,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Eye,
  Settings,
  ChevronRight,
  Inbox,
  UserCheck
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { profile, viewMode, setViewMode, isSupervising, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  // Define navigation per effective viewMode
  const getNavItems = () => {
    if (viewMode === 'student') {
      return [
        { label: 'Mis Acuerdos', path: '/estudiante/acuerdos', icon: ShieldCheck },
        { label: 'Mi Ruta Académica', path: '/estudiante/ruta', icon: GitBranch },
        { label: 'Tareas y Entregas', path: '/estudiante/tareas', icon: CheckSquare },
        { label: 'Mi Investigación', path: '/estudiante', icon: BookOpen },
      ];
    }
    if (viewMode === 'tutor') {
      return [
        { label: 'Bandeja de Decisiones', path: '/tutor/bandeja', icon: Inbox },
        { label: 'Editor de Ruta', path: '/tutor/editor-ruta', icon: GitBranch },
        { label: 'Expedientes de Tesistas', path: '/tutor/estudiantes', icon: Users },
        { label: 'Panel de Cohorte', path: '/tutor', icon: BookOpen },
      ];
    }
    // Admin default
    return [
      { label: 'Resumen Institucional', path: '/administracion', icon: BookOpen },
      { label: 'Usuarios y Roles', path: '/administracion/usuarios', icon: UserCheck },
      { label: 'Asignación de Tutores', path: '/administracion/asignaciones', icon: Users },
      { label: 'Catálogo de Rutas', path: '/administracion/catalogo', icon: GitBranch },
      { label: 'Auditoría y Trazabilidad', path: '/administracion/auditoria', icon: ShieldCheck },
    ];
  };

  const navItems = getNavItems();

  const handleRoleSwitch = (newRole: AppRole) => {
    setViewMode(newRole);
    if (newRole === 'student') navigate('/estudiante');
    else if (newRole === 'tutor') navigate('/tutor');
    else navigate('/administracion');
  };

  return (
    <div className="min-h-screen bg-[#1e1c1a] text-[#e7e1de] flex flex-col antialiased">
      {/* ReadOnly Supervision Banner for Admins in view mode */}
      {isSupervising && (
        <aside aria-label="Modo supervisión" className="bg-[#b38a37]/20 border-b border-[#c49a45]/40 text-[#dfbe76] px-4 py-2 flex items-center justify-between text-xs font-semibold z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Eye className="w-4 h-4 text-[#c49a45] shrink-0" />
            <span>
              <strong>Modo Supervisión Institucional (Solo Lectura):</strong> Está visualizando el entorno como{' '}
              <span className="uppercase text-white underline">{viewMode}</span>. Las acciones de aval, firma y envío están deshabilitadas para prevenir suplantación.
            </span>
          </div>
          <button
            onClick={() => handleRoleSwitch('admin')}
            className="text-xs bg-[#c49a45] text-[#1e1c1a] px-2.5 py-1 rounded font-bold hover:bg-[#dfbe76] transition-colors shrink-0"
          >
            Volver a Administración
          </button>
        </aside>
      )}

      {/* Admin 3-View Context Switcher Bar */}
      {isAdmin && (
        <div className="bg-[#181614] border-b border-[#2c2a27] px-4 lg:px-8 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-[#c05c3d]" />
            <span className="text-[#a48b84] uppercase tracking-wider font-semibold">Espacio de Vista Admin:</span>
          </div>
          <div className="flex items-center gap-1 bg-[#252220] p-0.5 rounded border border-[#373432]">
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                viewMode === 'admin'
                  ? 'bg-[#c05c3d] text-white font-semibold shadow'
                  : 'text-[#a48b84] hover:text-white'
              }`}
            >
              Administración
            </button>
            <button
              onClick={() => handleRoleSwitch('tutor')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                viewMode === 'tutor'
                  ? 'bg-[#c05c3d] text-white font-semibold shadow'
                  : 'text-[#a48b84] hover:text-white'
              }`}
            >
              Vista Tutor
            </button>
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`px-3 py-1 rounded text-xs transition-all ${
                viewMode === 'student'
                  ? 'bg-[#c05c3d] text-white font-semibold shadow'
                  : 'text-[#a48b84] hover:text-white'
              }`}
            >
              Vista Estudiante
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col justify-between w-72 bg-[#1d1b19] border-r border-[#2c2a27] shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="flex flex-col p-6 space-y-6">
            {/* Brand Logo & Title */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded bg-[#dd7252] flex items-center justify-center text-[#531200] shrink-0 font-bold">
                M
              </div>
              <div>
                <span className="font-serif text-lg font-semibold text-[#e7e1de] block leading-tight tracking-tight">
                  MAGIC
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#a48b84] block font-sans">
                  Seguimiento Académico
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-[#2c2a27]" />

            {/* Role Header Indicator */}
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#a48b84]">
              {viewMode === 'student' && 'Espacio del Estudiante'}
              {viewMode === 'tutor' && 'Espacio del Tutor'}
              {viewMode === 'admin' && 'Gobernanza Institucional'}
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-all font-medium ${
                      isActive
                        ? 'bg-[#373432] text-[#ffb59f] font-semibold'
                        : 'text-[#dcc1b9] hover:bg-[#252220] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#c05c3d]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile in Sidebar Footer */}
          <div className="p-4 border-t border-[#2c2a27] bg-[#181614] space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#8cb89f]">
              <span className="w-2 h-2 rounded-full bg-[#2d5a3f] animate-pulse" />
              <span>Archivo Académico Conectado</span>
            </div>

            <div className="bg-[#211f1d] p-3 rounded border border-[#2c2a27] flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-[#a48b84] tracking-wider">
                {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'tutor' ? 'Director de Tesis' : 'Doctorando'}
              </span>
              <span className="text-sm font-semibold text-[#faf8f5] truncate">
                {profile?.display_name || profile?.email_display}
              </span>
              <span className="text-xs text-[#a48b84] truncate">
                {profile?.email_display}
              </span>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 text-xs py-2 text-[#ffb4ab] hover:bg-[#373432] rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-[#1e1c1a]/90 backdrop-blur border-b border-[#2c2a27] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
            {/* Mobile menu button & breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#dcc1b9] hover:text-white"
                aria-label="Abrir menú"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-[#a48b84]">
                <span>MAGIC</span>
                <ChevronRight className="w-3 h-3 text-[#56423d]" />
                <span className="text-[#e7e1de] font-medium capitalize">{viewMode}</span>
              </div>
            </div>

            {/* Right Meta Controls */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#252220] border border-[#373432] text-xs">
                <span className="text-[#a48b84] font-semibold">Período:</span>
                <span className="text-[#faf8f5] font-bold">2026-I</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#c05c3d] text-white flex items-center justify-center font-bold text-xs uppercase shadow">
                {profile?.display_name ? profile.display_name[0] : 'U'}
              </div>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex">
              <div className="w-72 bg-[#1d1b19] h-full p-6 flex flex-col justify-between border-r border-[#2c2a27]">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold">MAGIC</span>
                    <button onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú">
                      <X className="w-5 h-5 text-[#a48b84]" />
                    </button>
                  </div>
                  <nav className="flex flex-col space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-[#dcc1b9] hover:bg-[#252220] hover:text-white"
                        >
                          <Icon className="w-4 h-4 text-[#c05c3d]" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-xs py-2 text-[#ffb4ab]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
              <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
            </div>
          )}

          {/* Page Body */}
          <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
