import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import StatusFilterPills from "./StatusFilterPills";
import AdminIncidentList from "./AdminIncidentList";
import { useStatuses } from "@/hooks/useStatuses";
import { capitalize } from "@/lib/incidents";

const PRIORITY_LABELS = {
  1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Crítica",
};

const SELECT_CLASS =
  "text-xs rounded-xl bg-gray-100 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all cursor-pointer border-none";

export default function AdminIncidentesTab({ incidents, loading, onUpdated, onNuevoReporte }) {
  const [filters, setFilters] = useState({
    status:     "todos",
    category:   "todas",
    priority:   "todas",
    userSearch: "",
  });
  const { statuses } = useStatuses();

  const set = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  // Categorías únicas derivadas de los incidentes cargados — sin llamada extra a la API
  const categories = useMemo(() => {
    const seen = new Set();
    return incidents
      .filter((inc) => inc.category?.name && !seen.has(inc.category.name) && seen.add(inc.category.name))
      .map((inc) => ({ _id: inc.category._id, name: inc.category.name }));
  }, [incidents]);

  const filtered = useMemo(() => {
    let result = incidents;

    if (filters.status !== "todos")
      result = result.filter((inc) => inc.status?.name === filters.status);

    if (filters.category !== "todas")
      result = result.filter((inc) => inc.category?.name === filters.category);

    if (filters.priority !== "todas")
      result = result.filter((inc) => inc.priority === Number(filters.priority));

    if (filters.userSearch.trim().length >= 3) {
      const q = filters.userSearch.trim().toLowerCase();
      result = result.filter((inc) => {
        const name  = [inc.user?.firstName, inc.user?.lastName].filter(Boolean).join(" ").toLowerCase();
        const email = (inc.user?.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    return result;
  }, [incidents, filters]);

  return (
    <div className="flex flex-col gap-4">

      {/* Fila 1: Pills de estado + contador + botón */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatusFilterPills
          active={filters.status}
          onChange={set("status")}
          statuses={statuses}
        />
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-xs text-gray-400">
            {loading ? "—" : `${filtered.length} incidente${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <button
            onClick={onNuevoReporte}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-azul-oscuro text-white text-xs font-semibold hover:bg-azul transition-colors"
          >
            <Plus size={13} />
            Nuevo reporte
          </button>
        </div>
      </div>

      {/* Fila 2: Búsqueda + Categoría + Prioridad */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={filters.userSearch}
              onChange={(e) => set("userSearch")(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all"
            />
          </div>
          {filters.userSearch.trim().length > 0 && filters.userSearch.trim().length < 3 && (
            <p className="text-xs text-gray-400 pl-1">Ingresá al menos 3 caracteres para buscar.</p>
          )}
        </div>

        <select
          value={filters.category}
          onChange={(e) => set("category")(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="todas">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.name}>{capitalize(cat.name)}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => set("priority")(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="todas">Todas las prioridades</option>
          {[1, 2, 3, 4, 5].map((p) => (
            <option key={p} value={p}>{p} — {PRIORITY_LABELS[p]}</option>
          ))}
        </select>
      </div>

      <AdminIncidentList incidents={filtered} loading={loading} onUpdated={onUpdated} />
    </div>
  );
}
