// Galería de fotos y videos adjuntos a un incidente.
// Muestra una fila de miniaturas. Al hacer clic en una, se abre en un Dialog a pantalla
// completa (foto grande o video con controles nativos del navegador).
// Acepta tanto URLs de string como objetos { url, type } del uploader.
// Si una imagen no carga, muestra un ícono de ImageOff como fallback.
//
// Props:
//   media → array de items (string URL o { url, type }) — fotos y videos del incidente
//
// Se usa en IncidentDetailSheet (vista usuario) y en AdminIncidentDetailSheet (vista admin).
import { useState } from "react";
import { ImageOff, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Detecta si una entrada es video, aceptando tanto string URL como objeto { url, type }
function normalizeMedia(item) {
  if (!item) return { url: "", type: "image" };
  if (typeof item === "string") {
    const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(item);
    return { url: item, type: isVideo ? "video" : "image" };
  }
  // objeto { url, type } o { preview, type } del uploader
  return { url: item.url ?? item.preview, type: item.type ?? "image" };
}

function MediaThumb({ item, onClick, className }) {
  const { url, type } = normalizeMedia(item);
  if (type === "video") {
    return (
      <div className={`relative bg-black cursor-pointer group ${className}`} onClick={onClick}>
        <video
          src={url}
          className="w-full h-full object-cover opacity-80"
          muted
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-2 group-hover:bg-black/70 transition-colors">
            <Play size={18} className="text-white fill-white" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      onClick={onClick}
      className={`${className} cursor-pointer hover:opacity-85 transition-opacity`}
    />
  );
}

function LightboxContent({ item }) {
  const { url, type } = normalizeMedia(item);
  if (type === "video") {
    return (
      <video
        src={url}
        className="w-full max-h-[85vh] object-contain"
        controls
        autoPlay
        playsInline
      />
    );
  }
  return <img src={url} alt="foto ampliada" className="w-full max-h-[85vh] object-contain" />;
}

export default function PhotoGallery({ photos, compact = false }) {
  const [lightbox, setLightbox] = useState(null);

  if (!photos?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 bg-gray-50 rounded-2xl">
        <ImageOff size={28} className="text-gray-300" />
        <p className="text-xs text-gray-400">Sin fotos adjuntas</p>
      </div>
    );
  }

  const compactCols =
    photos.length === 1 ? "grid-cols-1" :
    photos.length === 2 ? "grid-cols-2" :
    "grid-cols-3";

  return (
    <>
      {compact ? (
        <div className={`grid ${compactCols} gap-2`}>
          {photos.map((item, i) => (
            <MediaThumb
              key={normalizeMedia(item).url || i}
              item={item}
              onClick={() => setLightbox(item)}
              className={
                photos.length === 1
                  ? "w-full max-h-72 rounded-xl object-cover"
                  : "aspect-square w-full rounded-xl object-cover"
              }
            />
          ))}
        </div>
      ) : photos.length === 1 ? (
        <MediaThumb
          item={photos[0]}
          onClick={() => setLightbox(photos[0])}
          className="w-full max-h-64 rounded-2xl object-contain bg-gray-50"
        />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {photos.map((item, i) => (
            <MediaThumb
              key={normalizeMedia(item).url || i}
              item={item}
              onClick={() => setLightbox(item)}
              className="h-52 w-52 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-5xl p-0 bg-black border-none overflow-hidden" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Media ampliada</DialogTitle>
          {lightbox && <LightboxContent item={lightbox} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
