// Tab "Perfil" — muestra y permite editar los datos personales del usuario.
// Cada campo (DNI, teléfono, barrio, código postal) tiene un botón de lápiz que
// lo activa para edición inline. Los cambios se validan con los mismos regex que el back-end
// antes de hacer PATCH al servidor.
// Si el municipio es Villa María, aparece un selector de barrio (igual que en ProfileSetupScreen).
// También muestra el avatar, nombre y email de Clerk (no editables desde acá).
//
// No recibe props — obtiene todo de Clerk (useUser) y de la API interna (getMyProfile).
//
// Se usa en Home.jsx como contenido del tab "perfil".
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  LogOut, MapPin, Building2, Hash, Edit3, Check, X, Loader2, Lock, IdCard,
} from "lucide-react";
import SupportInfo from "./SupportInfo";
import { STATUS_KEYS } from "@/lib/incidents";
import { getMyProfile, patchProfile, getNeighborhoods } from "@/services/api";
import { Combobox } from "@/components/ui/combobox";

// ─── Validaciones (espejo del back-end) ──────────────────────────────────────
const DNI_REGEX        = /^\d{8}$/;
const TELEFONO_REGEX   = /^\d{10}$/;
const CP_REGEX         = /^\d{4}([A-Za-z]{3})?$/;

const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const isVillaMaria = (ciudad) => normalize(ciudad) === "villa maria";

