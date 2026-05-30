import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FOTOS = 3;

export default function ImageUploader({ imagenes, onChange, onRemove }) {
  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const disponibles = MAX_FOTOS - imagenes.length;
    const nuevas = Array.from(e.target.files)
      .slice(0, disponibles)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    onChange(nuevas);
  };

  const handleRemove = (index) => {
    URL.revokeObjectURL(imagenes[index].preview);
    onRemove(index);
  };

  const limite = imagenes.length >= MAX_FOTOS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {!limite && (
          <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-blanquito/30 border-2 border-dashed border-celestito/30 cursor-pointer">
            <Camera className="text-celestito" size={20} />
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
        {imagenes.map((img, index) => (
          <div key={index} className="relative w-20 h-20">
            <img
              src={img.preview}
              alt={`foto-${index + 1}`}
              className="w-full h-full object-cover rounded-2xl"
            />
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
      <p className="text-xs text-gray-400 ml-1">
        {imagenes.length}/{MAX_FOTOS} fotos · mínimo 1, máximo {MAX_FOTOS}
      </p>
    </div>
  );
}
