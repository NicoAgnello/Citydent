// Formulario principal para crear un nuevo reporte de incidente.
// Es el componente central del flujo de reporte — orquesta todos los demás componentes de /map.
//
// Flujo interno (pantallas que puede mostrar):
//   1. Formulario normal  → "Dónde" (ubicación en MapPicker) y "Qué pasa" (título,
//                           categoría, descripción, fotos)
//   2. EmergencyScreen   → si el backend detecta una emergencia al procesar el texto
//   3. SuccessScreen     → si el incidente fue creado con éxito
//
// Props:
//   onCreated     → función sin argumentos, se llama apenas el backend confirma el reporte
//                   (para refrescar las listas); el modal sigue abierto mostrando el resultado
//   onClose       → función sin argumentos, cierra el modal
//   onViewReports → (opcional) función sin argumentos, ofrece "Ver mis reportes" al terminar
//
// En mobile el formulario se divide en dos pasos (Dónde / Qué pasa); en desktop se ven juntos.
// Al enviar, hace POST a /incidentes con FormData (multipart, incluye imágenes si las hay).
import { useState, useEffect, useRef } from "react";
import { Send, MapPin, AlertCircle, Loader2, X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { postIncidente } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogTitle } from "@/components/ui/dialog";
import MapPicker from "./MapPicker";
import ImageUploader from "./ImageUploader";
import CategorySelect from "./CategorySelect";
import EmergencyScreen from "./EmergencyScreen";
import SuccessScreen from "./SuccessScreen";

