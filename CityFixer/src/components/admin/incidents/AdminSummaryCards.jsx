// Fila de resumen del panel de incidentes: tres tarjetas con lo que el admin tiene
// que atender primero. Al tocar una se filtra la lista; al volver a tocarla se quita.
//
//   Por revisar      → pendientes y dudosos (nadie los miró todavía)
//   En proceso       → ya se está trabajando en ellos
//   Críticos abiertos → prioridad 9 o 10 que todavía no se resolvieron ni cerraron
//
// Los números salen del listado completo (`incidents`, de useAllIncidents) y solo
// cuentan los grupos no archivados, así que no dependen de la página ni los filtros
// que estén aplicados en la tabla.
//
// Props:
//   incidents → array completo de grupos de incidentes
//   loading   → booleano, muestra "–" en lugar del número mientras carga
//   filters   → estado de filtros de AdminIncidentesTab (se usa para marcar la tarjeta activa)
//   onApply   → función que recibe { statuses, priorities } para aplicar, o null para limpiar
import { Inbox, Wrench, Flame } from "lucide-react";
import { STATUS_KEYS } from "@/lib/incidents";

const OPEN = [STATUS_KEYS.PENDING, STATUS_KEYS.DUBIOUS, STATUS_KEYS.ACCEPTED, STATUS_KEYS.IN_PROCESS];

const CARDS = [
  {
    id: "review",
    label: "Por revisar",
    hint: "Pendientes y dudosos",
    icon: Inbox,
    tone: "text-amber-600 bg-amber-50",
    preset: { statuses: [STATUS_KEYS.PENDING, STATUS_KEYS.DUBIOUS], priorities: [] },
    match: (g) => [STATUS_KEYS.PENDING, STATUS_KEYS.DUBIOUS].includes(g.status?.name),
  },
  {
    id: "process",
    label: "En proceso",
    hint: "Se está trabajando",
    icon: Wrench,
    tone: "text-brand-mid bg-brand-light/30",
    preset: { statuses: [STATUS_KEYS.IN_PROCESS], priorities: [] },
    match: (g) => g.status?.name === STATUS_KEYS.IN_PROCESS,
  },
  {
    id: "critical",
    label: "Críticos abiertos",
    hint: "Prioridad 9 o 10",
    icon: Flame,
    tone: "text-red-600 bg-red-50",
    preset: { statuses: OPEN, priorities: [9, 10] },
    match: (g) => OPEN.includes(g.status?.name) && (g.priority ?? 0) >= 9,
  },
];

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export default function AdminSummaryCards({ incidents, loading, filters, onApply }) {
  const live = incidents.filter((g) => !g.isArchived);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {CARDS.map(({ id, label, hint, icon: Icon, tone, preset, match }) => {
        const active =
          sameSet(filters.statuses, preset.statuses) &&
          sameSet(filters.priorities, preset.priorities) &&
          filters.categories.length === 0 &&
          !filters.isDubious;
        const count = live.filter(match).length;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onApply(active ? null : preset)}
            aria-pressed={active}
            className={`flex items-center gap-3.5 rounded-xl border bg-white p-4 text-left shadow-xs transition-colors ${
              active ? "border-primary ring-2 ring-primary/20" : "border-slate-100 hover:border-slate-300"
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold leading-none tracking-tight text-slate-900">
                {loading ? "–" : count}
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-700">{label}</span>
              <span className="block text-xs text-slate-400">{hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
