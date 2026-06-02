import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { LayoutList, BarChart2, Tag, Users, LogOut, HelpCircle } from "lucide-react";

const NAV_ITEMS = [
  { id: "incidentes",   label: "Incidentes",   icon: LayoutList },
  { id: "estadisticas", label: "Estadísticas",  icon: BarChart2  },
  { id: "categorias",   label: "Categorías",    icon: Tag,        superAdminOnly: true },
  { id: "usuarios",     label: "Usuarios",      icon: Users,      superAdminOnly: true },
];

export default function AdminSidebar({ activeTab, onTabChange, dbRole, onClose }) {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => !item.superAdminOnly || dbRole === "superAdmin");

  return (
    <aside className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">

      {/* Logo */}
      <div className="flex items-center gap-3 pt-7 px-6 pb-6 border-b border-sidebar-border shrink-0">
        <img src="/logoCityFixer.svg" alt="CityFixer" className="h-10 w-10 object-contain shrink-0" />
        <span className="text-xl font-bold tracking-tight text-white">CityFixer</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { onTabChange(id); onClose?.(); }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-sidebar-primary" />
              )}
              <Icon size={17} className="shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5 shrink-0">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150">
          <HelpCircle size={17} className="shrink-0" />
          Ayuda y soporte
        </button>
        <button
          onClick={() => signOut(() => navigate("/login"))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={17} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
