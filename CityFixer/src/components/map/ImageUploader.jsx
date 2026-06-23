// Componente para adjuntar fotos o videos a un reporte de incidente.
// Límites: máximo 3 archivos, videos no pueden superar 20 segundos.
// Muestra previsualizaciones de las imágenes y permite eliminar cada una.
// La validación de duración del video se hace localmente antes de enviarlo.
//
// Props:
//   onChange → función que recibe el array actualizado de archivos seleccionados
//
// Se usa dentro de IncidentForm como campo opcional de adjuntos.
import { useState } from "react";
import { Camera, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FOTOS = 3;

const validateVideoDuration = (previewUrl) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const timeout = setTimeout(() => resolve(false), 5000);
    video.onloadedmetadata = () => { clearTimeout(timeout); resolve(video.duration <= 20); };
    video.onerror = () => { clearTimeout(timeout); resolve(false); };
    video.src = previewUrl;
  });
};

export default function ImageUploader({ imagenes, onChange, onRemove }) {
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    setError(null);

    const disponibles = MAX_FOTOS - imagenes.length;
    const files = Array.from(e.target.files).slice(0, disponibles);

    const nuevas = [];
    const errors = [];
    for (const file of files) {
      if (file.size > 10485760) {
        errors.push("Un archivo supera el límite de 10MB.");
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      const preview = URL.createObjectURL(file);

      if (isVideo) {
        const isValid = await validateVideoDuration(preview);
        if (!isValid) {
          URL.revokeObjectURL(preview);
          errors.push("Un video supera los 20 segundos permitidos.");
          continue;
        }
      }

      nuevas.push({ file, preview, type: isVideo ? "video" : "image" });
    }

    if (errors.length) setError([...new Set(errors)].join(" "));
    onChange([...imagenes, ...nuevas]);
    e.target.value = "";
  };

  const handleRemove = (index) => {
    URL.revokeObjectURL(imagenes[index].preview);
    setError(null);
    onRemove(index);
  };

  const limite = imagenes.length >= MAX_FOTOS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {!limite && (
          <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-brand-light/30 border-2 border-dashed border-brand-mid/30 cursor-pointer">
            <Camera className="text-brand-mid" size={20} />
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
        {imagenes.map((img, index) => (
          <div key={img.preview} className="relative w-20 h-20">
            {img.type === "video" ? (
              <video
                src={img.preview}
                className="w-full h-full object-cover rounded-2xl bg-black"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={img.preview}
                alt={`foto-${index + 1}`}
                className="w-full h-full object-cover rounded-2xl"
              />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-red-500 ml-1">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <p className="text-xs text-gray-400 ml-1">
          {imagenes.length}/{MAX_FOTOS} archivos · máximo 10MB · videos hasta 20s
        </p>
      )}
    </div>
  );
}