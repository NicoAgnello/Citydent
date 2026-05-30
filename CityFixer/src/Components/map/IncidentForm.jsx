import { useState } from "react";
import { Send, MapPin, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { postIncidente } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import MapPicker from "./MapPicker";
import ImageUploader from "./ImageUploader";
import CategorySelect from "./CategorySelect";

const IncidentForm = ({ onSuccess }) => {
  const [ubicacion, setUbicacion] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [formData, setFormData] = useState({ title: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [exitoso, setExitoso] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSubmit(null);

    if (!ubicacion?.lat || !ubicacion?.lng) {
      setErrorSubmit("Marcá la ubicación del incidente en el mapa.");
      return;
    }
    if (imagenes.length < 1 || imagenes.length > 3) {
      setErrorSubmit("Adjuntá entre 1 y 3 fotos del incidente.");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("category", formData.category);
    // location como JSON string — el middleware del back debe parsearlo
    const street  = [ubicacion.calle, ubicacion.numero].filter(Boolean).join(" ");
    const address = [street, ubicacion.ciudad, ubicacion.provincia].filter(Boolean).join(", ");
    data.append("location", JSON.stringify({ lat: ubicacion.lat, lng: ubicacion.lng, address }));
    imagenes.forEach((img) => data.append("photos", img.file));

    try {
      setSubmitting(true);
      await postIncidente(data);
      setExitoso(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (error) {
      const msg =
        error.response?.data?.details?.join(", ") ||
        error.response?.data?.error ||
        "Ocurrió un error al enviar el reporte. Intentá de nuevo.";
      setErrorSubmit(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const direccionDisplay = ubicacion
    ? `${ubicacion.calle} ${ubicacion.numero}, ${ubicacion.barrio}`.trim()
    : null;

  if (exitoso) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-6">
        <CheckCircle2 size={52} className="text-green-500" strokeWidth={1.5} />
        <p className="text-lg font-bold text-azul-oscuro">¡Reporte enviado!</p>
        <p className="text-sm text-gray-400 text-center">
          Tu incidente fue registrado correctamente. Gracias por contribuir.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Ubicación</Label>
            <p className="text-xs text-gray-400 ml-1 -mt-1">
              Tu posición en azul. Tocá el mapa para marcar el incidente en rojo.
            </p>
            <MapPicker onChange={setUbicacion} className="w-full h-52 rounded-2xl z-0" />
            {direccionDisplay && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-blanquito/50 rounded-2xl">
                <MapPin size={13} className="text-celestito shrink-0" />
                <span className="text-sm text-azul font-medium truncate">
                  {direccionDisplay}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">¿Qué está pasando?</Label>
            <Input
              name="title"
              placeholder="Ej: Bache profundo, Luminaria rota..."
              className="rounded-2xl border-none bg-blanquito/50 p-6 focus-visible:ring-2 focus-visible:ring-celestito"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Categoría</Label>
            <CategorySelect
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Detalles</Label>
            <Textarea
              name="description"
              placeholder="Danos más información..."
              className="rounded-2xl border-none bg-blanquito/50 p-4 min-h-[100px] focus-visible:ring-2 focus-visible:ring-celestito"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Fotos</Label>
            <ImageUploader
              imagenes={imagenes}
              onChange={(nuevas) => setImagenes((prev) => [...prev, ...nuevas])}
              onRemove={(index) => setImagenes((prev) => prev.filter((_, i) => i !== index))}
            />
          </div>

          {errorSubmit && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-500 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {errorSubmit}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-azul-oscuro hover:bg-azul font-bold text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {submitting ? "Enviando..." : "Enviar Reporte"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default IncidentForm;
