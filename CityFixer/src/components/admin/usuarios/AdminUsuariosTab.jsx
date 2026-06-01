import { useState, useEffect, useMemo } from "react";
import { Search, Shield, ShieldOff, Loader2 } from "lucide-react";
import { getUsers, getRoles, updateUserRole, updateUserBan } from "@/services/api";

const ROLE_LABELS = { user: "Ciudadano", admin: "Admin", superAdmin: "Super Admin" };
const ROLE_STYLES = {
  superAdmin: "bg-azul-oscuro text-white",
  admin:      "bg-celestito text-white",
  user:       "bg-blanquito text-azul-oscuro",
};
const ROLE_TABS = [
  { id: "todos",      label: "Todos"       },
  { id: "user",       label: "Ciudadano"   },
  { id: "admin",      label: "Admin"       },
  { id: "superAdmin", label: "Super Admin" },
];

export default function AdminUsuariosTab() {
  const [users, setUsers]               = useState([]);
  const [roles, setRoles]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState(null);
  const [searchTerm, setSearchTerm]     = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("todos");
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError]   = useState({});

  useEffect(() => {
    Promise.all([getUsers(), getRoles()])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data.users);
        setRoles(rolesRes.data.roles);
      })
      .catch(() => setLoadError("No se pudieron cargar los usuarios. Intentá de nuevo."))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name  = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const q     = searchTerm.toLowerCase();
      const matchesSearch = name.includes(q) || email.includes(q);
      const matchesRole   = activeRoleTab === "todos" || u.role?.name === activeRoleTab;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, activeRoleTab]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-6 bg-[#F8F9FF] min-h-screen">

      {/* Header + buscador */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-[24px] shadow-sm border border-blanquito/30">
        <h2 className="text-xl font-bold text-azul-oscuro shrink-0">Gestión de Usuarios</h2>
        <div className="relative w-full md:w-80 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar nombre o correo..."
            className="w-full pl-8 pr-4 py-2.5 bg-blanquito/40 rounded-xl text-azul-oscuro placeholder-celestito/60 focus:outline-none focus:ring-2 focus:ring-celestito transition-all border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs de roles */}
      <div className="bg-white px-2 rounded-xl shadow-sm border border-blanquito/30 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {ROLE_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveRoleTab(id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeRoleTab === id
                  ? "border-azul-oscuro text-azul-oscuro"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-celestito" />
        </div>
      ) : loadError ? (
        <div className="flex justify-center py-16">
          <p className="text-sm text-red-500 font-medium">{loadError}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredUsers.length > 0 ? filteredUsers.map((user) => {
            const isLoading  = actionLoading[user._id];
            const roleName   = user.role?.name ?? "user";
            const roleStyle  = ROLE_STYLES[roleName] ?? ROLE_STYLES.user;
            const roleLabel  = ROLE_LABELS[roleName] ?? roleName;
            const isSuperAdmin = roleName === "superAdmin";

            return (
              <div
                key={user._id}
                className={`bg-white p-5 rounded-[24px] shadow-sm flex flex-col gap-3 border transition-shadow hover:shadow-md ${
                  user.isBanned ? "border-red-200" : "border-blanquito/30"
                }`}
              >
                {/* Avatar + datos */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blanquito/50 flex items-center justify-center text-azul-oscuro font-bold shrink-0 text-sm">
                    {user.firstName?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-azul-oscuro truncate text-sm">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {user.isBanned && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      Baneado
                    </span>
                  )}
                </div>

                {/* Error de acción */}
                {actionError[user._id] && (
                  <p className="text-[11px] text-red-500 font-medium">{actionError[user._id]}</p>
                )}

                {/* Rol + acciones */}
                <div className="flex items-center justify-between pt-3 border-t border-blanquito/30 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isSuperAdmin ? (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${roleStyle}`}>
                        {roleLabel}
                      </span>
                    ) : (
                      <select
                        value={user.role?._id ?? ""}
                        disabled={!!isLoading}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border-none outline-none cursor-pointer ${roleStyle}`}
                      >
                        {roles
                          .filter((r) => r.name !== "superAdmin" && r.name !== "ai")
                          .map((r) => (
                            <option key={r._id} value={r._id}>
                              {ROLE_LABELS[r.name] ?? r.name}
                            </option>
                          ))}
                      </select>
                    )}
                    {isLoading === "role" && (
                      <Loader2 size={13} className="animate-spin text-celestito" />
                    )}
                  </div>

                  {!isSuperAdmin && (
                    <button
                      onClick={() => handleBanToggle(user._id, !user.isBanned)}
                      disabled={!!isLoading}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition-colors disabled:opacity-50 ${
                        user.isBanned
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                    >
                      {isLoading === "ban" ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : user.isBanned ? (
                        <><ShieldOff size={11} /> Desbanear</>
                      ) : (
                        <><Shield size={11} /> Banear</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-10 text-center text-celestito font-medium bg-white rounded-[24px] border border-blanquito/30">
              No se encontraron usuarios.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
