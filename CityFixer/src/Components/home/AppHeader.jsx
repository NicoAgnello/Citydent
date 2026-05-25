import { useState } from "react";
import { User, LogOut, Siren } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UrgenciasModal from "./UrgenciasModal";

export default function AppHeader({ user }) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [urgenciasOpen, setUrgenciasOpen] = useState(false);

  return (
    <>
      <UrgenciasModal open={urgenciasOpen} onOpenChange={setUrgenciasOpen} />

      <header className="bg-[#292D60] px-5 pt-12 pb-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#D3D6FF] w-1.5 h-7 rounded-full inline-block" />
          <h1 className="text-white text-xl font-bold tracking-tight">CityFixer</h1>
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
                  className="w-10 h-10 rounded-full border-2 border-[#D3D6FF]/60"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#D3D6FF]/20 border-2 border-[#D3D6FF]/40 flex items-center justify-center">
                  <User size={18} className="text-[#D3D6FF]" />
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
