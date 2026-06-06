import { useState, useEffect } from "react";
import { getUsers, getRoles, createUser, updateUserRole, updateUserBan } from "@/services/api";

export function useUsers() {
  const [users, setUsers]             = useState([]);
  const [roles, setRoles]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError]     = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError]     = useState(null);

  useEffect(() => {
    Promise.all([getUsers(), getRoles()])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data.users);
        setRoles(rolesRes.data.roles);
      })
      .catch(() => setLoadError("No se pudieron cargar los usuarios. Intentá de nuevo."))
      .finally(() => setLoading(false));
  }, []);

  const setCardError = (userId, msg) => {
    setActionError((prev) => ({ ...prev, [userId]: msg }));
    setTimeout(() => setActionError((prev) => ({ ...prev, [userId]: null })), 3500);
  };

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

  const handleCreate = async ({ firstName, lastName, email, password, roleId }) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createUser({ firstName, lastName, email, password, ...(roleId && { role: roleId }) });
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

  return {
    users, roles, loading, loadError,
    actionLoading, actionError, handleRoleChange, handleBanToggle,
    handleCreate, createLoading, createError,
  };
}
