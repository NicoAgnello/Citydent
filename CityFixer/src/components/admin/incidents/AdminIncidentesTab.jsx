// Tab principal de gestión de incidentes en el panel admin.
// Permite filtrar, buscar y ordenar todos los incidentes reportados.
//
// Filtros disponibles:
//   - Chips multi-select de estado (pendiente, aceptado, en proceso, etc.)
//   - Barra de búsqueda por título
//   - Ordenamiento (más reciente, más antiguo, prioridad)
//   - Panel extra en un Popover (desktop) con filtros adicionales
//
// También tiene un botón "Sincronizar con IA" que envía incidentes sin análisis al
// backend para que la IA los procese (muestra cuántos están pendientes).
//
// Props:
//   incidents        → array de todos los incidentes (de useAllIncidents en AdminDashboard)
//   loading          → booleano, muestra skeletons mientras carga
//   onUpdated        → función sin argumentos, recarga la lista tras cambios
//   focusedIncidentId → id de incidente a abrir automáticamente (viene de notificación)
//   onClearFocus     → función sin argumentos, limpia el focusedIncidentId tras usarlo
//   isReadOnly       → booleano, si true oculta las acciones de cambio de estado
//
// Se usa en AdminDashboard.jsx como contenido del tab "incidentes".
import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, X, Archive, RefreshCw, Loader2, Sparkles, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import AdminIncidentList from "./AdminIncidentList";
import { useStatuses } from "@/hooks/useStatuses";
import { capitalize, STATUS_LABELS } from "@/lib/incidents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { syncIncidentsWithAI, countIncidentsPendingAI } from "@/services/api";

// ── Color palettes ──────────────────────────────────────────────────────────

const COLOR_CHIPS = {
  green:   { on: "bg-green-500  text-white border-green-500",   off: "bg-green-50  text-green-700  border-green-200  hover:bg-green-100"  },
  blue:    { on: "bg-blue-500   text-white border-blue-500",    off: "bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-100"   },
  amber:   { on: "bg-amber-500  text-white border-amber-500",   off: "bg-amber-50  text-amber-700  border-amber-200  hover:bg-amber-100"  },
  orange:  { on: "bg-orange-500 text-white border-orange-500",  off: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  red:     { on: "bg-red-500    text-white border-red-500",     off: "bg-red-50    text-red-700    border-red-200    hover:bg-red-100"    },
  teal:    { on: "bg-teal-500   text-white border-teal-500",    off: "bg-teal-50   text-teal-700   border-teal-200   hover:bg-teal-100"   },
  blue600: { on: "bg-blue-600   text-white border-blue-600",    off: "bg-blue-50   text-blue-700   border-blue-200   hover:bg-blue-100"   },
  emerald: { on: "bg-emerald-500 text-white border-emerald-500",off: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"},
  rose:    { on: "bg-rose-500   text-white border-rose-500",    off: "bg-rose-50   text-rose-700   border-rose-200   hover:bg-rose-100"   },
  slate:   { on: "bg-slate-500  text-white border-slate-500",   off: "bg-slate-100 text-slate-600  border-slate-200  hover:bg-slate-200"  },
};

function priorityChipColors(p) {
  if (p <= 2) return COLOR_CHIPS.green;
  if (p <= 4) return COLOR_CHIPS.blue;
  if (p <= 6) return COLOR_CHIPS.amber;
  if (p <= 8) return COLOR_CHIPS.orange;
  return COLOR_CHIPS.red;
}

const STATUS_CHIP_COLORS = {
  pendiente:  COLOR_CHIPS.amber,
  dudoso:     COLOR_CHIPS.orange,
  aceptado:   COLOR_CHIPS.teal,
  en_proceso: COLOR_CHIPS.blue600,
  resuelto:   COLOR_CHIPS.emerald,
  rechazado:  COLOR_CHIPS.rose,
  cancelado:  COLOR_CHIPS.slate,
};

// ── Sort ────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "priority_desc", label: "Prioridad ↓" },
  { value: "priority_asc",  label: "Prioridad ↑" },
  { value: "date_desc",     label: "Más reciente" },
  { value: "date_asc",      label: "Más antiguo"  },
  { value: "reports_desc",  label: "Más reportes" },
];

function sortIncidents(list, sortBy) {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case "priority_asc":  return (a.priority ?? 0) - (b.priority ?? 0);
      case "date_desc":     return new Date(b.representativeId?.createdAt) - new Date(a.representativeId?.createdAt);
      case "date_asc":      return new Date(a.representativeId?.createdAt) - new Date(b.representativeId?.createdAt);
      case "reports_desc":  return (b.incidents?.length ?? 0) - (a.incidents?.length ?? 0);
      default:              return (b.priority ?? 0) - (a.priority ?? 0);
    }
  });
}

