import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

  return (
    <>
      {compact ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`foto-${i + 1}`}
              onClick={() => setLightbox(url)}
              className="aspect-square w-full rounded-lg object-cover cursor-pointer hover:opacity-85 transition-opacity"
            />
          ))}
        </div>
      ) : photos.length === 1 ? (
        <img
          src={photos[0]}
          alt="foto-1"
          onClick={() => setLightbox(photos[0])}
          className="w-full max-h-64 rounded-2xl object-contain bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
        />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`foto-${i + 1}`}
              onClick={() => setLightbox(url)}
              className="h-40 w-40 shrink-0 rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
          ))}
        </div>
      )}

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Foto ampliada</DialogTitle>
          <img src={lightbox} alt="foto ampliada" className="w-full max-h-[85vh] object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
