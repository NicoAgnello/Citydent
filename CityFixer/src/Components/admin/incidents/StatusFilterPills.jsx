import { STATUS_STYLES, STATUS_LABELS, capitalize } from "@/lib/incidents";

const STATUS_PALETTE = [
  { bg: "bg-sky-100",     text: "text-sky-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-pink-100",    text: "text-pink-700"    },
  { bg: "bg-lime-100",    text: "text-lime-700"    },
  { bg: "bg-cyan-100",    text: "text-cyan-700"    },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
];

function getStatusStyle(name) {
  if (STATUS_STYLES[name]) return STATUS_STYLES[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return STATUS_PALETTE[hash % STATUS_PALETTE.length];
}

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
