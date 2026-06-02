import { useUser } from "@clerk/clerk-react";
import { Bell, Menu, Search, User } from "lucide-react";

export default function AdminTopbar({ dbRole, onMobileMenuOpen }) {
  const { user } = useUser();
  const roleLabel = dbRole === "superAdmin" ? "Super Admin" : "Admin";

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-5 shrink-0 z-10">

      {/* Izquierda: hamburguesa (mobile) + buscador */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden sm:flex items-center">
          <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar incidentes, usuarios..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 transition placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Derecha: notificaciones + avatar */}
      <div className="flex items-center gap-3">

        {/* Campana */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Divisor */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Usuario */}
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
