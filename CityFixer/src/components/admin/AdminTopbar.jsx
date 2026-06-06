import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Bell, Menu, Search, User, X, AlertTriangle, Flame, Clock } from "lucide-react";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Estilos de badge por status (mismo patrón que el resto del panel) ──
const STATUS_BADGE = {
  pendiente:  "bg-amber-50 text-amber-700 border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border-blanquito/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border-gray-200",
};

const SECTIONS = [
  {
    key:   "emergencias",
    icon:  AlertTriangle,
    label: "Emergencias activas",
    color: "text-red-500",
    bg:    "bg-red-50",
    empty: "Sin emergencias activas",
  },
  {
    key:   "criticos",
    icon:  Flame,
    label: "Alta prioridad sin atender",
    color: "text-orange-500",
    bg:    "bg-orange-50",
    empty: "Sin incidentes críticos pendientes",
  },
  {
    key:   "nuevosHoy",
    icon:  Clock,
    label: "Nuevos hoy",
    color: "text-blue-500",
    bg:    "bg-blue-50",
    empty: "Sin incidentes nuevos hoy",
  },
];

const MAX_PER_SECTION = 4;

// ── Item de notificación ──
function NotifItem({ incident, onSelect }) {
  const statusName = incident.status?.name;
  const badgeCls   = STATUS_BADGE[statusName] ?? "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <button
      onClick={() => onSelect(incident)}
      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate group-hover:text-primary transition-colors">
          {incident.title}
        </p>
        {incident.location?.address && (
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {incident.location.address}
          </p>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeCls}`}>
        {STATUS_LABELS[statusName] ?? capitalize(statusName ?? "—")}
      </span>
    </button>
  );
}

// ── Sección del dropdown ──
function NotifSection({ section, items, onSelect }) {
  const Icon    = section.icon;
  const visible = items.slice(0, MAX_PER_SECTION);
  const extra   = items.length - MAX_PER_SECTION;

  return (
    <div>
      {/* Header de sección */}
      <div className={`flex items-center gap-2 px-4 py-2 ${section.bg}`}>
        <Icon size={13} className={section.color} />
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${section.color}`}>
          {section.label}
        </p>
        <span className={`ml-auto text-[11px] font-bold ${section.color}`}>
          {items.length}
        </span>
      </div>

      {/* Items */}
      {visible.length === 0 ? (
        <p className="px-4 py-2.5 text-xs text-slate-400 italic">{section.empty}</p>
      ) : (
        <>
          {visible.map((inc) => (
            <NotifItem key={inc._id} incident={inc} onSelect={onSelect} />
          ))}
          {extra > 0 && (
            <p className="px-4 py-1.5 text-xs text-slate-400 text-right">
              +{extra} más
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Topbar principal ──
export default function AdminTopbar({
  dbRole,
  onMobileMenuOpen,
  incidents = [],
  notifications = { emergencias: [], criticos: [], nuevosHoy: [], total: 0 },
  onTabChange,
  onFocusIncident,
}) {
  const { user } = useUser();
  const roleLabel = dbRole === "superAdmin" ? "Super Admin" : "Admin";

  const [search, setSearch]   = useState("");
  const containerRef          = useRef(null);

  const trimmed = search.trim();
  const results = trimmed.length > 0
    ? incidents
        .filter((inc) => {
          const q = trimmed.toLowerCase();
          return (
            inc.title?.toLowerCase().includes(q) ||
            inc.location?.address?.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  // Cierra el buscador al hacer click fuera
  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleSearchSelect = (incident) => {
    onTabChange?.("incidentes");
    onFocusIncident?.(incident._id);
    setSearch("");
  };

  const handleNotifSelect = (incident) => {
    onTabChange?.("incidentes");
    onFocusIncident?.(incident._id);
  };

  const { total } = notifications;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-10">

      {/* ── Izquierda: hamburguesa + buscador ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Buscador con dropdown */}
        <div ref={containerRef} className="relative hidden sm:flex items-center">
          <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar incidentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition placeholder:text-gray-400"
          />
          {trimmed && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {/* Dropdown resultados de búsqueda */}
          {trimmed && (
            <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">
                  Sin resultados para &ldquo;{trimmed}&rdquo;
                </p>
              ) : (
                <ul>
                  {results.map((inc) => {
                    const statusName = inc.status?.name;
                    const badgeCls   = STATUS_BADGE[statusName] ?? "bg-gray-50 text-gray-500 border-gray-200";
                    return (
                      <li
                        key={inc._id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSearchSelect(inc)}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{inc.title}</p>
                          {inc.location?.address && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{inc.location.address}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                          {STATUS_LABELS[statusName] ?? capitalize(statusName ?? "—")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Derecha: campana + avatar ── */}
      <div className="flex items-center gap-3">

        {/* Campana con dropdown de notificaciones */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none">
              <Bell size={20} />
              {total > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center text-white text-[10px] font-bold leading-none">
                  {total > 99 ? "99+" : total}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-80 p-0 rounded-xl border border-slate-100 shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
              {total > 0 && (
                <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                  {total} pendiente{total !== 1 ? "s" : ""}
                </span>
              )}
              {total === 0 && (
                <span className="text-xs text-slate-400">Al día</span>
              )}
            </div>

            {/* Secciones */}
            <div className="max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:hidden divide-y divide-slate-50">
              {total === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-500">Todo bajo control</p>
                  <p className="text-xs text-slate-400 mt-1">No hay incidentes que requieran atención inmediata.</p>
                </div>
              ) : (
                SECTIONS.map((section) => (
                  <NotifSection
                    key={section.key}
                    section={section}
                    items={notifications[section.key]}
                    onSelect={handleNotifSelect}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {total > 0 && (
              <div className="border-t border-slate-100">
                <button
                  onClick={() => onTabChange?.("incidentes")}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors text-center"
                >
                  Ver todos los incidentes →
                </button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-200" />

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-azul flex items-center justify-center ring-2 ring-blanquito/30">
              <User size={15} className="text-blanquito" />
            </div>
          )}
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-gray-800">
              {user?.fullName ?? "Administrador"}
            </p>
            <p className="text-xs text-celestito font-medium">{roleLabel}</p>
          </div>
        </div>

      </div>
    </header>
  );
}
