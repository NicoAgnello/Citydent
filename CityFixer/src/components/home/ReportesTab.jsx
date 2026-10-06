// Tab "Mis Reportes" — todos los incidentes del usuario, con búsqueda, filtro por
// estado y dos vistas: grilla (con foto grande) y lista (compacta, con progreso).
//
// Filtros: Todos, Enviados, En proceso, Resueltos, Rechazados y, solo si hay alguno,
// Cancelados. Cada filtro muestra cuántos reportes tiene. La búsqueda mira el título,
// la dirección y la categoría, sin distinguir mayúsculas ni tildes.
// Mientras carga muestra skeletons; si no hay reportes, EmptyState con el botón de
// crear uno; si hay pero ninguno coincide con el filtro, un aviso para limpiarlo.
//
// Props:
//   incidents      → array de incidentes del usuario (de useIncidents)
//   loading        → booleano, muestra skeletons mientras carga
//   onUpdated      → función sin argumentos, recarga la lista tras cancelar un incidente
//   onNuevoReporte → función sin argumentos, abre el modal de nuevo reporte
//
// Se usa en Home.jsx como contenido del tab "reportes".
import { useMemo, useState } from "react";
import { Search, X, LayoutGrid, List, Plus, SearchX } from "lucide-react";
import IncidentCard, { EmptyState } from "./IncidentCard";
import IncidentGridCard from "./IncidentGridCard";
import { STATUS_GROUPS } from "./StatusSummary";
import { STATUS_KEYS } from "@/lib/incidents";

const byLabel = (label) => STATUS_GROUPS.find((g) => g.label === label);

// Orden en que se muestran los filtros (de lo más reciente del flujo a lo final).
const FILTERS = [
  { id: "all",        label: "Todos",      keys: null },
  { id: "sent",       label: "Enviados",   keys: byLabel("Enviados").keys },
  { id: "in_process", label: "En proceso", keys: byLabel("En proceso").keys },
  { id: "resolved",   label: "Resueltos",  keys: byLabel("Resueltos").keys },
  { id: "rejected",   label: "Rechazados", keys: byLabel("Rechazados").keys },
  { id: "cancelled",  label: "Cancelados", keys: [STATUS_KEYS.CANCELLED], onlyIfAny: true },
];

// Minúsculas y sin tildes, para que "arbol" encuentre "Árbol".
const normalize = (str) =>
  (str ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function GridSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-4 bg-slate-100 rounded-full w-4/5" />
        <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        <div className="h-2 bg-slate-100 rounded-full w-full mt-1" />
      </div>
    </div>
  );
}

export default function ReportesTab({ incidents, loading, onUpdated, onNuevoReporte }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery]   = useState("");
  const [view, setView]     = useState("grid");

  const filters = useMemo(
    () =>
      FILTERS.map((f) => ({
        ...f,
        count: f.keys ? incidents.filter((i) => f.keys.includes(i.status?.name)).length : incidents.length,
      })).filter((f) => !f.onlyIfAny || f.count > 0),
    [incidents]
  );

  const visible = useMemo(() => {
    const active = filters.find((f) => f.id === filter) ?? filters[0];
    const q = normalize(query.trim());
    return incidents.filter((i) => {
      if (active.keys && !active.keys.includes(i.status?.name)) return false;
      if (!q) return true;
      return [i.title, i.location?.address, i.category?.name].some((v) => normalize(v).includes(q));
    });
  }, [incidents, filters, filter, query]);

  const hasFilters = filter !== "all" || query.trim() !== "";
  const clearFilters = () => { setFilter("all"); setQuery(""); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">

      {/* Encabezado */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mis reportes</h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-slate-500">
              {incidents.length === 0
                ? "Todavía no cargaste ninguno."
                : hasFilters
                  ? `${visible.length} de ${incidents.length} reportes`
                  : `${incidents.length} ${incidents.length === 1 ? "reporte" : "reportes"}`}
            </p>
          )}
        </div>
        <button
          onClick={onNuevoReporte}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-mid active:bg-brand-dark transition-colors"
        >
          <Plus size={16} />
          Cargar incidente
        </button>
      </div>

      {/* Barra de herramientas: búsqueda + vista */}
      {incidents.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, dirección o categoría"
                aria-label="Buscar reportes"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Borrar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div role="radiogroup" aria-label="Tipo de vista" className="flex rounded-xl border border-slate-200 bg-white p-1">
              {[
                { id: "grid", label: "Grilla", icon: LayoutGrid },
                { id: "list", label: "Lista",  icon: List },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={view === id}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(id)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    view === id ? "bg-primary text-white" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Filtros por estado */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden" role="radiogroup" aria-label="Filtrar por estado">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFilter(f.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {f.label}
                  <span className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <GridSkeleton key={i} />)}
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center">
          <EmptyState />
          <button
            onClick={onNuevoReporte}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-mid transition-colors"
          >
            <Plus size={16} />
            Cargar incidente
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX size={40} strokeWidth={1.5} className="text-slate-300" />
          <p className="text-sm text-slate-500">Ningún reporte coincide con tu búsqueda.</p>
          <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">
            Limpiar filtros
          </button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((inc) => (
            <IncidentGridCard key={inc._id} incident={inc} onUpdated={onUpdated} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((inc) => (
            <IncidentCard key={inc._id} incident={inc} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
