import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Settings2, Shield, ShieldOff, X, User, Plus, Edit3, Check } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { getNeighborhoods } from "@/services/api";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABELS = { user: "Ciudadano", admin: "Admin", superAdmin: "Super Admin" };

const ROLE_BADGE = {
  superAdmin: "bg-violet-50 text-violet-700 border border-violet-200",
  admin:      "bg-blanquito/30 text-azul border border-blanquito/50",
  user:       "bg-gray-50 text-gray-500 border border-gray-200",
};

function formatRegDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function UserAvatar({ user, size = "md" }) {
  const initials = [user.firstName, user.lastName]
    .filter(Boolean).map((n) => n[0].toUpperCase()).join("").slice(0, 2) || "?";
  const cls = size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs";
  return user.imageUrl ? (
    <img
      src={user.imageUrl}
      alt="avatar"
      className={`${cls} rounded-full object-cover ring-2 ring-slate-100 shrink-0`}
    />
  ) : (
    <div className={`${cls} rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

const EMPTY_FORM = { firstName: "", lastName: "", email: "", roleId: "" };

function validateCreate(form) {
  const errs = {};
  if (!form.email.trim()) errs.email = "El correo es obligatorio.";
  return errs;
}

const PROFILE_EMPTY = { firstName: "", lastName: "", dni: "", telefono: "", direccion: "", ciudad: "", barrioId: "", provincia: "", codigoPostal: "" };
const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

export default function AdminUsuariosTab() {
  const {
    users, roles, loading, loadError,
    actionLoading, actionError, handleRoleChange, handleBanToggle,
    handleCreate, createLoading, createError, handleProfileEdit,
  } = useUsers();

  // ── Barrios ──
  const [neighborhoods, setNeighborhoods] = useState([]);
  useEffect(() => {
    getNeighborhoods().then(({ data }) => setNeighborhoods(data.neighborhoods ?? [])).catch(() => {});
  }, []);

  // ── Filtros ──
  const [searchTerm, setSearchTerm]       = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("todos");

  // ── Sheet de edición ──
  const [selectedUserId, setSelectedUserId] = useState(null);

  // ── Edición de perfil dentro del sheet ──
  const [profileEditing, setProfileEditing]     = useState(false);
  const [profileForm, setProfileForm]           = useState(PROFILE_EMPTY);
  const [profileSaveError, setProfileSaveError] = useState(null);
  const [profileSuccess, setProfileSuccess]     = useState(false);

  // Resetear estado de edición de perfil al cambiar de usuario
  useEffect(() => {
    setProfileEditing(false);
    setProfileSaveError(null);
    setProfileSuccess(false);
  }, [selectedUserId]);
  const selectedUser = useMemo(
    () => users.find((u) => u._id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  // ── Sheet de creación ──
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const filteredUsers = useMemo(() => (
    users.filter((u) => {
      const name  = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const q     = searchTerm.toLowerCase();
      return (name.includes(q) || email.includes(q)) &&
             (activeRoleTab === "todos" || u.role?.name === activeRoleTab);
    })
  ), [users, searchTerm, activeRoleTab]);

  const isSuperAdmin = (u) => u.role?.name === "superAdmin";

  const handleField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    const errs = validateCreate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    const ok = await handleCreate(form);
    if (ok) {
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
    }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setFormErrors({}); setCreateOpen(true); };
  const closeCreate = () => { setCreateOpen(false); setFormErrors({}); };

  // ── Handlers perfil ──
  const openProfileEdit = (user) => {
    setProfileForm({
      firstName:    user.firstName   ?? "",
      lastName:     user.lastName    ?? "",
      dni:          user.dni         ?? "",
      telefono:     user.telefono    ?? "",
      direccion:    user.direccion   ?? "",
      ciudad:       user.ciudad      ?? "",
      barrioId:     user.barrio?._id ?? "",
      provincia:    user.provincia   ?? "",
      codigoPostal: user.codigoPostal ?? "",
    });
    setProfileSaveError(null);
    setProfileEditing(true);
  };

  const closeProfileEdit = () => {
    setProfileEditing(false);
    setProfileSaveError(null);
  };

  const setProfileField = (key) => (e) => {
    setProfileForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const submitProfileEdit = async () => {
    if (!selectedUser) return;
    const body = {};
    if (profileForm.firstName.trim())   body.firstName   = profileForm.firstName.trim();
    if (profileForm.lastName.trim())    body.lastName    = profileForm.lastName.trim();
    if (profileForm.dni.trim())         body.dni         = profileForm.dni.replace(/\D/g, "");
    if (profileForm.telefono.trim())    body.telefono    = profileForm.telefono.replace(/\D/g, "");
    if (profileForm.direccion.trim())   body.direccion   = profileForm.direccion.trim();
    if (profileForm.ciudad.trim())      body.ciudad      = profileForm.ciudad.trim();
    if (profileForm.barrioId)           body.barrioId    = profileForm.barrioId;
    if (profileForm.provincia.trim())   body.provincia   = profileForm.provincia.trim();
    if (profileForm.codigoPostal.trim()) body.codigoPostal = profileForm.codigoPostal.trim().toUpperCase();

    const { ok, error } = await handleProfileEdit(selectedUser._id, body);
    if (ok) {
      setProfileEditing(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileSaveError(error);
    }
  };

  return (
    <div className="min-h-screen">

      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? "Cargando..." : `${users.length} usuario${users.length !== 1 ? "s" : ""} registrados`}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="shrink-0 rounded-xl bg-primary hover:bg-celestito text-white font-semibold gap-1.5"
        >
          <Plus size={15} />
          Nuevo Usuario
        </Button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
        <div className="relative flex-1 min-w-0 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <Select value={activeRoleTab} onValueChange={setActiveRoleTab}>
          <SelectTrigger className="shrink-0 w-full sm:w-44 rounded-xl border-slate-200 text-sm focus:ring-primary/20">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            <SelectItem value="user">Ciudadano</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="superAdmin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Cuerpo ── */}
      {loadError ? (
        <div className="py-16 text-center">
          <p className="text-sm text-red-500">{loadError}</p>
        </div>
      ) : !loading && filteredUsers.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400">No se encontraron usuarios.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP: tabla */}
          <Card className="hidden md:block border-slate-100 shadow-none overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="pl-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Usuario
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Rol
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Registro
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-28 bg-slate-100 rounded-full animate-pulse" />
                            <div className="h-3 w-36 bg-slate-100 rounded-full animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : (
                  filteredUsers.map((user) => {
                    const roleName = user.role?.name ?? "user";
                    return (
                      <TableRow key={user._id} className="hover:bg-slate-50/80">
                        {/* Usuario */}
                        <TableCell className="pl-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                {user.isBanned && (
                                  <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    Suspendido
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Rol */}
                        <TableCell className="py-2.5">
                          <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ROLE_BADGE[roleName] ?? ROLE_BADGE.user}`}>
                            {ROLE_LABELS[roleName] ?? roleName}
                          </span>
                        </TableCell>

                        {/* Fecha registro */}
                        <TableCell className="py-2.5 text-xs text-slate-500">
                          {formatRegDate(user.createdAt)}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="py-2.5 pr-4">
                          {!isSuperAdmin(user) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="group p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none">
                                <Settings2 size={15} className="transition-transform duration-200 group-hover:rotate-45" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => setSelectedUserId(user._id)}
                                  className="gap-2 cursor-pointer text-sm"
                                >
                                  <User size={13} />
                                  Editar usuario
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleBanToggle(user._id, !user.isBanned)}
                                  disabled={!!actionLoading[user._id]}
                                  className={`gap-2 cursor-pointer text-sm ${user.isBanned ? "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50" : "text-red-500 focus:text-red-500 focus:bg-red-50"}`}
                                >
                                  {actionLoading[user._id] === "ban"
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : user.isBanned ? <ShieldOff size={13} /> : <Shield size={13} />
                                  }
                                  {user.isBanned ? "Desbanear" : "Banear"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>

          {/* MOBILE: filas compactas */}
          <div className="md:hidden flex flex-col gap-2.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3.5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-100 rounded-full" />
                      <div className="h-3 w-16 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-slate-100 rounded-lg" />
                </div>
              ))
            ) : (
              filteredUsers.map((user) => {
                const roleName = user.role?.name ?? "user";
                return (
                  <div
                    key={user._id}
                    className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[roleName] ?? ROLE_BADGE.user}`}>
                            {ROLE_LABELS[roleName] ?? roleName}
                          </span>
                          {user.isBanned && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                              Suspendido
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isSuperAdmin(user) && (
                      <button
                        onClick={() => setSelectedUserId(user._id)}
                        className="group shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        <Settings2 size={16} className="transition-transform duration-200 group-hover:rotate-45" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── Sheet de edición ── */}
      <Sheet open={!!selectedUser} onOpenChange={(v) => !v && setSelectedUserId(null)}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-md p-0 flex flex-col bg-white"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Editar Usuario
            </SheetTitle>
            <button
              onClick={() => setSelectedUserId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {selectedUser && (
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden">

              {/* Datos del usuario */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <UserAvatar user={selectedUser} size="lg" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{selectedUser.email}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Registrado: {formatRegDate(selectedUser.createdAt)}
                  </p>
                </div>
              </div>

              {/* Cambio de rol */}
              {!isSuperAdmin(selectedUser) && (
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700">Rol</Label>
                  <Select
                    value={selectedUser.role?._id ?? ""}
                    onValueChange={(v) => handleRoleChange(selectedUser._id, v)}
                    disabled={actionLoading[selectedUser._id] === "role"}
                  >
                    <SelectTrigger className="w-full rounded-xl border-slate-200 text-sm focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((r) => r.name !== "superAdmin" && r.name !== "ai")
                        .map((r) => (
                          <SelectItem key={r._id} value={r._id}>
                            {ROLE_LABELS[r.name] ?? r.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {actionLoading[selectedUser._id] === "role" && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Loader2 size={12} className="animate-spin" />
                      Guardando cambio de rol...
                    </div>
                  )}
                </div>
              )}

              {/* Ban / Unban */}
              {!isSuperAdmin(selectedUser) && (
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium text-slate-700">Estado de cuenta</Label>
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${selectedUser.isBanned ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedUser.isBanned ? "Cuenta suspendida" : "Cuenta activa"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedUser.isBanned
                          ? "El usuario no puede realizar acciones."
                          : "El usuario tiene acceso completo."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoading[selectedUser._id] === "ban"}
                      onClick={() => handleBanToggle(selectedUser._id, !selectedUser.isBanned)}
                      className={`shrink-0 rounded-xl text-xs font-semibold ${
                        selectedUser.isBanned
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      {actionLoading[selectedUser._id] === "ban" ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : selectedUser.isBanned ? (
                        <><ShieldOff size={13} className="mr-1" /> Desbanear</>
                      ) : (
                        <><Shield size={13} className="mr-1" /> Banear</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Datos del perfil */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Datos del perfil</p>
                  <div className="flex items-center gap-2">
                    {profileSuccess && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check size={12} /> Guardado
                      </span>
                    )}
                    {!profileEditing ? (
                      <button
                        onClick={() => openProfileEdit(selectedUser)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-celestito transition-colors"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={closeProfileEdit}
                          disabled={actionLoading[selectedUser._id] === "profile"}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={submitProfileEdit}
                          disabled={actionLoading[selectedUser._id] === "profile"}
                          className="flex items-center gap-1 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-celestito transition-colors disabled:opacity-60"
                        >
                          {actionLoading[selectedUser._id] === "profile"
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Check size={11} />
                          }
                          {actionLoading[selectedUser._id] === "profile" ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!profileEditing ? (
                  /* Vista */
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                    {[
                      { label: "Nombre",        value: `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim() },
                      { label: "DNI",           value: selectedUser.dni },
                      { label: "Teléfono",      value: selectedUser.telefono },
                      { label: "Dirección",     value: selectedUser.direccion },
                      { label: "Ciudad",        value: selectedUser.ciudad },
                      { label: "Barrio",        value: selectedUser.barrio?.name },
                      { label: "Provincia",     value: selectedUser.provincia },
                      { label: "Cód. Postal",   value: selectedUser.codigoPostal },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs text-slate-400 shrink-0">{label}</span>
                        <span className="text-xs font-medium text-slate-700 truncate ml-3 text-right">
                          {value || <span className="text-slate-300 italic">—</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Edición */
                  <div className="flex flex-col gap-3">
                    {profileSaveError && (
                      <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                        {profileSaveError}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "firstName", label: "Nombre",   ph: "Lucía" },
                        { key: "lastName",  label: "Apellido", ph: "García" },
                      ].map(({ key, label, ph }) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                          <input value={profileForm[key]} onChange={setProfileField(key)} placeholder={ph} className={INPUT_CLS} />
                        </div>
                      ))}
                    </div>
                    {[
                      { key: "dni",          label: "DNI",           ph: "12345678",       mode: "numeric" },
                      { key: "telefono",     label: "Teléfono",      ph: "3514001234",     mode: "numeric" },
                      { key: "direccion",    label: "Dirección",     ph: "Av. Siempreviva 742" },
                      { key: "ciudad",       label: "Ciudad",        ph: "Villa María" },
                      { key: "provincia",    label: "Provincia",     ph: "Córdoba" },
                      { key: "codigoPostal", label: "Código postal", ph: "5900" },
                    ].map(({ key, label, ph, mode }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
                        <input
                          value={profileForm[key]}
                          onChange={setProfileField(key)}
                          placeholder={ph}
                          inputMode={mode}
                          className={INPUT_CLS}
                        />
                      </div>
                    ))}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Barrio</label>
                      <Combobox
                        value={neighborhoods.find((n) => n._id === profileForm.barrioId)?.name ?? ""}
                        onSelect={(opt) => setProfileForm((prev) => ({ ...prev, barrioId: opt.value }))}
                        options={neighborhoods.map((n) => ({ value: n._id, label: n.name }))}
                        placeholder="Seleccioná un barrio..."
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error de acción */}
              {actionError[selectedUser._id] && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                  {actionError[selectedUser._id]}
                </p>
              )}

            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Sheet de creación ── */}
      <Sheet open={createOpen} onOpenChange={(v) => !v && closeCreate()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-md p-0 flex flex-col bg-white"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Nuevo Usuario
            </SheetTitle>
            <button
              onClick={closeCreate}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden">
            <form onSubmit={handleSubmitCreate} noValidate className="flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-3">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Nombre</Label>
                  <Input
                    value={form.firstName}
                    onChange={handleField("firstName")}
                    placeholder="Ej: Lucía"
                    className={`rounded-xl border-slate-200 focus-visible:ring-primary/30 ${formErrors.firstName ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>
                  )}
                </div>

                {/* Apellido */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Apellido</Label>
                  <Input
                    value={form.lastName}
                    onChange={handleField("lastName")}
                    placeholder="Ej: García"
                    className={`rounded-xl border-slate-200 focus-visible:ring-primary/30 ${formErrors.lastName ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Correo electrónico</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={handleField("email")}
                  placeholder="correo@ejemplo.com"
                  className={`rounded-xl border-slate-200 focus-visible:ring-primary/30 ${formErrors.email ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Rol */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Rol <span className="text-slate-400 font-normal">(opcional)</span>
                </Label>
                <Select
                  value={form.roleId}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, roleId: v }))}
                >
                  <SelectTrigger className="rounded-xl border-slate-200 text-sm focus:ring-primary/20">
                    <SelectValue placeholder="Seleccionar rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((r) => r.name !== "superAdmin" && r.name !== "ai")
                      .map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {ROLE_LABELS[r.name] ?? r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Error de servidor */}
              {createError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                  {createError}
                </p>
              )}

              <Button
                type="submit"
                disabled={createLoading}
                className="w-full rounded-xl bg-primary hover:bg-celestito text-white font-semibold mt-2"
              >
                {createLoading && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                Crear usuario
              </Button>

            </form>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
