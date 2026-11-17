import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  UserPlus,
  UserCheck,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { Profile, AppRole } from '@/types/database.types';

export const AdminUsers: React.FC = () => {
  const { isSupervising } = useAuth();

  const [users, setUsers] = useState<Profile[]>([
    {
      id: 'usr-1',
      email_display: 'admin@universidad.edu',
      display_name: 'Administrador Institucional',
      role: 'admin',
      active: true,
      must_change_password: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-2',
      email_display: 'carlos.gutierrez@universidad.edu',
      display_name: 'Dr. Carlos Gutiérrez M.',
      role: 'tutor',
      active: true,
      must_change_password: false,
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 'usr-3',
      email_display: 'valeria.montes@universidad.edu',
      display_name: 'Dra. Valeria Montes',
      role: 'tutor',
      active: true,
      must_change_password: false,
      created_at: '2026-02-01T12:00:00Z',
      updated_at: '2026-02-01T12:00:00Z',
    },
    {
      id: 'usr-4',
      email_display: 'mateo.restrepo@universidad.edu',
      display_name: 'Mateo Restrepo Gaviria',
      role: 'student',
      active: true,
      must_change_password: false,
      created_at: '2026-02-10T14:30:00Z',
      updated_at: '2026-02-10T14:30:00Z',
    },
    {
      id: 'usr-5',
      email_display: 'elena.morales@universidad.edu',
      display_name: 'Elena V. Morales',
      role: 'student',
      active: true,
      must_change_password: false,
      created_at: '2026-02-14T09:15:00Z',
      updated_at: '2026-02-14T09:15:00Z',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'tutor' | 'admin'>('tutor');
  const [tempPassword, setTempPassword] = useState('');
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupervising) return;

    if (!newEmail || !tempPassword || tempPassword.length < 8) {
      setNotification({ text: 'La contraseña temporal debe tener al menos 8 caracteres.', isError: true });
      return;
    }

    // Check if user already exists
    const existingIndex = users.findIndex((u) => u.email_display.toLowerCase() === newEmail.toLowerCase());

    if (existingIndex >= 0) {
      // User exists: promote without duplicating!
      const existing = users[existingIndex];
      const updated = [...users];
      updated[existingIndex] = {
        ...existing,
        role: newRole,
        display_name: newFullName || existing.display_name,
        updated_at: new Date().toISOString(),
      };
      setUsers(updated);
      setNotification({
        text: `La cuenta existente de ${existing.email_display} ha sido promovida al rol '${newRole}' sin duplicar su identidad.`,
      });
    } else {
      // New user
      const newUser: Profile = {
        id: `usr-${Date.now()}`,
        email_display: newEmail,
        display_name: newFullName || newEmail.split('@')[0],
        role: newRole,
        active: true,
        must_change_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUsers([newUser, ...users]);
      setNotification({
        text: `Usuario ${newRole} creado con éxito. Se requerirá cambio de contraseña en su primer acceso.`,
      });
    }

    setShowCreateModal(false);
    setNewEmail('');
    setNewFullName('');
    setTempPassword('');
    setTimeout(() => setNotification(null), 5000);
  };

  const handleToggleActive = (user: Profile) => {
    if (isSupervising) return;

    // Protection rule: cannot deactivate last active administrator
    if (user.role === 'admin' && user.active) {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.active);
      if (activeAdmins.length <= 1) {
        setNotification({
          text: 'Operación denegada: No es posible desactivar al único administrador activo del sistema.',
          isError: true,
        });
        setTimeout(() => setNotification(null), 4000);
        return;
      }
    }

    const updated = users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u));
    setUsers(updated);
    setNotification({
      text: `Estado de la cuenta ${user.email_display} actualizado a: ${!user.active ? 'Activa' : 'Desactivada'}.`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#2c2a27]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#c05c3d]">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Administración de Identidades y Permisos</span>
            <span className="text-[#a48b84]">• RBAC Server-Enforced</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#faf8f5]">
            Padrón de Usuarios, Tutores y Administradores
          </h1>
          <p className="text-sm text-[#dcc1b9]">
            Aprovisionamiento seguro, asignación de roles y control de estado de acceso institucional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSupervising}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provisionar Tutor o Administrador</span>
          </button>
        </div>
      </header>

      {notification && (
        <div
          className={`p-3 text-xs rounded flex items-center gap-2 ${
            notification.isError
              ? 'bg-red-900/30 border border-red-600/50 text-red-300'
              : 'bg-emerald-900/30 border border-emerald-600/50 text-emerald-300'
          }`}
        >
          {notification.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#211f1d] border border-[#2c2a27] p-4 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por correo o nombre..."
            className="w-full pl-9 pr-3 py-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a48b84] font-semibold">Filtrar por Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | 'all')}
            className="bg-[#181614] border border-[#2c2a27] text-xs text-[#faf8f5] px-3 py-2 rounded focus:outline-none focus:border-[#c05c3d]"
          >
            <option value="all">Todos los Roles</option>
            <option value="student">Estudiantes / Doctorandos</option>
            <option value="tutor">Docentes Tutores</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181614] border-b border-[#2c2a27] text-[#a48b84] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo Institucional</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha Registro</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2c2a27]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#252220] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#faf8f5]">
                    {u.display_name}
                  </td>
                  <td className="py-3 px-4 text-[#dcc1b9] font-mono text-[11px]">
                    {u.email_display}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-[#c05c3d]/20 text-[#ffb59f]'
                          : u.role === 'tutor'
                          ? 'bg-[#b38a37]/20 text-[#dfbe76]'
                          : 'bg-[#2d5a3f]/20 text-[#8cb89f]'
                      }`}
                    >
                      {u.role === 'admin' && 'Administrador'}
                      {u.role === 'tutor' && 'Director / Tutor'}
                      {u.role === 'student' && 'Estudiante'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.active
                          ? 'bg-[#2d5a3f]/20 text-[#8cb89f]'
                          : 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                      }`}
                    >
                      {u.active ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#a48b84] text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      disabled={isSupervising}
                      onClick={() => handleToggleActive(u)}
                      className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                        u.active
                          ? 'text-[#ffb4ab] hover:bg-[#ffb4ab]/10'
                          : 'text-[#8cb89f] hover:bg-[#2d5a3f]/10'
                      }`}
                    >
                      {u.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Provisión de Usuarios */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2c2a27] pb-3">
              <span className="font-serif text-lg text-white font-semibold">
                Provisionar Tutor o Administrador
              </span>
              <button onClick={() => setShowCreateModal(false)} aria-label="Cerrar modal">
                <X className="w-5 h-5 text-[#a48b84] hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Dr. Nombre Apellidos"
                    className="w-full pl-9 pr-3 py-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]">
                  Correo Institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="docente@universidad.edu"
                    className="w-full pl-9 pr-3 py-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                  />
                </div>
                <span className="text-[10px] text-[#a48b84]">
                  *Si el correo ya está registrado como estudiante, se promoverá su perfil sin duplicar su cuenta.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]">
                  Rol a Asignar
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'tutor' | 'admin')}
                  className="w-full p-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                >
                  <option value="tutor">Docente Tutor / Director de Tesis</option>
                  <option value="admin">Administrador Institucional</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]">
                  Contraseña Temporal de un Solo Uso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-9 pr-3 py-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                  />
                </div>
                <span className="text-[10px] text-[#a48b84]">
                  Se exigirá rotación obligatoria de contraseña en el primer inicio de sesión.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2c2a27]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded bg-[#252220] text-xs text-[#a48b84] hover:bg-[#2c2a27]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all"
                >
                  Confirmar Provisión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
