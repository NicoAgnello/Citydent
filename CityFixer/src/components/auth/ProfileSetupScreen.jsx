import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { sendVerificationCode, patchProfile, getNeighborhoods } from "@/services/api";
import { Combobox } from "@/components/ui/combobox";

const GEOREF = "https://apis.datos.gob.ar/georef/api";

const INPUT_CLS =
  "w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-celestito";

const LABEL_CLS = "text-xs font-semibold text-gray-500 uppercase tracking-wider";

const DNI_REGEX = /^\d{8}$/;
const TELEFONO_REGEX = /^\d{10}$/;
const CODIGO_POSTAL_REGEX = /^\d{4}([A-Za-z]{3})?$/;

const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLS}>{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ComboboxField({ label, error, value, onSelect, options, placeholder, emptyText, disabled, loading }) {
  return (
    <Field label={label} error={error}>
      <Combobox
        value={value}
        onSelect={onSelect}
        options={options}
        placeholder={placeholder}
        emptyText={emptyText}
        disabled={disabled}
        loading={loading}
        className={INPUT_CLS}
      />
    </Field>
  );
}

export default function ProfileSetupScreen({ onComplete, onSignOut }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [neighborhoodsError, setNeighborhoodsError] = useState(false);

  const [provincias, setProvincias] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [provinciaId, setProvinciaId] = useState("");
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [georefError, setGeorefError] = useState(false);

  const [form, setForm] = useState({
    dni: "", telefono: "", direccion: "",
    ciudad: "", barrioId: "", provincia: "", codigoPostal: "",
  });
  const [errors, setErrors] = useState({});

  const [codeSent, setCodeSent] = useState(false);
  const [verificationToken, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const isVillaMaria = normalize(form.ciudad) === "villa maria";

  useEffect(() => {
    fetch(`${GEOREF}/provincias?campos=id,nombre&max=100&orden=nombre`)
      .then((r) => r.json())
      .then(({ provincias }) => setProvincias(provincias ?? []))
      .catch(() => setGeorefError(true))
      .finally(() => setLoadingProvincias(false));
  }, []);

  useEffect(() => {
    if (!provinciaId) { setMunicipios([]); return; }
    setLoadingMunicipios(true);
    fetch(`${GEOREF}/municipios?provincia=${provinciaId}&campos=id,nombre&max=500&orden=nombre`)
      .then((r) => r.json())
      .then(({ municipios }) => setMunicipios(municipios ?? []))
      .catch(() => setGeorefError(true))
      .finally(() => setLoadingMunicipios(false));
  }, [provinciaId]);

  useEffect(() => {
    if (!isVillaMaria || neighborhoods.length > 0) return;
    getNeighborhoods()
      .then(({ data }) => setNeighborhoods(data.neighborhoods ?? []))
      .catch(() => setNeighborhoodsError(true));
  }, [form.ciudad]);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!DNI_REGEX.test(form.dni.replace(/\D/g, "")))
      e.dni = "El DNI debe tener exactamente 8 dígitos.";
    if (!TELEFONO_REGEX.test(form.telefono.replace(/\D/g, "")))
      e.telefono = "El teléfono debe tener exactamente 10 dígitos.";
    if (form.direccion.trim().length < 3)
      e.direccion = "La dirección es obligatoria.";
    if (!form.provincia)
      e.provincia = "Seleccioná una provincia.";
    if (!form.ciudad)
      e.ciudad = "Seleccioná una ciudad.";
    if (isVillaMaria && !form.barrioId)
      e.barrioId = "Seleccioná un barrio.";
    if (!CODIGO_POSTAL_REGEX.test(form.codigoPostal.trim()))
      e.codigoPostal = "Debe tener 4 dígitos o formato CPA (ej: A1234ABC).";
    return e;
  };

  const handleSendCode = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSending(true);
    setServerError(null);
    try {
      await sendVerificationCode();
      setCodeSent(true);
    } catch (err) {
      setServerError(err.response?.data?.error ?? "No se pudo enviar el código.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationToken.trim()) {
      setErrors((prev) => ({ ...prev, token: "Ingresá el código que recibiste." }));
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      await patchProfile({
        dni:               form.dni.replace(/\D/g, ""),
        telefono:          form.telefono.replace(/\D/g, ""),
        direccion:         form.direccion.trim(),
        ciudad:            form.ciudad,
        provincia:         form.provincia,
        codigoPostal:      form.codigoPostal.trim().toUpperCase(),
        verificationToken: verificationToken.trim(),
        ...(isVillaMaria && form.barrioId && { barrioId: form.barrioId }),
      });
      onComplete();
    } catch (err) {
      const detail = err.response?.data?.details;
      if (detail) {
        setServerError(detail.join(" · "));
      } else {
        setServerError(err.response?.data?.error ?? "Error al guardar el perfil.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const provinciaOptions = provincias.map((p) => ({ value: p.id, label: p.nombre }));
  const municipioOptions = municipios.map((m) => ({ value: m.id, label: m.nombre }));
  const barrioOptions = neighborhoods.map((n) => ({ value: n._id, label: n.name }));

  return (
    <div className="min-h-screen bg-azul-oscuro flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-blanquito w-1.5 h-8 rounded-full inline-block" />
            <h1 className="text-white text-2xl font-bold tracking-tight">CityFixer</h1>
          </div>
          <p className="text-white/50 text-xs text-center">Tu ciudad, tu voz</p>
        </div>

        <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="text-azul-oscuro font-bold text-lg">Completá tu perfil</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Necesitamos tus datos para que puedas reportar incidentes.
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              Cerrar sesión
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <Field label="DNI" error={errors.dni}>
              <input
                type="text" inputMode="numeric" maxLength={8}
                placeholder="12345678"
                value={form.dni} onChange={set("dni")}
                className={INPUT_CLS}
              />
            </Field>

            <Field label="Teléfono" error={errors.telefono}>
              <input
                type="text" inputMode="numeric" maxLength={10}
                placeholder="3514001234"
                value={form.telefono} onChange={set("telefono")}
                className={INPUT_CLS}
              />
            </Field>

            <Field label="Dirección" error={errors.direccion}>
              <input
                type="text"
                placeholder="Av. Siempreviva 742"
                value={form.direccion} onChange={set("direccion")}
                className={INPUT_CLS}
              />
            </Field>

            <ComboboxField
              label="Provincia"
              error={errors.provincia ?? (georefError ? "No se pudo cargar. Revisá la conexión." : null)}
              value={form.provincia}
              onSelect={(opt) => {
                setProvinciaId(opt.value);
                setForm((prev) => ({ ...prev, provincia: opt.label, ciudad: "", barrioId: "" }));
                setErrors((prev) => ({ ...prev, provincia: null, ciudad: null, barrioId: null }));
              }}
              options={provinciaOptions}
              placeholder="Seleccioná una provincia..."
              emptyText="No se encontró la provincia."
              disabled={loadingProvincias || georefError}
              loading={loadingProvincias}
            />

            <ComboboxField
              label="Ciudad"
              error={errors.ciudad}
              value={form.ciudad}
              onSelect={(opt) => {
                setForm((prev) => ({ ...prev, ciudad: opt.label, barrioId: "" }));
                setErrors((prev) => ({ ...prev, ciudad: null, barrioId: null }));
              }}
              options={municipioOptions}
              placeholder={!form.provincia ? "Primero seleccioná una provincia" : "Seleccioná una ciudad..."}
              emptyText="No se encontró la ciudad."
              disabled={!form.provincia || loadingMunicipios}
              loading={loadingMunicipios}
            />

            {isVillaMaria && (
              <ComboboxField
                label="Barrio"
                error={errors.barrioId ?? (neighborhoodsError ? "No se pudieron cargar los barrios." : null)}
                value={neighborhoods.find((n) => n._id === form.barrioId)?.name ?? ""}
                onSelect={(opt) => {
                  setForm((prev) => ({ ...prev, barrioId: opt.value }));
                  setErrors((prev) => ({ ...prev, barrioId: null }));
                }}
                options={barrioOptions}
                placeholder="Seleccioná un barrio..."
                emptyText="No se encontró el barrio."
                disabled={neighborhoodsError || neighborhoods.length === 0}
                loading={neighborhoods.length === 0 && !neighborhoodsError}
              />
            )}

            <Field label="Código postal" error={errors.codigoPostal}>
              <input
                type="text" maxLength={7}
                placeholder="5900"
                value={form.codigoPostal} onChange={set("codigoPostal")}
                className={INPUT_CLS}
              />
            </Field>

            <div className="w-full h-px bg-gray-100" />

            {!codeSent ? (
              <>
                {serverError && (
                  <p className="text-xs text-red-500 text-center">{serverError}</p>
                )}
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-azul-oscuro text-white text-sm font-semibold disabled:opacity-50 hover:bg-azul transition-colors"
                >
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    : <><Mail size={15} /> Verificar por mail</>
                  }
                </button>
              </>
            ) : (
              <>
               
                <Field label="Código de verificación" error={errors.token}>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    placeholder="123456"
                    value={verificationToken}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setErrors((prev) => ({ ...prev, token: null }));
                    }}
                    className={INPUT_CLS}
                  />
                   <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <p className="text-xs font-medium">Código enviado a tu correo.</p>
                </div>

                  <p className="text-xs text-gray-400">
                    Si no lo ves, revisá la carpeta de spam o correo no deseado.
                  </p>
                </Field>

                {serverError && (
                  <p className="text-xs text-red-500 text-center">{serverError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !verificationToken.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-azul-oscuro text-white text-sm font-semibold disabled:opacity-50 hover:bg-azul transition-colors"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  Completar perfil
                </button>

                <button
                  type="button"
                  onClick={() => { setCodeSent(false); setToken(""); setServerError(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600 text-center transition-colors"
                >
                  Reenviar código
                </button>
              </>
            )}

          </form>
        </div>

      </div>
    </div>
  );
}