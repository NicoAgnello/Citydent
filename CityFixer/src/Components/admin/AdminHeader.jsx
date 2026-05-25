import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  return (
    <header className="bg-[#292D60] px-5 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-lg tracking-tight">CityFixer</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wider">
          Admin
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="avatar"
              className="w-9 h-9 rounded-full border-2 border-[#D3D6FF]/60"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#D3D6FF]/20 border-2 border-[#D3D6FF]/40 flex items-center justify-center">
              <User size={16} className="text-[#D3D6FF]" />
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName ?? "Administrador"}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut(() => navigate("/login"))}
            className="text-red-500 focus:text-red-500 focus:bg-red-50 gap-2.5 cursor-pointer"
          >
            <LogOut size={15} />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
