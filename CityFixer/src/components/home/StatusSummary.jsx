// Resumen del estado de los reportes del usuario: una barra segmentada con la
// proporción de cada grupo y debajo la cantidad de cada uno.
//
// Agrupa los estados internos en cuatro que el ciudadano entiende:
//   Enviados   → pendiente, dudoso, aceptado (todavía nadie empezó a trabajar)
//   En proceso → en_proceso
//   Resueltos  → resuelto
//   Rechazados → rechazado
// Los cancelados se ignoran: el usuario los canceló él mismo.
//
// Props:
//   incidents → array de incidentes del usuario
import { STATUS_KEYS } from "@/lib/incidents";

export const STATUS_GROUPS = [
  { label: "Resueltos",  keys: [STATUS_KEYS.RESOLVED],   bar: "bg-emerald-500", text: "text-emerald-600" },
  { label: "En proceso", keys: [STATUS_KEYS.IN_PROCESS], bar: "bg-brand-mid",   text: "text-brand-mid"   },
  {
    label: "Enviados",
    keys: [STATUS_KEYS.PENDING, STATUS_KEYS.DUBIOUS, STATUS_KEYS.ACCEPTED],
    bar: "bg-amber-400",
    text: "text-amber-600",
  },
  { label: "Rechazados", keys: [STATUS_KEYS.REJECTED],   bar: "bg-rose-400",    text: "text-rose-500"    },
];

export default function StatusSummary({ incidents }) {
  const counts = STATUS_GROUPS.map((g) => ({
    ...g,
    count: incidents.filter((i) => g.keys.includes(i.status?.name)).length,
  }));
  const total = counts.reduce((sum, g) => sum + g.count, 0);
  const resolvedPct = total ? Math.round((counts[0].count / total) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Tus reportes</h2>
        <span className="text-xs text-slate-500">
          {total === 0 ? "Sin reportes" : `${resolvedPct}% resuelto`}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{total}</p>

      {/* Barra segmentada. Si no hay reportes queda gris. */}
      <div
        role="img"
        aria-label={counts.map((g) => `${g.count} ${g.label.toLowerCase()}`).join(", ")}
        className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100"
      >
        {counts.map((g) =>
          g.count > 0 ? (
            <div
              key={g.label}
              className={`${g.bar} first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${(g.count / total) * 100}%` }}
            />
          ) : null
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {counts.map((g) => (
          <li key={g.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${g.bar}`} />
            <span className="text-slate-600">{g.label}</span>
            <span className={`ml-auto font-semibold ${g.text}`}>{g.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
