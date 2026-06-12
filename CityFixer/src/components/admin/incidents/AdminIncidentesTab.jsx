import { useState, useMemo, useEffect } from "react";
import { Plus, Search, X, Archive } from "lucide-react";
import AdminIncidentList from "./AdminIncidentList";
import { useStatuses } from "@/hooks/useStatuses";
import { capitalize, STATUS_LABELS } from "@/lib/incidents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function getPriorityLabel(p) {
  if (p <= 2) return "Muy baja";
  if (p <= 4) return "Baja";
  if (p <= 6) return "Media";
  if (p <= 8) return "Alta";
  return "Crítica";
}

const SELECT_CLASS =
  "w-full sm:w-auto px-3 text-xs font-medium " +
  "rounded-full sm:rounded-xl " +
  "bg-slate-100 sm:bg-gray-100 " +
  "text-slate-600 sm:text-gray-700 " +
  "border-0 sm:border " +
  "focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all cursor-pointer";

export default function AdminIncidentesTab({
  incidents,
  loading,
  onUpdated,
  onNuevoReporte,
  focusedIncidentId,
  onClearFocus,
}) {
  const [activeTab, setActiveTab] = useState("activos");
  const [filters, setFilters] = useState({
    status: "todos",
    category: "todas",
    priority: "todas",
    search: "",
  });
  const { statuses } = useStatuses();

  const DEFAULTS = {
    status: "todos",
    category: "todas",
    priority: "todas",
    search: "",
  };
  const set = (key) => (value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(DEFAULTS);

  // Split activos / archivados
  const activeIncidents   = useMemo(() => incidents.filter((g) => !g.isArchived), [incidents]);
  const archivedIncidents = useMemo(() => incidents.filter((g) =>  g.isArchived), [incidents]);
  const sourceList = activeTab === "activos" ? activeIncidents : archivedIncidents;
  const isReadOnly = activeTab === "archivados";

  // Al cambiar de tab, limpiar filtros
  useEffect(() => { clearFilters(); }, [activeTab]);

  // Cuando llega un incidente desde el buscador global, volver a activos y limpiar filtros
  useEffect(() => {
    if (focusedIncidentId) {
      setActiveTab("activos");
      clearFilters();
    }
  }, [focusedIncidentId]);

  const hasActiveFilters =
    filters.status !== "todos" ||
    filters.category !== "todas" ||
    filters.priority !== "todas" ||
    filters.search.trim() !== "";

  const categories = useMemo(() => {
    const seen = new Set();
    return sourceList
      .filter(
        (inc) =>
          inc.category?.name &&
          !seen.has(inc.category.name) &&
          seen.add(inc.category.name),
      )
      .map((inc) => ({ _id: inc.category._id, name: inc.category.name }));
  }, [sourceList]);

  const filtered = useMemo(() => {
    let result = sourceList;

    if (filters.status === "dudoso")
      result = result.filter((inc) => inc.representativeId?.is_dubious === true);
    else if (filters.status !== "todos")
      result = result.filter((inc) => inc.status?.name === filters.status);

    if (filters.category !== "todas")
      result = result.filter((inc) => inc.category?.name === filters.category);

    if (filters.priority !== "todas")
      result = result.filter(
        (inc) => inc.priority === Number(filters.priority),
      );

    if (filters.search.trim().length >= 2) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((inc) => {
        const rep   = inc.representativeId;
        const title   = (rep?.title ?? "").toLowerCase();
        const address = (rep?.location?.address ?? "").toLowerCase();
        const u = rep?.user;
        const userName = [u?.firstName, u?.lastName].filter(Boolean).join(" ").toLowerCase();
        const email    = (u?.email ?? "").toLowerCase();
        return title.includes(q) || address.includes(q) || userName.includes(q) || email.includes(q);
      });
    }

    return result;
  }, [sourceList, filters]);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Cabecera ── */}
      <div className="flex justify-between items-center gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#292D60]">Gestión de Incidentes</h2>
            {!loading && (
              <span className="sm:hidden text-sm text-slate-400 font-normal shrink-0">
                ({filtered.length})
              </span>
            )}
          </div>
          {!loading && (
            <p className="hidden sm:block text-xs text-gray-400 mt-0.5">
              {`${filtered.length} ${isReadOnly ? "archivado" : "incidente"}${filtered.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        {!isReadOnly && (
          <button
            onClick={onNuevoReporte}
            className="shrink-0 flex items-center justify-center px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-primary hover:bg-celestito text-white text-sm font-semibold gap-1.5 transition-colors"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Reportar Incidente</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        )}
      </div>

      {/* ── Banner info archivados ── */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Archive size={13} className="text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500">
            Los grupos archivados son de solo lectura. No se pueden modificar estado ni categoría.
          </p>
        </div>
      )}

      {/* ── Filtros + tabs ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">

        {/* Tab switcher */}
        <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-xl shrink-0 self-start">
          <button
            onClick={() => setActiveTab("activos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "activos"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Activos
            {!loading && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                activeTab === "activos" ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"
              }`}>
                {activeIncidents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("archivados")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "archivados"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Archive size={11} />
            Archivados
            {!loading && archivedIncidents.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                activeTab === "archivados" ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"
              }`}>
                {archivedIncidents.length}
              </span>
            )}
          </button>
        </div>

        {/* Divisor vertical — solo desktop */}
        <div className="hidden sm:block w-px h-8 bg-gray-200 self-center shrink-0" />

        {/* Filter card — agrupa búsqueda + selects en mobile, transparente en desktop */}
        <div className="flex flex-col gap-2.5 rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:contents">

          {/* Buscador */}
          <div className="flex flex-col gap-1 w-full sm:flex-1 sm:min-w-[180px]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, dirección o usuario..."
                value={filters.search}
                onChange={(e) => set("search")(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all
                  rounded-full bg-white border border-slate-200
                  sm:rounded-xl sm:bg-white sm:border sm:border-gray-200 sm:shadow-sm"
              />
            </div>
            {filters.search.trim().length === 1 && (
              <p className="text-xs text-gray-400 pl-1">Ingresá al menos 2 caracteres.</p>
            )}
          </div>

          {/* Divisor interno — solo mobile */}
          <div className="sm:hidden h-px bg-slate-200" />

          {/* Selects: grilla 2×2 en mobile, inline en desktop */}
          <div className="grid grid-cols-2 gap-1.5 sm:contents">
            <Select value={filters.status} onValueChange={set("status")}>
              <SelectTrigger className={SELECT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s._id} value={s.name}>{STATUS_LABELS[s.name] ?? capitalize(s.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={set("category")}>
              <SelectTrigger className={SELECT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat.name}>{capitalize(cat.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={set("priority")}>
              <SelectTrigger className={SELECT_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                  <SelectItem key={p} value={String(p)}>{p} — {getPriorityLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors
                  rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500
                  sm:rounded-xl sm:bg-gray-100 sm:text-gray-500 sm:hover:bg-gray-200 sm:hover:text-gray-500"
              >
                <X size={12} />
                Limpiar
              </button>
            ) : (
              <div className="sm:hidden" />
            )}
          </div>

        </div>

      </div>

      <AdminIncidentList
        incidents={filtered}
        loading={loading}
        onUpdated={onUpdated}
        focusedIncidentId={focusedIncidentId}
        onClearFocus={onClearFocus}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
