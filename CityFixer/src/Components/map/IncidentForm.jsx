import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import MapPicker from "./MapPicker";

const IncidentForm = () => {
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    categoriaId: '',
    descripcion: '',
    coordenadas: null,
  });
  const [imagenes, setImagenes] = useState([]);

  useEffect(() => {
    const obtenerCategorias = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/categorias');
        if (!response.ok) throw new Error('Error al obtener categorías');
        const data = await response.json();
        setCategorias(data);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      } finally {
        setCargandoCategorias(false);
      }
    };
    obtenerCategorias();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, categoriaId: value }));
  };

  const handleUbicacionChange = (ubicacion) => {
    setUbicacionSeleccionada(ubicacion);
    setFormData((prev) => ({
      ...prev,
      coordenadas: { lat: ubicacion.lat, lng: ubicacion.lng },
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImagenes((prev) => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos a enviar:", { ...formData, ubicacion: ubicacionSeleccionada, imagenes });
  };

  const direccionDisplay = ubicacionSeleccionada
    ? `${ubicacionSeleccionada.calle} ${ubicacionSeleccionada.numero}, ${ubicacionSeleccionada.barrio}`
    : null;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">

          {/* Ubicación — mapa primero */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Ubicación</Label>
            <p className="text-xs text-gray-400 ml-1 -mt-1">
              Tu posición actual aparece en azul. Tocá el mapa para marcar el incidente en rojo.
            </p>
            <MapPicker
              onChange={handleUbicacionChange}
              className="w-full h-52 rounded-2xl z-0"
            />
            {direccionDisplay && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#D3D6FF]/50 rounded-2xl">
                <MapPin size={13} className="text-[#3B418F] shrink-0" />
                <span className="text-sm text-[#2F347A] font-medium truncate">{direccionDisplay}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">¿Qué está pasando?</Label>
            <Input
              name="titulo"
              placeholder="Ej: Bache profundo, Luminaria rota..."
              className="rounded-2xl border-none bg-[#D3D6FF]/50 p-6 focus-visible:ring-2 focus-visible:ring-[#3B418F]"
              value={formData.titulo}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Categoría</Label>
            <Select onValueChange={handleCategoryChange} disabled={cargandoCategorias}>
              <SelectTrigger className="rounded-2xl border-none bg-[#D3D6FF]/50 h-12 focus:ring-2 focus:ring-[#3B418F]">
                <SelectValue placeholder={cargandoCategorias ? "Cargando..." : "Selecciona una categoría"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Detalles</Label>
            <Textarea
              name="descripcion"
              placeholder="Danos más información..."
              className="rounded-2xl border-none bg-[#D3D6FF]/50 p-4 min-h-[100px] focus-visible:ring-2 focus-visible:ring-[#3B418F]"
              value={formData.descripcion}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold ml-1">Fotos</Label>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-[#D3D6FF]/30 border-2 border-dashed border-[#3B418F]/30 cursor-pointer">
                <Camera className="text-[#3B418F]" size={20} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {imagenes.map((img, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img src={img.preview} alt="prev" className="w-full h-full object-cover rounded-2xl" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button type="submit" className="w-full h-12 rounded-2xl bg-[#292D60] hover:bg-[#2F347A] font-bold text-white">
            <Send className="h-4 w-4 mr-2" /> Enviar Reporte
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default IncidentForm;
