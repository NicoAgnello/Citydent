import { useState } from "react";
import { LogOut, Siren, ShieldOff, User, Home as HomeIcon, FileText } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UrgenciasModal from "./UrgenciasModal";

const DESKTOP_TABS = [
  { id: "inicio",   label: "Inicio",       icon: HomeIcon },
  { id: "reportes", label: "Mis Reportes", icon: FileText },
];

export default function AppHeader({ user, isBanned, activeTab, onTabChange }) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [urgenciasOpen, setUrgenciasOpen] = useState(false);

  return (
    <>
      <UrgenciasModal open={urgenciasOpen} onOpenChange={setUrgenciasOpen} />

      {isBanned && (
        <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <ShieldOff size={15} className="shrink-0" />
            <p className="text-xs font-semibold">
              Tu cuenta ha sido suspendida. No podés realizar acciones.
            </p>
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

        {/* Nav desktop (oculta en mobile — usa BottomNav) */}
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

        {/* Derecha: urgencias + avatar (solo desktop) */}
        <div className="flex items-center gap-2.5">
          {/* Urgencias — outline sutil */}
          <button
            onClick={() => setUrgenciasOpen(true)}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3 h-8 rounded-lg transition-colors"
          >
            <Siren size={13} />
            <span className="hidden sm:inline">Urgencias</span>
          </button>

          {/* Avatar — solo desktop (mobile usa BottomNav para perfil) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none hidden md:block">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
                />
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
              <DropdownMenuItem
                onClick={() => onTabChange?.("perfil")}
                className="gap-2 cursor-pointer text-sm mt-1"
              >
                <User size={14} />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut(() => navigate("/login"))}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2 cursor-pointer text-sm"
              >
                <LogOut size={14} />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
