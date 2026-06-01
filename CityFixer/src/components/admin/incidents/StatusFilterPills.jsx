import { STATUS_LABELS, capitalize, getStatusStyle } from "@/lib/incidents";

export default function StatusFilterPills({ active, onChange, statuses = [] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onChange("todos")}
        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
          active === "todos"
            ? "bg-azul-oscuro text-white"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
        }`}
      >
        Todos
      </button>

      {statuses.map((s) => {
        const isActive = active === s.name;
        const style = getStatusStyle(s.name);
        const label = STATUS_LABELS[s.name] ?? capitalize(s.name);

        return (
          <button
            key={s._id}
            onClick={() => onChange(s.name)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              isActive
                ? `${style.bg} ${style.text}`
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