const IncidentForm = ({ onCreated, onClose, onViewReports }) => {
  // ── Datos del formulario (sin cambios) ──
  const [ubicacion, setUbicacion]                   = useState(null);
  const [imagenes, setImagenes]                     = useState([]);
  const [formData, setFormData]                     = useState({ title: "", category: "", description: "" });
  const [submitting, setSubmitting]                 = useState(false);
  const [errorSubmit, setErrorSubmit]               = useState(null);
  const [exitoso, setExitoso]                       = useState(false);
  const [emergenciaReportada, setEmergenciaReportada] = useState(false);
  const [mensajeEmergencia, setMensajeEmergencia]   = useState("");

  // ── Paso activo (solo afecta mobile) ──
  const [step, setStep] = useState(1);

  // ── Errores por campo ──
  const [fieldErrors, setFieldErrors] = useState({});

  const imagenesRef = useRef(imagenes);
  imagenesRef.current = imagenes;
  useEffect(() => () => imagenesRef.current.forEach((img) => img.preview && URL.revokeObjectURL(img.preview)), []);

  const clearError = (key) =>
    setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  // Avanzar al paso 2 solo si hay ubicación
  const handleNext = () => {
    if (!ubicacion?.lat || !ubicacion?.lng) {
      setFieldErrors((prev) => ({ ...prev, ubicacion: "Marcá la ubicación en el mapa antes de continuar." }));
      return;
    }
    clearError("ubicacion");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSubmit(null);

    // Validación de campos
    const errors = {};
    if (!ubicacion?.lat || !ubicacion?.lng) {
      errors.ubicacion = "Marcá la ubicación del incidente en el mapa.";
      setStep(1);
    }
    if (!formData.title.trim())       errors.title       = "El título es obligatorio.";
    if (!formData.category)           errors.category    = "Seleccioná una categoría.";
    if (!formData.description.trim()) errors.description = "Agregá una descripción del incidente.";
    if (imagenes.length < 1)          errors.imagenes    = "Adjuntá al menos 1 foto del incidente.";
    if (imagenes.length > 3)          errors.imagenes    = "Podés subir hasta 3 fotos.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("category", formData.category);
    const street  = [ubicacion.calle, ubicacion.numero].filter(Boolean).join(" ");
    const address = [street, ubicacion.ciudad, ubicacion.provincia].filter(Boolean).join(", ");
    data.append("location", JSON.stringify({ lat: ubicacion.lat, lng: ubicacion.lng, address }));
    imagenes.forEach((img) => data.append("photos", img.file));

    try {
      setSubmitting(true);
      const response = await postIncidente(data);
      onCreated?.();
      if (response.data?.isEmergency) {
        setMensajeEmergencia(response.data.message);
        setEmergenciaReportada(true);
      } else {
        setExitoso(true);
      }
    } catch (error) {
      const msg =
        error.response?.data?.details?.join(", ") ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Ocurrió un error al enviar el reporte. Intentá de nuevo.";

      if (error.response?.status === 400 && msg.toLowerCase().includes("villa maría")) {
        setFieldErrors((prev) => ({ ...prev, ubicacion: msg }));
        setStep(1);
      } else {
        setErrorSubmit(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const direccionDisplay = ubicacion
    ? `${ubicacion.calle ?? ""} ${ubicacion.numero ?? ""}, ${ubicacion.barrio ?? ""}`.trim()
    : null;

  if (emergenciaReportada) return <EmergencyScreen message={mensajeEmergencia} onDismiss={() => onClose?.()} />;
  if (exitoso)             return <SuccessScreen onViewReports={onViewReports} onClose={() => onClose?.()} />;

  // Qué pasos ya están completos (para el indicador de progreso del encabezado)
  const dondeListo = !!(ubicacion?.lat && ubicacion?.lng);
  const quePasaListo =
    !!formData.title.trim() && !!formData.category && !!formData.description.trim() && imagenes.length >= 1;

  const inputCls = (hasError) =>
    `h-11 rounded-xl bg-white focus-visible:ring-primary ${
      hasError ? "border-red-400 focus-visible:ring-red-400" : "border-slate-200"
    }`;
  const labelCls = "text-slate-700 font-semibold text-sm";

  // Paso del indicador: botón en mobile (cambia de pantalla), solo informativo en desktop
  const Step = ({ n, label, done, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
        active ? "text-slate-900" : "text-slate-400 sm:text-slate-600"
      } sm:cursor-default`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          done ? "bg-emerald-500 text-white" : active ? "bg-primary text-white sm:bg-slate-200 sm:text-slate-600" : "bg-slate-200 text-slate-500"
        }`}
      >
        {done ? <Check size={13} strokeWidth={3} /> : n}
      </span>
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-900">Cargar incidente</DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={17} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Step n={1} label="Dónde" done={dondeListo} active={step === 1} onClick={() => setStep(1)} />
          <span className="h-px w-8 bg-slate-200" />
          <Step n={2} label="Qué pasa" done={quePasaListo} active={step === 2} onClick={() => dondeListo ? setStep(2) : handleNext()} />
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex-1 min-h-0 overflow-y-auto sm:overflow-hidden [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col sm:flex-row h-full">

          {/* ── Columna 1: Mapa ── */}
          {/* Mobile: visible solo en paso 1 | Desktop: siempre visible */}
          <div className={`
            flex-col gap-3 px-6 py-5
            sm:flex sm:w-[55%] sm:border-r sm:border-slate-100
            ${step === 1 ? "flex" : "hidden"}
          `}>
            <p className="text-sm text-slate-500">
              Tocá el mapa para marcar dónde está el problema. El pin azul es tu posición y el rojo, el incidente.
            </p>

            {/* Mapa con la dirección flotando encima */}
            <div className="relative h-[52dvh] min-h-72 w-full overflow-hidden rounded-xl border border-slate-200 sm:h-auto sm:min-h-0 sm:flex-1">
              <MapPicker onChange={setUbicacion} className="h-full w-full z-0" />
              <div className="pointer-events-none absolute inset-x-3 bottom-3">
                {fieldErrors.ubicacion ? (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 shadow-md">
                    <MapPin size={14} className="shrink-0" />
                    <span>{fieldErrors.ubicacion}</span>
                  </div>
                ) : direccionDisplay ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-md">
                    <MapPin size={14} className="shrink-0 text-red-500" />
                    <span className="truncate font-medium text-slate-800">{direccionDisplay}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 shadow-md">
                    <MapPin size={14} className="shrink-0" />
                    <span>Todavía no marcaste ninguna ubicación</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Columna 2: Detalles ── */}
          {/* Mobile: visible solo en paso 2 | Desktop: siempre visible */}
          <div className={`
            flex-col gap-5 px-6 py-5
            sm:flex sm:w-[45%] sm:overflow-y-auto sm:[&::-webkit-scrollbar]:hidden
            ${step === 2 ? "flex" : "hidden"}
          `}>
            <div className="space-y-1.5">
              <Label className={labelCls}>¿Qué está pasando?</Label>
              <Input
                name="title"
                placeholder="Ej: Bache profundo, luminaria rota..."
                className={inputCls(fieldErrors.title)}
                value={formData.title}
                onChange={handleInputChange}
              />
              {fieldErrors.title && (
                <p className="text-xs font-medium text-red-500 mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Categoría</Label>
              <CategorySelect
                value={formData.category}
                hasError={!!fieldErrors.category}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, category: value }));
                  clearError("category");
                }}
              />
              {fieldErrors.category && (
                <p className="text-xs font-medium text-red-500 mt-1">{fieldErrors.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Detalles</Label>
              <Textarea
                name="description"
                placeholder="Contanos qué viste, desde cuándo y qué tan grave es."
                className={`rounded-xl bg-white min-h-[96px] focus-visible:ring-primary resize-none ${
                  fieldErrors.description
                    ? "border-red-400 focus-visible:ring-red-400"
                    : "border-slate-200"
                }`}
                value={formData.description}
                onChange={handleInputChange}
              />
              {fieldErrors.description && (
                <p className="text-xs font-medium text-red-500 mt-1">{fieldErrors.description}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className={labelCls}>Fotos o videos</Label>
              <ImageUploader
                imagenes={imagenes}
                hasError={!!fieldErrors.imagenes}
                onChange={(nuevas) => {
                  setImagenes(nuevas);
                  if (nuevas.length > imagenes.length) clearError("imagenes");
                }}
                onRemove={(index) => setImagenes((prev) => prev.filter((_, i) => i !== index))}
              />
              {fieldErrors.imagenes && (
                <p className="text-xs font-medium text-red-500 mt-1">{fieldErrors.imagenes}</p>
              )}
            </div>

            {errorSubmit && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-500 text-sm border border-red-100">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {errorSubmit}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Footer con navegación ── */}
      <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-white flex flex-col gap-3">

        {/* Botones de paso (solo mobile) */}
        <div className="sm:hidden">
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium hover:bg-brand-mid transition-colors"
            >
              Siguiente: qué pasa
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={15} />
              Volver al mapa
            </button>
          )}
        </div>

        {/* Botón enviar: visible en paso 2 (mobile) o siempre (desktop) */}
        <Button
          type="submit"
          disabled={submitting}
          className={`w-full h-11 rounded-xl bg-primary hover:bg-brand-mid text-white font-bold disabled:opacity-60 transition-colors ${
            step === 1 ? "hidden sm:flex" : "flex"
          }`}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {submitting ? "Enviando..." : "Cargar incidente"}
        </Button>

      </div>
    </form>
  );
};

export default IncidentForm;
