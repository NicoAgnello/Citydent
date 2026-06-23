// Formulario principal para crear un nuevo reporte de incidente.
// Es el componente central del flujo de reporte — orquesta todos los demás componentes de /map.
//
// Flujo interno (pantallas que puede mostrar):
//   1. Formulario normal  → título, categoría, descripción, ubicación (MapPicker), fotos
//   2. EmergencyScreen   → si el backend detecta una emergencia al procesar el texto
//   3. SuccessScreen     → si el incidente fue creado con éxito
//
// Props:
//   onSuccess → función sin argumentos, se llama después de mostrar SuccessScreen
//   onClose   → función sin argumentos, se llama al presionar el botón de cerrar/cancelar
//
// El formulario tiene dos pasos en mobile: primero la info básica, luego la ubicación y fotos.
// Al enviar, hace POST a /incidentes con FormData (multipart, incluye imágenes si las hay).
import { useState, useEffect, useRef } from "react";
import { Send, MapPin, AlertCircle, Loader2, X, ChevronRight, ChevronLeft } from "lucide-react";
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

const IncidentForm = ({ onSuccess, onClose }) => {
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
      if (response.data?.isEmergency) {
        setMensajeEmergencia(response.data.message);
        setEmergenciaReportada(true);
      } else {
        setExitoso(true);
        setTimeout(() => onSuccess?.(), 1500);
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

  if (emergenciaReportada) return <EmergencyScreen message={mensajeEmergencia} onDismiss={() => onSuccess?.()} />;
  if (exitoso)             return <SuccessScreen />;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          {/* Indicador de pasos (solo mobile) */}
          <div className="flex gap-1.5 sm:hidden">
            <span className={`w-6 h-1.5 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-slate-200"}`} />
            <span className={`w-6 h-1.5 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-slate-200"}`} />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            {step === 1 ? "Ubicación" : "Detalles del reporte"}
          </DialogTitle>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar"
        >
          <X size={17} />
        </button>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex-1 min-h-0 overflow-y-auto sm:overflow-hidden [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col sm:flex-row h-full">

          {/* ── Columna 1: Mapa ── */}
          {/* Mobile: visible solo en paso 1 | Desktop: siempre visible */}
          <div className={`
            flex-col gap-4 px-6 py-5
            sm:flex sm:w-1/2 sm:border-r sm:border-slate-100 sm:overflow-y-auto sm:[&::-webkit-scrollbar]:hidden
            ${step === 1 ? "flex" : "hidden"}
          `}>
            <p className="text-xs text-slate-400 -mt-1">
              Tu posición en azul · Tocá el mapa para marcar el incidente en rojo
            </p>

            {/* Mapa */}
            <div className="h-72 w-full border border-slate-200 rounded-xl overflow-hidden shrink-0">
              <MapPicker onChange={setUbicacion} className="w-full h-72 z-0" />
            </div>

            {/* Dirección capturada */}
            {fieldErrors.ubicacion ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm">
                <MapPin size={13} className="shrink-0" />
                <span>{fieldErrors.ubicacion}</span>
              </div>
            ) : direccionDisplay ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-light/20 text-brand-dark border border-brand-light/50 text-sm">
                <MapPin size={13} className="shrink-0 text-brand-mid" />
                <span className="font-medium truncate">{direccionDisplay}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border bg-slate-50 border-slate-100 text-slate-400">
                <MapPin size={13} className="shrink-0" />
                <span>Tocá el mapa para marcar la ubicación</span>
              </div>
            )}
          </div>

          {/* ── Columna 2: Detalles ── */}
          {/* Mobile: visible solo en paso 2 | Desktop: siempre visible */}
          <div className={`
            flex-col gap-4 px-6 py-5
            sm:flex sm:w-1/2 sm:overflow-y-auto sm:[&::-webkit-scrollbar]:hidden
            ${step === 2 ? "flex" : "hidden"}
          `}>
            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">¿Qué está pasando?</Label>
              <Input
                name="title"
                placeholder="Ej: Bache profundo, Luminaria rota..."
                className={`rounded-xl bg-slate-50 focus-visible:ring-primary ${
                  fieldErrors.title
                    ? "border-red-400 focus-visible:ring-red-400"
                    : "border-slate-200"
                }`}
                value={formData.title}
                onChange={handleInputChange}
              />
              {fieldErrors.title && (
                <p className="text-xs font-medium text-red-500 mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Categoría</Label>
              <CategorySelect
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, category: value }));
                  clearError("category");
                }}
                className={fieldErrors.category ? "border-red-400" : ""}
              />
              {fieldErrors.category && (
                <p className="text-xs font-medium text-red-500 mt-1">{fieldErrors.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Detalles</Label>
              <Textarea
                name="description"
                placeholder="Danos más información..."
                className={`rounded-xl bg-slate-50 min-h-[96px] focus-visible:ring-primary resize-none ${
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
              <Label className="text-slate-700 font-semibold text-sm">
                Fotos/Videos
                <span className="text-slate-400 font-normal ml-1">(1–3)</span>
              </Label>
              <ImageUploader
                imagenes={imagenes}
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
              Siguiente: Detalles
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
          {submitting ? "Enviando..." : "Cargar Incidente"}
        </Button>

      </div>
    </form>
  );
};

export default IncidentForm;
