// Selector de categoría del formulario de reporte.
// Carga las categorías activas desde la API y las muestra como botones (ícono + nombre)
// en una grilla: con pocas categorías se elige con un solo toque, sin abrir un desplegable.
// Si hay muchas, la grilla no crece sin límite: se acota en alto con scroll interno (asoma
// una fila a medias para que se note) y, pasadas MIN_FOR_SEARCH categorías, aparece un
// buscador para filtrarlas por nombre.
// El ícono sale del nombre de la categoría; si no hay uno conocido se usa una etiqueta.
//
// Props:
//   value         → id de la categoría elegida ("" si no hay)
//   onValueChange → función que recibe el id de la categoría elegida
//   hasError      → booleano, marca el grupo con borde rojo (validación del formulario)
//
// Se usa en IncidentForm.
import { useState, useEffect, useMemo } from "react";
import {
  AlertCircle, Tag, Construction, Lightbulb, Trash2, Droplets, TreePine,
  TrafficCone, SprayCan, CircleEllipsis, Loader2, Search,
} from "lucide-react";
import { getCategoriasActivas } from "@/services/api";
import { capitalize } from "@/lib/incidents";

// Cantidad de categorías a partir de la cual se muestra el buscador.
const MIN_FOR_SEARCH = 9;

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
  const [query, setQuery] = useState("");

  useEffect(() => {
    getCategoriasActivas()
      .then((res) => setCategorias(res.data.categories))
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  // Sin tildes ni mayúsculas, para que "arbol" encuentre "Árbol".
  const normalize = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visibles = useMemo(() => {
    const q = normalize(query.trim());
    return q ? categorias.filter((c) => normalize(c.name).includes(q)) : categorias;
  }, [categorias, query]);
  const conBuscador = categorias.length > MIN_FOR_SEARCH;

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
    <div className="flex flex-col gap-2">
      {conBuscador && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${categorias.length} categorías`}
            aria-label="Buscar categoría"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Categoría"
        className={`grid max-h-[10.5rem] grid-cols-2 gap-2 overflow-y-auto rounded-xl p-0.5 sm:grid-cols-3 ${
          hasError ? "ring-2 ring-red-300 ring-offset-2 ring-offset-white" : ""
        }`}
      >
        {visibles.map((cat) => {
          const Icon = iconFor(cat.name);
          const selected = value === cat._id;
          return (
            <button
              key={cat._id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onValueChange(cat._id)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-[13px] font-medium transition-colors ${
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{capitalize(cat.name)}</span>
            </button>
          );
        })}
        {visibles.length === 0 && (
          <p className="col-span-full py-3 text-center text-sm text-slate-400">Ninguna categoría coincide.</p>
        )}
      </div>
    </div>
  );
}
