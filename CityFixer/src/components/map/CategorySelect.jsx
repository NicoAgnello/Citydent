// Selector de categoría de incidente. Carga la lista de categorías activas desde
// el backend al montar el componente (solo muestra las que no están desactivadas).
// Si hay un error al cargar, muestra un mensaje de alerta en su lugar.
//
// Props:
//   onValueChange → función que recibe el id de la categoría elegida
//
// Se usa dentro de IncidentForm como uno de los campos del formulario de reporte.
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { getCategoriasActivas } from "@/services/api";
import { capitalize } from "@/lib/incidents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CategorySelect({ onValueChange }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCategoriasActivas()
      .then((res) => setCategorias(res.data.categories))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-500 text-sm">
        <AlertCircle size={15} className="shrink-0" />
        No se pudieron cargar las categorías. Intentá de nuevo más tarde.
      </div>
    );
  }

  return (
    <Select onValueChange={onValueChange} disabled={cargando} required>
      <SelectTrigger className="rounded-2xl border-none bg-brand-light/50 h-12 focus:ring-2 focus:ring-brand-mid">
        <SelectValue placeholder={cargando ? "Cargando..." : "Selecciona una categoría"} />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-200">
        {categorias.map((cat) => (
          <SelectItem key={cat._id} value={cat._id}>
            {capitalize(cat.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
