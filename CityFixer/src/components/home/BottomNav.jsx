// Barra de navegación inferior (visible solo en mobile, oculta en md+).
// Tiene tres botones: Inicio, Mis Reportes y Perfil.
// Se deshabilita completamente si el usuario está baneado (prop disabled).
//
// Props:
//   activeTab   → tab actualmente activo, para resaltar el botón correcto
//   onTabChange → función que recibe el id del tab ("inicio" | "reportes" | "perfil")
//   disabled    → booleano, si true bloquea la interacción (cuenta baneada)
//
// Se usa en Home.jsx en la parte inferior de la pantalla.
import { Home as HomeIcon, FileText, User } from "lucide-react";

const TABS = [
  { id: "inicio",   label: "Inicio",       icon: HomeIcon },
  { id: "reportes", label: "Mis Reportes", icon: FileText },
  { id: "perfil",   label: "Perfil",       icon: User     },
];

export default function BottomNav({ activeTab, onTabChange, disabled }) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex md:hidden z-50 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              active ? "text-brand-dark" : "text-gray-400"
            }`}
          >
            <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-brand-dark" />}
          </button>
        );
      })}
    </nav>
  );
}