function validate(form, hasDni) {
  const e = {};
  if (!hasDni && !DNI_REGEX.test(form.dni.replace(/\D/g, "")))
    e.dni = "8 dígitos numéricos.";
  if (!TELEFONO_REGEX.test(form.telefono.replace(/\D/g, "")))
    e.telefono = "10 dígitos numéricos.";
  if (form.direccion.trim().length < 3)
    e.direccion = "Mínimo 3 caracteres.";
  if (form.ciudad.trim().length < 2)
    e.ciudad = "Campo obligatorio.";
  if (isVillaMaria(form.ciudad) && !form.barrioId)
    e.barrioId = "Seleccioná un barrio.";
  if (form.provincia.trim().length < 2)
    e.provincia = "Campo obligatorio.";
  if (!CP_REGEX.test(form.codigoPostal.trim()))
    e.codigoPostal = "4 dígitos o formato CPA.";
  return e;
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────
function FieldRow({ icon: Icon, label, value, dim }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${dim ? "text-slate-400 italic" : "text-slate-800"}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function EditField({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-mid focus:border-transparent transition-all";
const INPUT_DISABLED = "w-full rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed";

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PerfilTab({ incidents, loading }) {
  const { user }   = useUser();
  const { signOut } = useClerk();

  const [profile, setProfile]         = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [neighborhoods, setNeighborhoods]   = useState([]);
  const [editing, setEditing]         = useState(false);
  const [form, setForm]               = useState({});
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState(false);
  const [serverError, setServerError] = useState(null);

  // Cargar perfil y barrios en paralelo
  useEffect(() => {
    Promise.all([
      getMyProfile().then(({ data }) => data.user),
      getNeighborhoods().then(({ data }) => data.neighborhoods ?? []),
    ])
      .then(([prof, hoods]) => {
        setProfile(prof);
        setNeighborhoods(hoods);
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long" })
    : null;

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean).map((n) => n[0].toUpperCase()).join("").slice(0, 2) || "?";

  const stats = [
    { label: "Reportados", value: incidents.length },
    { label: "Resueltos",  value: incidents.filter((i) => i.status?.name === STATUS_KEYS.RESOLVED).length },
    { label: "En proceso", value: incidents.filter((i) => i.status?.name === STATUS_KEYS.IN_PROCESS).length },
  ];

  const handleEdit = () => {
    if (!profile) return;
    setForm({
      dni:         profile.dni ?? "",
      telefono:    profile.telefono ?? "",
      direccion:   profile.direccion ?? "",
      ciudad:      profile.ciudad ?? "",
      barrioId:    profile.barrio?._id ?? "",
      provincia:   profile.provincia ?? "",
      codigoPostal: profile.codigoPostal ?? "",
    });
    setErrors({});
    setServerError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setServerError(null);
  };

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSave = async () => {
    const hasDni = !!profile?.dni;
    const errs   = validate(form, hasDni);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setServerError(null);
    try {
      const { data } = await patchProfile({
        ...(hasDni ? {} : { dni: form.dni.replace(/\D/g, "") }),
        telefono:     form.telefono.replace(/\D/g, ""),
        direccion:    form.direccion.trim(),
        ciudad:       form.ciudad.trim(),
        provincia:    form.provincia.trim(),
        codigoPostal: form.codigoPostal.trim().toUpperCase(),
        ...(isVillaMaria(form.ciudad) && form.barrioId && { barrioId: form.barrioId }),
      });
      setProfile(data.user);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const detail = err.response?.data?.details;
      setServerError(detail ? detail.join(" · ") : (err.response?.data?.error ?? "Error al guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">

      {/* ── Avatar + nombre ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="avatar"
              className="h-16 w-16 rounded-full border-2 border-white shadow object-cover shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-lg leading-tight truncate">
              {user?.fullName ?? "Ciudadano"}
            </h2>
            <p className="text-sm text-slate-500 truncate mt-0.5">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            {joinedDate && (
              <p className="text-xs text-slate-400 mt-1">Miembro desde {joinedDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Datos personales ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header de la sección */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Datos personales</p>
          <div className="flex items-center gap-2">
            {success && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check size={13} /> Guardado
              </span>
            )}
            {!editing ? (
              <button
                onClick={handleEdit}
                disabled={profileLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-brand-mid transition-colors disabled:opacity-40"
              >
                <Edit3 size={13} />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={13} /> Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-brand-mid transition-colors disabled:opacity-60"
                >
                  {saving
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Check size={12} />
                  }
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="px-5 py-4">
          {profileLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-2.5 w-16 rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-3.5 w-36 rounded-full bg-slate-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : !editing ? (
            /* ── Modo vista ── */
            <div className="divide-y divide-slate-50">
              <FieldRow icon={IdCard}    label="DNI"           value={profile?.dni} />
              <FieldRow icon={Hash}      label="Teléfono"      value={profile?.telefono} />
              <FieldRow icon={MapPin}    label="Dirección"     value={profile?.direccion} />
              <FieldRow icon={Building2} label="Ciudad"        value={profile?.ciudad} />
              <FieldRow icon={Building2} label="Barrio"        value={profile?.barrio?.name} />
              <FieldRow icon={MapPin}    label="Provincia"     value={profile?.provincia} />
              <FieldRow icon={Hash}      label="Código postal" value={profile?.codigoPostal} />
            </div>
          ) : (
            /* ── Modo edición ── */
            <div className="flex flex-col gap-4">
              {serverError && (
                <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-600">{serverError}</p>
                </div>
              )}

              {/* DNI — inmutable si ya está seteado */}
              <EditField label="DNI" error={errors.dni}>
                {profile?.dni ? (
                  <div className="relative">
                    <input value={profile.dni} disabled className={INPUT_DISABLED} />
                    <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                ) : (
                  <input
                    type="text" inputMode="numeric" maxLength={8}
                    placeholder="12345678"
                    value={form.dni} onChange={set("dni")}
                    className={INPUT_CLS}
                  />
                )}
                {profile?.dni && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock size={10} /> El DNI no puede modificarse una vez registrado.
                  </p>
                )}
              </EditField>

              <EditField label="Teléfono" error={errors.telefono}>
                <input
                  type="text" inputMode="numeric" maxLength={10}
                  placeholder="3514001234"
                  value={form.telefono} onChange={set("telefono")}
                  className={INPUT_CLS}
                />
              </EditField>

              <EditField label="Dirección" error={errors.direccion}>
                <input
                  type="text"
                  placeholder="Av. Siempreviva 742"
                  value={form.direccion} onChange={set("direccion")}
                  className={INPUT_CLS}
                />
              </EditField>

              <div className="grid grid-cols-2 gap-3">
                <EditField label="Ciudad" error={errors.ciudad}>
                  <input
                    type="text"
                    placeholder="Villa María"
                    value={form.ciudad} onChange={set("ciudad")}
                    className={INPUT_CLS}
                  />
                </EditField>
                <EditField label="Provincia" error={errors.provincia}>
                  <input
                    type="text"
                    placeholder="Córdoba"
                    value={form.provincia} onChange={set("provincia")}
                    className={INPUT_CLS}
                  />
                </EditField>
              </div>

              {isVillaMaria(form.ciudad) && (
                <EditField label="Barrio" error={errors.barrioId}>
                  <Combobox
                    value={neighborhoods.find((n) => n._id === form.barrioId)?.name ?? ""}
                    onSelect={(opt) => {
                      setForm((prev) => ({ ...prev, barrioId: opt.value }));
                      setErrors((prev) => ({ ...prev, barrioId: null }));
                    }}
                    options={neighborhoods.map((n) => ({ value: n._id, label: n.name }))}
                    placeholder="Seleccioná un barrio..."
                    className={INPUT_CLS}
                  />
                </EditField>
              )}

              <EditField label="Código postal" error={errors.codigoPostal}>
                <input
                  type="text" maxLength={7}
                  placeholder="5900"
                  value={form.codigoPostal} onChange={set("codigoPostal")}
                  className={INPUT_CLS}
                />
              </EditField>

            </div>
          )}
        </div>
      </div>

      {/* ── Actividad ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Actividad</p>
        {loading ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-7 w-10 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-2.5 w-14 rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ayuda y soporte ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ayuda y soporte</p>
        </div>
        <SupportInfo />
      </div>

      {/* ── Cerrar sesión ─────────────────────────────────────────────── */}
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 bg-white text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
      >
        <LogOut size={15} />
        Cerrar sesión
      </button>

    </div>
  );
}
