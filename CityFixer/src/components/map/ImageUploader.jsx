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
import { ImagePlus, X, AlertCircle, Play } from "lucide-react";

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

export default function ImageUploader({ imagenes, onChange, onRemove, hasError = false, roomy = false }) {
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  // Valida y agrega los archivos elegidos (por el selector o arrastrados).
  const addFiles = async (fileList) => {
    if (!fileList?.length) return;
    setError(null);

    const disponibles = MAX_FOTOS - imagenes.length;
    const files = Array.from(fileList).slice(0, disponibles);

    const nuevas = [];
    const errors = [];
    for (const file of files) {
      if (file.size > 10485760) {
        errors.push("Un archivo supera el límite de 10MB.");
        continue;
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        errors.push("Solo se pueden subir fotos o videos.");
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
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleRemove = (index) => {
    URL.revokeObjectURL(imagenes[index].preview);
    setError(null);
    onRemove(index);
  };

  const limite = imagenes.length >= MAX_FOTOS;

  return (
    <div className={`flex flex-col gap-2.5 ${roomy ? "flex-1" : ""}`}>
      {!limite && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 text-left transition-colors ${roomy ? "sm:min-h-44 sm:flex-1 sm:flex-col sm:justify-center sm:gap-2 sm:py-8 sm:text-center" : ""} ${
            dragging
              ? "border-primary bg-primary/10"
              : hasError
                ? "border-red-300 bg-red-50/40"
                : "border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-primary/5"
          }`}
        >
          <ImagePlus size={22} className="shrink-0 text-primary" />
          <span className={`flex flex-col ${roomy ? "sm:items-center" : ""}`}>
            <span className="text-sm font-medium text-slate-700">
              {imagenes.length === 0 ? "Tocá para sumar fotos o arrastralas acá" : "Sumar otra foto"}
            </span>
            <span className="text-xs text-slate-400">Al menos 1 · máximo 10MB · videos hasta 20s</span>
          </span>
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}

      {imagenes.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {imagenes.map((img, index) => (
            <div key={img.preview} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              {img.type === "video" ? (
                <>
                  <video src={img.preview} className="h-full w-full bg-black object-cover" muted playsInline preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play size={18} className="fill-white text-white" />
                  </div>
                </>
              ) : (
                <img src={img.preview} alt={`foto-${index + 1}`} className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Quitar archivo ${index + 1}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        imagenes.length > 0 && (
          <p className="text-xs text-slate-400">{imagenes.length}/{MAX_FOTOS} archivos</p>
        )
      )}
    </div>
  );
}
