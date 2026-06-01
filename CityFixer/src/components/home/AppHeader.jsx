import { useState } from "react";
import { User, LogOut, Siren, ShieldOff } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UrgenciasModal from "./UrgenciasModal";

export default function AppHeader({ user, isBanned }) {
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

      <header className="bg-azul-oscuro px-6 pt-12 md:pt-4 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logoCityFixer.svg" alt="CityFixer" className="h-9 w-auto" />
          <span className="text-white text-xl font-bold tracking-tight">CityFixer</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUrgenciasOpen(true)}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors text-white text-xs font-bold px-3 py-1.5 rounded-full"
          >
            <Siren size={13} />
            Urgencias
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border-2 border-blanquito/60"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blanquito/20 border-2 border-blanquito/40 flex items-center justify-center">
                  <User size={18} className="text-blanquito" />
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-2xl">
              <DropdownMenuItem
                onClick={() => signOut(() => navigate("/login"))}
                className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2.5 cursor-pointer"
              >
                <LogOut size={15} />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
