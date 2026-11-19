import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  UserPlus,
  UserCheck,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Mail,
  User,
  Shield,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Profile, AppRole } from '@/types/database.types';

export const AdminUsers: React.FC = () => {
  const { user: currentUser, profile: currentProfile, refreshProfile, isSupervising } = useAuth();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'tutor' | 'admin'>('tutor');
  const [tempPassword, setTempPassword] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const notify = (text: string, isError = false) => {
    setNotification({ text, isError });
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        // Fallback for offline development
        setUsers([
          {
            id: 'mock-admin',
            email_display: 'admin@universidad.edu',
            display_name: 'Administrador Institucional',
            role: 'admin',
            active: true,
            must_change_password: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-tutor',
            email_display: 'tutor@universidad.edu',
            display_name: 'Dr. Fernando Morales',
            role: 'tutor',
            active: true,
            must_change_password: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-student',
            email_display: 'estudiante@universidad.edu',
            display_name: 'Tesista Registrado',
            role: 'student',
            active: true,
            must_change_password: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data as Profile[] || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios de la base de datos';
      notify(message, true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle changing a user's role (student <-> tutor <-> admin)
  const handleRoleChange = async (targetUser: Profile, newRole: AppRole) => {
    if (isSupervising) return;
    if (targetUser.role === newRole) return;

    setActionInProgress(targetUser.id);
    try {
      if (!isSupabaseConfigured()) {
        setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
        notify(`Rol de ${targetUser.display_name} actualizado a '${newRole}'.`);
        return;
      }

      const { error } = await supabase.rpc('admin_promote_user', {
        p_target_id: targetUser.id,
        p_new_role: newRole,
        p_reason: `Reasignación de rol autorizada por ${currentProfile?.email_display || 'administración'}`
      });

      if (error) {
        throw error;
      }

      // Update state locally and re-fetch to ensure consistency
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      notify(`Rol de ${targetUser.display_name || targetUser.email_display} actualizado exitosamente a '${newRole}'.`);

      // If the admin changed their own role, refresh profile in context immediately
      if (currentUser && currentUser.id === targetUser.id) {
        await refreshProfile();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al modificar el rol del usuario';
      notify(message, true);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle toggling active / inactive state
  const handleToggleActive = async (targetUser: Profile) => {
    if (isSupervising) return;

    setActionInProgress(targetUser.id);
    try {
      if (!isSupabaseConfigured()) {
        const updated = users.map((u) => (u.id === targetUser.id ? { ...u, active: !u.active } : u));
        setUsers(updated);
        notify(`Estado de la cuenta actualizado a: ${!targetUser.active ? 'Activa' : 'Desactivada'}.`);
        return;
      }

      const { error } = await supabase.rpc('admin_toggle_user_active', {
        p_target_id: targetUser.id
      });

      if (error) {
        throw error;
      }

      const newStatus = !targetUser.active;
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, active: newStatus } : u));
      notify(`Estado de la cuenta ${targetUser.email_display} actualizado a: ${newStatus ? 'Activa' : 'Desactivada'}.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al modificar el estado de la cuenta';
      notify(message, true);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle creating / provisioning new Tutor or Admin
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupervising) return;

    if (!newEmail || !tempPassword || tempPassword.length < 8) {
      notify('La contraseña temporal debe tener al menos 8 caracteres.', true);
      return;
    }

    setIsSubmittingCreate(true);
    try {
      if (!isSupabaseConfigured()) {
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
        notify(`Usuario ${newRole} creado con éxito (modo local).`);
        setShowCreateModal(false);
        setNewEmail('');
        setNewFullName('');
        setTempPassword('');
        return;
      }

      // Invoke serverless Edge Function manage-user
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'provision',
          email: newEmail.trim(),
          targetRole: newRole,
          temporaryPassword: tempPassword,
          fullName: newFullName.trim() || newEmail.split('@')[0],
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      notify(data?.message || `Usuario con rol '${newRole}' aprovisionado exitosamente.`);
      setShowCreateModal(false);
      setNewEmail('');
      setNewFullName('');
      setTempPassword('');
      await fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al provisionar el usuario';
      notify(message, true);
    } finally {
      setIsSubmittingCreate(false);
    }
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
            Aprovisionamiento seguro, asignación de roles y control de estado de acceso institucional sincronizado con la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="px-3 py-2 bg-[#252220] hover:bg-[#373432] text-[#dcc1b9] text-xs font-semibold rounded border border-[#373432] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Sincronizar con la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c05c3d]' : ''}`} />
            <span>Actualizar</span>
          </button>

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
          role="alert"
          className={`p-3 text-xs rounded flex items-center gap-2 transition-all ${
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

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#a48b84] font-semibold">Filtrar por Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | 'all')}
            className="bg-[#181614] border border-[#2c2a27] text-xs text-[#faf8f5] px-3 py-2 rounded focus:outline-none focus:border-[#c05c3d]"
          >
            <option value="all">Todos los Roles ({users.length})</option>
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
                <th className="py-3 px-4">Rol en Sistema</th>
                <th className="py-3 px-4">Asignar Rol</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha Registro</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2c2a27]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#a48b84]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#c05c3d]" />
                      <span>Cargando padrón oficial de usuarios...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#a48b84]">
                    No se encontraron usuarios coincidentes con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isBusy = actionInProgress === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#252220] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#faf8f5]">
                        <div className="flex items-center gap-2">
                          <span>{u.display_name || u.email_display.split('@')[0]}</span>
                          {currentUser && currentUser.id === u.id && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#c05c3d]/20 text-[#ffb59f] font-mono">
                              (Tú)
                            </span>
                          )}
                        </div>
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
                        <select
                          disabled={isSupervising || isBusy}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as AppRole)}
                          className="bg-[#181614] border border-[#373432] text-xs text-[#faf8f5] px-2 py-1 rounded focus:outline-none focus:border-[#c05c3d] disabled:opacity-50 cursor-pointer"
                          aria-label={`Cambiar rol de ${u.display_name || u.email_display}`}
                        >
                          <option value="student">Estudiante</option>
                          <option value="tutor">Tutor / Director</option>
                          <option value="admin">Administrador</option>
                        </select>
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
                          disabled={isSupervising || isBusy}
                          onClick={() => handleToggleActive(u)}
                          className={`text-[11px] px-2.5 py-1 rounded transition-colors disabled:opacity-50 cursor-pointer ${
                            u.active
                              ? 'text-[#ffb4ab] hover:bg-[#ffb4ab]/10'
                              : 'text-[#8cb89f] hover:bg-[#2d5a3f]/10'
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                          ) : u.active ? (
                            'Desactivar'
                          ) : (
                            'Reactivar'
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Provisión de Usuarios */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#211f1d] border border-[#2c2a27] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2c2a27] pb-3">
              <span className="font-serif text-lg text-white font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#c05c3d]" />
                <span>Provisionar Tutor o Administrador</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar modal"
                className="cursor-pointer"
              >
                <X className="w-5 h-5 text-[#a48b84] hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]" htmlFor="full-name-input">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="full-name-input"
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
                <label className="block text-xs font-bold uppercase text-[#a48b84]" htmlFor="email-input">
                  Correo Institucional
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="docente@universidad.edu"
                    className="w-full pl-9 pr-3 py-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                  />
                </div>
                <span className="text-[10px] text-[#a48b84]">
                  *Si el correo ya está registrado, se promoverá su perfil de forma segura sin duplicar la cuenta.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]" htmlFor="role-select">
                  Rol a Asignar
                </label>
                <select
                  id="role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'tutor' | 'admin')}
                  className="w-full p-2 bg-[#181614] rounded text-xs text-white border border-[#2c2a27] focus:outline-none focus:border-[#c05c3d]"
                >
                  <option value="tutor">Docente Tutor / Director de Tesis</option>
                  <option value="admin">Administrador Institucional</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-[#a48b84]" htmlFor="temp-password-input">
                  Contraseña Temporal de Primer Acceso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a48b84] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="temp-password-input"
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
                  disabled={isSubmittingCreate}
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded bg-[#252220] text-xs text-[#a48b84] hover:bg-[#2c2a27] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 bg-[#c05c3d] hover:bg-[#ab5034] text-white text-xs font-semibold rounded shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCreate && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingCreate ? 'Provisionando...' : 'Confirmar Provisión'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