// ── Priority label ───────────────────────────────────────────────────────────

function getPriorityLabel(p) {
  if (p <= 2) return "Muy baja";
  if (p <= 4) return "Baja";
  if (p <= 6) return "Media";
  if (p <= 8) return "Alta";
  return "Crítica";
}

// ── Filter state ─────────────────────────────────────────────────────────────

const DEFAULTS = {
  search:     "",
  statuses:   [],
  categories: [],
  priorities: [],
  isDubious:  false,
  dateFrom:   "",
  dateTo:     "",
};

function toggleItem(arr, item) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Chip({ label, active, onClick, colors }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
        active
          ? (colors?.on  ?? "bg-primary   text-white    border-primary   ")
          : (colors?.off ?? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200")
      }`}
    >
      {label}
    </button>
  );
}

function ActivePill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
      {label}
      <button onClick={onRemove} className="hover:opacity-60 leading-none shrink-0">
        <X size={10} />
      </button>
    </span>
  );
}

// ── Filter panel content (shared desktop + mobile) ───────────────────────────

function FilterPanelContent({ filters, setFilters, statuses, categories, sortBy, setSortBy, showSort = true }) {
  const set          = (key, val) => setFilters((p) => ({ ...p, [key]: val }));
  const toggleStatus   = (name) => setFilters((p) => ({ ...p, statuses:   toggleItem(p.statuses, name)   }));
  const togglePriority = (val)  => setFilters((p) => ({ ...p, priorities: toggleItem(p.priorities, val)  }));
  const toggleCategory = (name) => setFilters((p) => ({ ...p, categories: toggleItem(p.categories, name) }));

  const section    = "flex flex-col gap-1.5";
  const sectionLbl = "text-[11px] font-semibold text-slate-400 uppercase tracking-wider";
  const chips      = "flex flex-wrap gap-1.5";
  const dateInput  = "text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <div className="flex flex-col gap-4">

      {/* Sort — solo en mobile sheet */}
      {showSort && (
        <div className={section}>
          <span className={sectionLbl}>Ordenar por</span>
          <div className={chips}>
            {SORT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={sortBy === opt.value}
                onClick={() => setSortBy(opt.value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado */}
      <div className={section}>
        <span className={sectionLbl}>Estado</span>
        <div className={chips}>
          {statuses.map((s) => (
            <Chip
              key={s._id}
              label={STATUS_LABELS[s.name] ?? capitalize(s.name)}
              active={filters.statuses.includes(s.name)}
              onClick={() => toggleStatus(s.name)}
              colors={STATUS_CHIP_COLORS[s.name]}
            />
          ))}
        </div>
      </div>

      {/* Prioridad */}
      <div className={section}>
        <span className={sectionLbl}>Prioridad</span>
        <div className={chips}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
            <Chip
              key={p}
              label={String(p)}
              active={filters.priorities.includes(p)}
              onClick={() => togglePriority(p)}
              colors={priorityChipColors(p)}
            />
          ))}
        </div>
        {filters.priorities.length > 0 && (
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {[...filters.priorities]
              .sort((a, b) => a - b)
              .map((p) => `${p} — ${getPriorityLabel(p)}`)
              .join("  ·  ")}
          </p>
        )}
      </div>

      {/* Categoría */}
      {categories.length > 0 && (
        <div className={section}>
          <span className={sectionLbl}>Categoría</span>
          <div className={chips}>
            {categories.map((cat) => (
              <Chip
                key={cat._id}
                label={capitalize(cat.name)}
                active={filters.categories.includes(cat.name)}
                onClick={() => toggleCategory(cat.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dudosos */}
      <div className={section}>
        <span className={sectionLbl}>Dudosos</span>
        <div className={chips}>
          <Chip
            label="⚠ Solo dudosos"
            active={filters.isDubious}
            onClick={() => set("isDubious", !filters.isDubious)}
            colors={COLOR_CHIPS.orange}
          />
        </div>
      </div>

      {/* Fecha */}
      <div className={section}>
        <span className={sectionLbl}>Fecha de reporte</span>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">Desde</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => set("dateFrom", e.target.value)}
              className={dateInput}
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400">Hasta</span>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => set("dateTo", e.target.value)}
              className={dateInput}
            />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters((p) => ({ ...p, dateFrom: "", dateTo: "" }))}
              className="text-[11px] text-slate-400 hover:text-red-400 transition-colors pb-1.5"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminIncidentesTab({
  incidents,
  loading,
  onUpdated,
  onNuevoReporte,
  focusedIncidentId,
  onClearFocus,
}) {
  const [activeTab,        setActiveTab]        = useState("activos");
  const [syncing,          setSyncing]          = useState(false);
  const [pendingAI,        setPendingAI]        = useState(null);
  const [filters,         setFilters]         = useState(DEFAULTS);
  const [sortBy,          setSortBy]          = useState("priority_desc");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { statuses } = useStatuses();

  // AI sync
  const fetchPendingAI = async () => {
    try {
      const { data } = await countIncidentsPendingAI();
      setPendingAI(data.count ?? 0);
    } catch {
      setPendingAI(null);
    }
  };

  useEffect(() => { fetchPendingAI(); }, []);

  const handleSyncAI = async () => {
    setSyncing(true);
    try {
      const { data } = await syncIncidentsWithAI();
      const { nuevosAgregados, totalEnCola } = data.data ?? {};
      if ((nuevosAgregados ?? 0) === 0) {
        toast.info("No hay incidentes pendientes de análisis o ya están en cola.");
      } else {
        toast.success(
          `${nuevosAgregados} incidente${nuevosAgregados !== 1 ? "s" : ""} en cola (${totalEnCola} total) — procesando en segundo plano.`,
        );
      }
      onUpdated?.();
      fetchPendingAI();
    } catch {
      toast.error("No se pudo sincronizar con la IA.");
    } finally {
      setSyncing(false);
    }
  };

  const clearFilters = useCallback(() => setFilters(DEFAULTS), []);

  // Tab split
  const activeIncidents   = useMemo(() => incidents.filter((g) => !g.isArchived), [incidents]);
  const archivedIncidents = useMemo(() => incidents.filter((g) =>  g.isArchived), [incidents]);
  const sourceList  = activeTab === "activos" ? activeIncidents : archivedIncidents;
  const isReadOnly  = activeTab === "archivados";

  useEffect(() => { clearFilters(); }, [activeTab]);

  useEffect(() => {
    if (focusedIncidentId) {
      setActiveTab("activos");
      clearFilters();
    }
  }, [focusedIncidentId]);

  // Dynamic categories from visible tab
  const categories = useMemo(() => {
    const seen = new Set();
    return sourceList
      .filter((inc) => inc.category?.name && !seen.has(inc.category.name) && seen.add(inc.category.name))
      .map((inc) => ({ _id: inc.category._id, name: inc.category.name }));
  }, [sourceList]);

  // Active filter count (badge)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.search.trim().length >= 2) n++;
    if (filters.statuses.length > 0)       n++;
    if (filters.categories.length > 0)     n++;
    if (filters.priorities.length > 0)     n++;
    if (filters.isDubious)                 n++;
    if (filters.dateFrom || filters.dateTo) n++;
    return n;
  }, [filters]);

  // Filter logic (cross-filtering, OR within each dimension, AND between)
  const filtered = useMemo(() => {
    let result = sourceList;

    if (filters.search.trim().length >= 2) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((inc) => {
        const rep = inc.representativeId;
        const u   = rep?.user;
        return (
          (rep?.title ?? "").toLowerCase().includes(q) ||
          (rep?.location?.address ?? "").toLowerCase().includes(q) ||
          [u?.firstName, u?.lastName].filter(Boolean).join(" ").toLowerCase().includes(q) ||
          (u?.email ?? "").toLowerCase().includes(q)
        );
      });
    }

    if (filters.statuses.length > 0)
      result = result.filter((inc) => filters.statuses.includes(inc.status?.name));

    if (filters.categories.length > 0)
      result = result.filter((inc) => filters.categories.includes(inc.category?.name));

    if (filters.priorities.length > 0)
      result = result.filter((inc) => filters.priorities.includes(inc.priority));

    if (filters.isDubious)
      result = result.filter((inc) => inc.representativeId?.is_dubious === true);

    if (filters.dateFrom)
      result = result.filter(
        (inc) => new Date(inc.representativeId?.createdAt) >= new Date(filters.dateFrom),
      );

    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      result = result.filter((inc) => new Date(inc.representativeId?.createdAt) <= end);
    }

    return result;
  }, [sourceList, filters]);

  const sortedList = useMemo(() => sortIncidents(filtered, sortBy), [filtered, sortBy]);

  // Individual pill removal helpers
  const removeStatus   = (s) => setFilters((p) => ({ ...p, statuses:   p.statuses.filter((x) => x !== s) }));
  const removeCategory = (c) => setFilters((p) => ({ ...p, categories: p.categories.filter((x) => x !== c) }));
  const removePriority = (v) => setFilters((p) => ({ ...p, priorities: p.priorities.filter((x) => x !== v) }));

  const sharedPanelProps = { filters, setFilters, statuses, categories, sortBy, setSortBy };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Cabecera ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#292D60]">Gestión de Incidentes</h2>
            {!loading && (
              <span className="sm:hidden text-sm text-slate-400 font-normal shrink-0">
                ({sortedList.length})
              </span>
            )}
          </div>
          {!loading && (
            <p className="hidden sm:block text-xs text-gray-400 mt-0.5">
              {`${sortedList.length} ${isReadOnly ? "archivado" : "incidente"}${sortedList.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={onUpdated}
            disabled={loading}
            aria-label="Actualizar lista de incidentes"
            title="Actualizar lista de incidentes"
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {!isReadOnly && (
            <>
              <div className="relative">
                <button
                  onClick={handleSyncAI}
                  disabled={syncing}
                  aria-label="Sincronizar con IA"
                  title="Reintentar análisis de IA en incidentes pendientes"
                  className="flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {syncing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span className="sm:hidden text-xs font-bold">IA</span>
                  <span className="hidden sm:inline">Sincronizar IA</span>
                </button>
                {pendingAI > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 ring-2 ring-white flex items-center justify-center text-white text-[10px] font-bold leading-none">
                    {pendingAI > 99 ? "99+" : pendingAI}
                  </span>
                )}
              </div>

              <button
                onClick={onNuevoReporte}
                className="flex items-center justify-center px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-primary hover:bg-brand-mid text-white text-sm font-semibold gap-1.5 transition-colors"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Reportar Incidente</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Banner archivados ── */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <Archive size={13} className="text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500">
            Los grupos archivados son de solo lectura. No se pueden modificar estado ni categoría.
          </p>
        </div>
      )}

      {/* ── Controles ── */}
      <div className="flex flex-col gap-2">

        {/* Fila principal: tabs + búsqueda + sort + filtros */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

          {/* Tabs */}
          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-xl shrink-0">
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

          {/* Search */}
          <div className="relative flex-1 min-w-[140px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Título, barrio, dirección, usuario..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="w-full pl-8 pr-4 py-2 text-xs text-gray-700 placeholder:text-gray-400 rounded-xl bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/30 transition-all"
            />
          </div>

          {/* Sort — desktop only */}
          <div className="hidden sm:block shrink-0">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 bg-white w-[148px] font-medium shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros — desktop: Popover flotante */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                  activeFilterCount > 0
                    ? "bg-primary/5 border-primary/30 text-primary"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                }`}
              >
                <SlidersHorizontal size={13} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold leading-none flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-[500px] p-0 gap-0">
              <div className="p-4 flex flex-col gap-4">

                {/* Grilla 2 columnas: Estado | Prioridad */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</span>
                    <div className="flex flex-wrap gap-1.5">
                      {statuses.map((s) => (
                        <Chip
                          key={s._id}
                          label={STATUS_LABELS[s.name] ?? capitalize(s.name)}
                          active={filters.statuses.includes(s.name)}
                          onClick={() => setFilters((p) => ({ ...p, statuses: toggleItem(p.statuses, s.name) }))}
                          colors={STATUS_CHIP_COLORS[s.name]}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prioridad</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                        <Chip
                          key={p}
                          label={String(p)}
                          active={filters.priorities.includes(p)}
                          onClick={() => setFilters((prev) => ({ ...prev, priorities: toggleItem(prev.priorities, p) }))}
                          colors={priorityChipColors(p)}
                        />
                      ))}
                    </div>
                    {filters.priorities.length > 0 && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {[...filters.priorities].sort((a, b) => a - b).map((p) => `${p} — ${getPriorityLabel(p)}`).join("  ·  ")}
                      </p>
                    )}
                  </div>

                  {/* Categoría | Dudosos */}
                  {categories.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Categoría</span>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((cat) => (
                          <Chip
                            key={cat._id}
                            label={capitalize(cat.name)}
                            active={filters.categories.includes(cat.name)}
                            onClick={() => setFilters((p) => ({ ...p, categories: toggleItem(p.categories, cat.name) }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dudosos</span>
                    <Chip
                      label="⚠ Solo dudosos"
                      active={filters.isDubious}
                      onClick={() => setFilters((p) => ({ ...p, isDubious: !p.isDubious }))}
                      colors={COLOR_CHIPS.orange}
                    />
                  </div>

                </div>

                {/* Fecha — ancho completo */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fecha de reporte</span>
                  <div className="flex items-end gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400">Desde</span>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400">Hasta</span>
                      <input
                        type="date"
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    {(filters.dateFrom || filters.dateTo) && (
                      <button
                        onClick={() => setFilters((p) => ({ ...p, dateFrom: "", dateTo: "" }))}
                        className="text-[11px] text-slate-400 hover:text-red-400 transition-colors pb-1.5"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer del popover */}
                {activeFilterCount > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {activeFilterCount} filtro{activeFilterCount !== 1 ? "s" : ""} activo{activeFilterCount !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}

              </div>
            </PopoverContent>
          </Popover>

          {/* Filtros button — mobile */}
          <button
            onClick={() => setMobileSheetOpen(true)}
            className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              activeFilterCount > 0
                ? "bg-primary/5 border-primary/30 text-primary"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            <SlidersHorizontal size={13} />
            {activeFilterCount > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold leading-none flex items-center justify-center">
                {activeFilterCount}
              </span>
            ) : (
              <span className="text-xs">Filtros</span>
            )}
          </button>
        </div>

        {/* Search hint */}
        {filters.search.trim().length === 1 && (
          <p className="text-xs text-gray-400 pl-1">Ingresá al menos 2 caracteres para buscar.</p>
        )}

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.search.trim().length >= 2 && (
              <ActivePill
                label={`"${filters.search.trim()}"`}
                onRemove={() => setFilters((p) => ({ ...p, search: "" }))}
              />
            )}
            {filters.statuses.map((s) => (
              <ActivePill key={s} label={STATUS_LABELS[s] ?? s} onRemove={() => removeStatus(s)} />
            ))}
            {[...filters.priorities]
              .sort((a, b) => a - b)
              .map((p) => (
                <ActivePill key={p} label={`P: ${p}`} onRemove={() => removePriority(p)} />
              ))}
            {filters.categories.map((c) => (
              <ActivePill key={c} label={capitalize(c)} onRemove={() => removeCategory(c)} />
            ))}
            {filters.isDubious && (
              <ActivePill
                label="⚠ Dudosos"
                onRemove={() => setFilters((p) => ({ ...p, isDubious: false }))}
              />
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <ActivePill
                label={[
                  filters.dateFrom && `desde ${filters.dateFrom}`,
                  filters.dateTo  && `hasta ${filters.dateTo}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onRemove={() => setFilters((p) => ({ ...p, dateFrom: "", dateTo: "" }))}
              />
            )}
            <button
              onClick={clearFilters}
              className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors ml-0.5"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile bottom sheet ── */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="sm:hidden rounded-t-2xl max-h-[88vh] flex flex-col p-0 gap-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-bold text-slate-800">Filtros y ordenamiento</SheetTitle>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
                >
                  Limpiar todo
                </button>
              )}
              <SheetClose asChild>
                <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X size={16} />
                </button>
              </SheetClose>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-4 py-4">
            <FilterPanelContent {...sharedPanelProps} />
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
            <button
              onClick={() => setMobileSheetOpen(false)}
              className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl transition-colors hover:bg-brand-mid"
            >
              Ver {sortedList.length} resultado{sortedList.length !== 1 ? "s" : ""}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AdminIncidentList
        incidents={sortedList}
        loading={loading}
        onUpdated={onUpdated}
        focusedIncidentId={focusedIncidentId}
        onClearFocus={onClearFocus}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
