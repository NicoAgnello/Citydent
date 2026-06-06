import { useState, useMemo, useEffect } from "react";
import { Plus, Search, X } from "lucide-react";
import AdminIncidentList from "./AdminIncidentList";
import { useStatuses } from "@/hooks/useStatuses";
import { capitalize, STATUS_LABELS } from "@/lib/incidents";

const PRIORITY_LABELS = {
  1: "Muy baja",
  2: "Baja",
  3: "Media",
  4: "Alta",
  5: "Crítica",
};

const SELECT_CLASS =
  "text-xs rounded-xl bg-gray-100 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all cursor-pointer border-none";

export default function AdminIncidentesTab({
  incidents,
  loading,
  onUpdated,
  onNuevoReporte,
  focusedIncidentId,
  onClearFocus,
}) {
  const [filters, setFilters] = useState({
    status: "todos",
    category: "todas",
    priority: "todas",
    userSearch: "",
  });
  const { statuses } = useStatuses();

  const DEFAULTS = {
    status: "todos",
    category: "todas",
    priority: "todas",
    userSearch: "",
  };
  const set = (key) => (value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(DEFAULTS);

  // Cuando llega un incidente desde el buscador global, limpia los filtros para que sea visible
  useEffect(() => {
    if (focusedIncidentId) clearFilters();
  }, [focusedIncidentId]);
  const hasActiveFilters =
    filters.status !== "todos" ||
    filters.category !== "todas" ||
    filters.priority !== "todas" ||
    filters.userSearch.trim() !== "";

  // Categorías únicas derivadas de los incidentes cargados — sin llamada extra a la API
  const categories = useMemo(() => {
    const seen = new Set();
    return incidents
      .filter(
        (inc) =>
          inc.category?.name &&
          !seen.has(inc.category.name) &&
          seen.add(inc.category.name),
      )
      .map((inc) => ({ _id: inc.category._id, name: inc.category.name }));
  }, [incidents]);

  const filtered = useMemo(() => {
    let result = incidents;

    if (filters.status !== "todos")
      result = result.filter((inc) => inc.status?.name === filters.status);

    if (filters.category !== "todas")
      result = result.filter((inc) => inc.category?.name === filters.category);

    if (filters.priority !== "todas")
      result = result.filter(
        (inc) => inc.priority === Number(filters.priority),
      );

    if (filters.userSearch.trim().length >= 3) {
      const q = filters.userSearch.trim().toLowerCase();
      result = result.filter((inc) => {
        const name = [inc.user?.firstName, inc.user?.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const email = (inc.user?.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    return result;
  }, [incidents, filters]);

  return (
    <div className="flex flex-col gap-4">
      {/* ── NUEVA CABECERA: Título a la izquierda, Botón a la derecha ── */}
      <div className="flex justify-between items-center">
        <div>
<h2 className="text-2xl font-bold text-[#292D60]">
          Gestión de Incidentes
        </h2>
        <p className="text-xs text-gray-400">
          {loading
            ? "—"
            : `${filtered.length} incidente${filtered.length !== 1 ? "s" : ""}`}
        </p>
        </div>
        
        <button
          onClick={onNuevoReporte}
          className="flex items-center justify-center px-2.5 py-1.5 rounded-xl bg-primary hover:bg-celestito text-white text-sm font-semibold gap-1.5 transition-colors"
        >
          <Plus size={15} />
          Reportar Incidente
        </button>
      </div>

      {/* Fila única: Búsqueda + Selects + Botón Limpiar */}
      <div className="flex gap-2 flex-wrap items-start">
        {/* Buscador */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={filters.userSearch}
              onChange={(e) => set("userSearch")(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all"
            />
          </div>
          {filters.userSearch.trim().length > 0 &&
            filters.userSearch.trim().length < 3 && (
              <p className="text-xs text-gray-400 pl-1">
                Ingresá al menos 3 caracteres.
              </p>
            )}
        </div>

        {/* Estado */}
        <select
          value={filters.status}
          onChange={(e) => set("status")(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="todos">Todos los estados</option>
          {statuses.map((s) => (
            <option key={s._id} value={s.name}>
              {STATUS_LABELS[s.name] ?? capitalize(s.name)}
            </option>
          ))}
        </select>

        {/* Categoría */}
        <select
          value={filters.category}
          onChange={(e) => set("category")(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="todas">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>
              {capitalize(cat.name)}
            </option>
          ))}
        </select>

        {/* Prioridad */}
        <select
          value={filters.priority}
          onChange={(e) => set("priority")(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="todas">Todas las prioridades</option>
          {[1, 2, 3, 4, 5].map((p) => (
            <option key={p} value={p}>
              {p} — {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        {/* Contador + Limpiar */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      <AdminIncidentList
        incidents={filtered}
        loading={loading}
        onUpdated={onUpdated}
        focusedIncidentId={focusedIncidentId}
        onClearFocus={onClearFocus}
      />
    </div>
  );
}
