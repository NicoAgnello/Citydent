import { LayoutList, BarChart2, Tag } from "lucide-react";

const TABS = [
  { id: "incidentes",   label: "Incidentes",   icon: LayoutList },
  { id: "estadisticas", label: "Estadísticas",  icon: BarChart2  },
  { id: "categorias",   label: "Categorías",    icon: Tag        },
];

export default function AdminTabBar({ activeTab, onTabChange, dbRole }) {
  return (
    <nav className="bg-white border-b border-gray-100 px-5 shrink-0">
      <div className="max-w-6xl mx-auto flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                active
                  ? "border-[#292D60] text-[#292D60]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
