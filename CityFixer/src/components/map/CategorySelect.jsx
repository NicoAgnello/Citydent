// Selector de categoría del formulario de reporte.
// Carga las categorías activas desde la API y las muestra como botones (ícono + nombre)
// en una grilla: con pocas categorías se elige con un solo toque, sin abrir un desplegable.
// El ícono sale del nombre de la categoría; si no hay uno conocido se usa una etiqueta.
//
// Props:
//   value         → id de la categoría elegida ("" si no hay)
//   onValueChange → función que recibe el id de la categoría elegida
//   hasError      → booleano, marca el grupo con borde rojo (validación del formulario)
//
// Se usa en IncidentForm.
import { useState, useEffect } from "react";
import {
  AlertCircle, Tag, Construction, Lightbulb, Trash2, Droplets, TreePine,
  TrafficCone, SprayCan, CircleEllipsis, Loader2,
} from "lucide-react";
import { getCategoriasActivas } from "@/services/api";
import { capitalize } from "@/lib/incidents";

// Palabras que se buscan dentro del nombre de la categoría, en orden.
const ICONS = [
  { match: ["bache", "calle", "pavimento", "vereda"], icon: Construction },
  { match: ["alumbrado", "luz", "luminaria"],         icon: Lightbulb },
  { match: ["basura", "residuo", "limpieza"],         icon: Trash2 },
  { match: ["inundaci", "agua", "desag", "cloaca"],   icon: Droplets },
  { match: ["arbol", "árbol", "poda", "plaza"],       icon: TreePine },
  { match: ["semaforo", "semáforo", "transito", "tránsito"], icon: TrafficCone },
  { match: ["vandal", "grafiti", "pintada"],          icon: SprayCan },
  { match: ["otro"],                                  icon: CircleEllipsis },
];

function iconFor(name = "") {
  const n = name.toLowerCase();
  return ICONS.find(({ match }) => match.some((m) => n.includes(m)))?.icon ?? Tag;
}

export default function CategorySelect({ value, onValueChange, hasError = false }) {
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
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-500 text-sm">
        <AlertCircle size={15} className="shrink-0" />
        No se pudieron cargar las categorías. Intentá de nuevo más tarde.
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
        <Loader2 size={15} className="animate-spin" /> Cargando categorías...
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Categoría"
      className={`grid grid-cols-2 gap-2 rounded-xl ${hasError ? "ring-2 ring-red-300 ring-offset-2 ring-offset-white" : ""}`}
    >
      {categorias.map((cat) => {
        const Icon = iconFor(cat.name);
        const selected = value === cat._id;
        return (
          <button
            key={cat._id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(cat._id)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Icon size={17} className="shrink-0" />
            <span className="truncate">{capitalize(cat.name)}</span>
          </button>
        );
      })}
    </div>
  );
}
