// Barra superior de la app de usuario (Home).
// Muestra el logo, el botón de urgencias (Siren) y el avatar del usuario con un menú desplegable.
// El menú tiene: acceso a cada tab, historial de notificaciones, cerrar sesión, y una
// alerta en rojo visible si la cuenta está baneada (ShieldOff).
// Recibe las notificaciones del contexto global (NotificationContext) para mostrar el badge.
//
// Props:
//   activeTab      → tab actualmente visible ("inicio" | "reportes" | "perfil")
//   onTabChange    → función que recibe el nombre del tab al hacer clic en el menú
//   onUrgencias    → función sin argumentos, abre el modal de urgencias (UrgenciasModal)
//   isBanned       → booleano, si true muestra el banner de cuenta suspendida
import { useState } from "react";
import { LogOut, Siren, ShieldOff, User, Home as HomeIcon, FileText, HelpCircle, Bell, CheckCheck } from "lucide-react";
import SupportInfo from "./SupportInfo";
import { STATUS_LABELS_PUBLIC, getStatusStyle, capitalize } from "@/lib/incidents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UrgenciasModal from "./UrgenciasModal";
import { useNotificationContext } from "@/context/NotificationContext";

const DESKTOP_TABS = [
  { id: "inicio",   label: "Inicio",       icon: HomeIcon },
  { id: "reportes", label: "Mis Reportes", icon: FileText },
];

// ── Tiempo relativo ──────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${days} d`;
}

// Extrae el nombre del estado del mensaje, su label público y sus colores
function extractStatus(message) {
  const match = /"([^"]+)"/.exec(message);
  const raw   = match?.[1];
  const label = STATUS_LABELS_PUBLIC[raw] ?? raw ?? "actualizado";
  // "dudoso" se muestra como "Pendiente" de cara al público, así que toma su color
  const style = getStatusStyle(raw === "dudoso" ? "pendiente" : raw);
  return { label, style };
}

// ── Panel de notificaciones ───────────────────────────────────────────────────
function NotificationPanel({ onNavigate }) {
  const ctx = useNotificationContext();
  if (!ctx) return null;

  const { notifications, unreadCount, markAllRead } = ctx;

  return (
    <div className="flex flex-col" style={{ maxHeight: "420px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-brand-mid transition-colors"
          >
            <CheckCheck size={12} />
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden flex-1">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Bell size={16} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Sin notificaciones</p>
            <p className="text-xs text-slate-400 mt-0.5">Te avisaremos cuando haya novedades.</p>
          </div>
        ) : (
          <div className="py-1.5 px-1.5">
          {notifications.map((noti) => {
            const { label: statusLabel, style: statusStyle } = extractStatus(noti.message);
            return (
              <button
                key={noti._id}
                onClick={() => onNavigate(noti)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-0.5 last:mb-0 ${
                  !noti.isRead ? "bg-primary/[0.05] hover:bg-primary/[0.08]" : "hover:bg-slate-50"
                }`}
              >
                {/* Título + tiempo relativo */}
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate ${!noti.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                    {noti.incidentTitle ? capitalize(noti.incidentTitle) : "Tu incidente"}
                  </p>
                  <span className="text-[10px] text-slate-300 shrink-0">{relativeTime(noti.createdAt)}</span>
                </div>

                {/* Estado legible */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!noti.isRead ? "bg-primary" : "bg-slate-200"}`} />
                  <span className="text-[11px] text-slate-400">Pasó a</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusLabel}
                  </span>
                </div>
              </button>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AppHeader principal ───────────────────────────────────────────────────────
export default function AppHeader({ user, isBanned, activeTab, onTabChange }) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [urgenciasOpen, setUrgenciasOpen] = useState(false);
  const [helpOpen, setHelpOpen]           = useState(false);
  const [notiOpen, setNotiOpen]           = useState(false);

  const ctx = useNotificationContext();
  const unreadCount = ctx?.unreadCount ?? 0;

  const handleNotiNavigate = (noti) => {
    setNotiOpen(false);
    ctx?.markByIncident(noti.incidentId);
    onTabChange?.("reportes");
  };

  return (
    <>
      <UrgenciasModal open={urgenciasOpen} onOpenChange={setUrgenciasOpen} />

      {/* Dialog de ayuda */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                <HelpCircle size={16} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-slate-900">Ayuda y soporte</DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">CityFixer</p>
              </div>
            </div>
          </DialogHeader>
          <SupportInfo />
        </DialogContent>
      </Dialog>

      {isBanned && (
        <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <ShieldOff size={15} className="shrink-0" />
            <p className="text-xs font-semibold">Tu cuenta ha sido suspendida. No podés realizar acciones.</p>
          </div>
          <button
            onClick={() => signOut(() => navigate("/login"))}
            className="shrink-0 text-xs font-bold text-white/80 hover:text-white underline underline-offset-2 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <header className="bg-white border-b border-slate-100 px-5 h-14 flex items-center justify-between shrink-0 sticky top-0 z-40">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <img src="/logoCityFixer.svg" alt="CityFixer" className="h-7 w-auto" />
          <span className="text-base font-bold text-slate-900 tracking-tight">CityFixer</span>
        </div>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {DESKTOP_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange?.(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Derecha: urgencias + campana + avatar */}
        <div className="flex items-center gap-2">

          {/* Urgencias */}
          <button
            onClick={() => setUrgenciasOpen(true)}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3 h-8 rounded-lg transition-colors"
          >
            <Siren size={13} />
            <span className="hidden sm:inline">Urgencias</span>
          </button>

          {/* Campana de notificaciones */}
          <DropdownMenu open={notiOpen} onOpenChange={setNotiOpen}>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 p-0 rounded-xl border border-slate-100 shadow-lg overflow-hidden"
            >
              <NotificationPanel onNavigate={handleNotiNavigate} />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Avatar desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none hidden md:block">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-slate-100">
                  <User size={15} className="text-slate-500" />
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName ?? "Ciudadano"}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <DropdownMenuItem onClick={() => onTabChange?.("perfil")} className="gap-2 cursor-pointer text-sm mt-1">
                <User size={14} /> Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setHelpOpen(true)} className="gap-2 cursor-pointer text-sm">
                <HelpCircle size={14} /> Ayuda y soporte
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut(() => navigate("/login"))}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2 cursor-pointer text-sm"
              >
                <LogOut size={14} /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>
    </>
  );
}