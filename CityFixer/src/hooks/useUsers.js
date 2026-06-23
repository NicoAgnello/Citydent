import { useState, useEffect, useCallback } from "react";
import { getUsers, getRoles, createUser, updateUserRole, updateUserBan, updateUserProfile } from "@/services/api";

// Maneja toda la lógica de usuarios para el panel de administración.
// Carga la lista de usuarios y roles, y expone funciones para modificarlos.
// Se usa exclusivamente en AdminUsuariosTab.
//
// Estados que devuelve:
//   users          → lista de usuarios
//   roles          → lista de roles disponibles (user, admin, superAdmin)
//   loading        → true mientras carga la lista inicial
//   loadError      → mensaje de error si falla la carga
//   actionLoading  → objeto { [userId]: "role"|"ban"|"profile"|null }
//                    indica qué operación está en curso para cada usuario
//   actionError    → objeto { [userId]: mensaje } para errores por usuario
//   createLoading  → true mientras se está creando un usuario nuevo
//   createError    → mensaje de error si falla la creación
export function useUsers() {
  const [users, setUsers]             = useState([]);
  const [roles, setRoles]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError]     = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError]     = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersRes.data.users);
      setRoles(rolesRes.data.roles);
    } catch {
      setLoadError("No se pudieron cargar los usuarios. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Muestra un error temporario de 3.5 segundos en la tarjeta del usuario afectado.
  const setCardError = (userId, msg) => {
    setActionError((prev) => ({ ...prev, [userId]: msg }));
    setTimeout(() => setActionError((prev) => ({ ...prev, [userId]: null })), 3500);
  };

  // Cambia el rol de un usuario. Actualiza la lista localmente sin recargar todo.
  const handleRoleChange = async (userId, newRoleId) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "role" }));
    try {
      const res = await updateUserRole(userId, newRoleId);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: res.data.user.role } : u));
    } catch (e) {
      setCardError(userId, e.response?.data?.error ?? "No se pudo cambiar el rol.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  // Crea un nuevo usuario. Devuelve true si tuvo éxito, false si falló.
  const handleCreate = async ({ firstName, lastName, email, roleId }) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createUser({ firstName, lastName, email, ...(roleId && { roleId }) });
      const res = await getUsers();
      setUsers(res.data.users);
      return true;
    } catch (e) {
      setCreateError(e.response?.data?.error ?? "No se pudo crear el usuario.");
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  // Banea o desbanea un usuario. Actualiza la lista localmente sin recargar todo.
  const handleBanToggle = async (userId, isBanned) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "ban" }));
    try {
      const res = await updateUserBan(userId, isBanned);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isBanned: res.data.user.isBanned } : u));
    } catch (e) {
      setCardError(userId, e.response?.data?.error ?? "No se pudo actualizar el estado.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  // Edita el perfil de un usuario (nombre, DNI, dirección, etc.).
  // Devuelve { ok: true } si tuvo éxito, o { ok: false, error: mensaje } si falló.
  const handleProfileEdit = async (userId, body) => {
    setActionLoading((prev) => ({ ...prev, [userId]: "profile" }));
    try {
      const res = await updateUserProfile(userId, body);
      setUsers((prev) => prev.map((u) => u._id === userId ? res.data.user : u));
      return { ok: true };
    } catch (e) {
      const detail = e.response?.data?.details;
      const msg = detail ? detail.join(" · ") : (e.response?.data?.error ?? "No se pudo actualizar el perfil.");
      return { ok: false, error: msg };
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  return {
    users, roles, loading, loadError, refresh,
    actionLoading, actionError, handleRoleChange, handleBanToggle,
    handleCreate, createLoading, createError,
    handleProfileEdit,
  };
}
