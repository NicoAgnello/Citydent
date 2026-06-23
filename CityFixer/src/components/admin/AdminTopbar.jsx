// Barra superior del panel admin.
// Contiene: botón de menú mobile (hamburguesa), barra de búsqueda global (por título
// de incidente), campana de notificaciones con dropdown que muestra hasta 5 emergencias activas,
// y el avatar del usuario.
// Las notificaciones se obtienen del contexto global (NotificationContext).
// Al hacer clic en una emergencia del dropdown, llama a onIncidentSelect para que
// AdminDashboard abra ese incidente directamente.
//
// Props:
//   onMenuToggle    → función sin argumentos, abre/cierra el sidebar en mobile
//   onIncidentSelect → función que recibe un id de incidente para enfocarlo en la lista
//
// Se usa en AdminDashboard.jsx en la parte superior de la pantalla.
import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Bell, Menu, Search, User, X, AlertTriangle } from "lucide-react";
import { STATUS_LABELS, STATUS_BADGE, capitalize } from "@/lib/incidents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAX_VISIBLE = 5;

function EmergencyItem({ incident, onSelect }) {
  const statusName = incident.status?.name;
  const badgeCls   = STATUS_BADGE[statusName] ?? "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <button
      onClick={() => onSelect(incident)}
      className="w-full text-left px-4 py-2.5 hover:bg-red-50/60 transition-colors flex items-center justify-between gap-3 group"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate group-hover:text-red-600 transition-colors">
          {incident.representativeId?.title}
        </p>
        {incident.representativeId?.location?.address && (
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {incident.representativeId.location.address}
          </p>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeCls}`}>
        {STATUS_LABELS[statusName] ?? capitalize(statusName ?? "—")}
      </span>
    </button>
  );
}

// ── Topbar principal ──
export default function AdminTopbar({
  dbRole,
  onMobileMenuOpen,
  incidents = [],
  notifications = { emergencias: [], total: 0 },
  onTabChange,
  onFocusIncident,
}) {
  const { user } = useUser();
  const roleLabel = dbRole === "superAdmin" ? "Super Admin" : "Admin";

  const [search, setSearch]       = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const containerRef              = useRef(null);
  const mobileInputRef            = useRef(null);

  const trimmed = search.trim();
  const results = trimmed.length > 0
    ? incidents
        .filter((inc) => {
          const q   = trimmed.toLowerCase();
          const rep = inc.representativeId;
          return (
            rep?.title?.toLowerCase().includes(q) ||
            rep?.location?.address?.toLowerCase().includes(q)
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
    setSearchOpen(false);
  };

  const openMobileSearch = () => {
    setSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  };

  const closeMobileSearch = () => {
    setSearch("");
    setSearchOpen(false);
  };

  const handleNotifSelect = (incident) => {
    onTabChange?.("incidentes");
    onFocusIncident?.(incident._id);
  };

  const { total } = notifications;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-10 relative">

      {/* ── Overlay búsqueda mobile ── */}
      {searchOpen && (
        <div className="sm:hidden absolute inset-0 bg-white flex items-center px-4 gap-3 z-20" onMouseDown={(e) => e.stopPropagation()}>
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            ref={mobileInputRef}
            type="text"
            placeholder="Buscar incidentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 text-slate-800"
          />
          <button onClick={closeMobileSearch} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
          {/* Dropdown resultados mobile */}
          {trimmed && (
            <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg overflow-hidden z-50">
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
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{inc.representativeId?.title}</p>
                          {inc.representativeId?.location?.address && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{inc.representativeId.location.address}</p>
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
      )}

      {/* ── Izquierda: hamburguesa + buscador ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0 mr-6">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Buscador con dropdown */}
        <div ref={containerRef} className="relative hidden sm:flex items-center flex-1 max-w-xl">
          <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar incidentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition placeholder:text-gray-400"
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
                          <p className="text-sm font-medium text-slate-900 truncate">{inc.representativeId?.title}</p>
                          {inc.representativeId?.location?.address && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{inc.representativeId.location.address}</p>
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

        {/* Lupa mobile */}
        <button
          onClick={openMobileSearch}
          className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Buscar"
        >
          <Search size={20} />
        </button>

        {/* Campana con dropdown de notificaciones */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
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
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-slate-900">Emergencias activas</p>
              {total > 0 && (
                <span className="ml-auto text-xs font-bold text-red-600">
                  {total}
                </span>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {total === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-500">Sin emergencias activas</p>
                  <p className="text-xs text-slate-400 mt-1">No hay incidentes de emergencia sin resolver.</p>
                </div>
              ) : (
                <>
                  {notifications.emergencias.slice(0, MAX_VISIBLE).map((inc) => (
                    <EmergencyItem key={inc._id} incident={inc} onSelect={handleNotifSelect} />
                  ))}
                  {notifications.emergencias.length > MAX_VISIBLE && (
                    <p className="px-4 py-2 text-xs text-slate-400 text-right">
                      +{notifications.emergencias.length - MAX_VISIBLE} más
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {total > 0 && (
              <div className="border-t border-slate-100">
                <button
                  onClick={() => { onTabChange?.("incidentes"); setNotifOpen(false); }}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-center"
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
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center ring-2 ring-brand-light/30">
              <User size={15} className="text-brand-light" />
            </div>
          )}
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-gray-800">
              {user?.fullName ?? "Administrador"}
            </p>
            <p className="text-xs text-brand-mid font-medium">{roleLabel}</p>
          </div>
        </div>

      </div>
    </header>
  );
}