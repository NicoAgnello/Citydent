// Selector de tema con tres opciones: Claro, Oscuro y Automático (según el sistema).
// Lee y guarda la preferencia con useThemePref (lib/theme.js).
//
// Props:
//   className → clases extra para el contenedor (opcional)
import { Sun, Moon, Monitor } from "lucide-react";
import { useThemePref } from "@/lib/theme";

const OPTIONS = [
  { value: "light",  label: "Claro",      icon: Sun     },
  { value: "dark",   label: "Oscuro",     icon: Moon    },
  { value: "system", label: "Automático", icon: Monitor },
];

export default function ThemeSelector({ className = "" }) {
  const [pref, setPref] = useThemePref();

  return (
    <div role="radiogroup" aria-label="Tema de la app" className={`flex gap-1 rounded-xl bg-slate-100 p-1 ${className}`}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPref(value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-white text-primary shadow-xs dark:bg-primary dark:text-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
