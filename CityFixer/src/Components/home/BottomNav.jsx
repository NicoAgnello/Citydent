import { Home as HomeIcon, FileText, User } from "lucide-react";

const TABS = [
  { id: "inicio",   label: "Inicio",       icon: HomeIcon },
  { id: "reportes", label: "Mis Reportes", icon: FileText },
  { id: "perfil",   label: "Perfil",       icon: User     },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              active ? "text-[#292D60]" : "text-gray-400"
            }`}
          >
            <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-semibold">{tab.label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-[#292D60]" />}
          </button>
        );
      })}
    </nav>
  );
}
