// Tarjeta de incidente en formato lista (una fila por incidente).
// Al hacer clic abre IncidentDetailSheet con el detalle completo.
// Muestra: miniatura, título, categoría, dirección, badge de estado, fecha relativa
// y una línea de progreso (Enviado → Aceptado → En proceso → Resuelto).
//
// También exporta EmptyState, un placeholder reutilizable que se usa en InicioTab
// y ReportesTab cuando no hay incidentes para mostrar.
//
// Props:
//   incident  → objeto de incidente (id, title, status, location, photos, etc.)
//   onUpdated → función sin argumentos, se pasa a IncidentDetailSheet para recargar tras cancelar
//
// Se usa en InicioTab (lista de los últimos 5 reportes).
import { useState } from "react";
import { MapPin, AlertTriangle, ImageOff, Play } from "lucide-react";
import { STATUS_LABELS, STATUS_BADGE, STATUS_KEYS, capitalize } from "@/lib/incidents";
import { formatDate } from "@/lib/dates";
import IncidentDetailSheet from "./IncidentDetailSheet";

export { formatDate };

export function EmptyState({ message = "No tenés reportes todavía.\n¡Reportá tu primer incidente!" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertTriangle size={40} strokeWidth={1.5} className="text-gray-200" />
      <p className="text-sm text-center text-gray-400 whitespace-pre-line">{message}</p>
    </div>
  );
}

// Pasos del progreso de un reclamo. El índice de cada estado indica hasta qué
// paso llegó; "rechazado" y "cancelado" no avanzan y se muestran sin línea.
const STEPS = ["Enviado", "Aceptado", "En proceso", "Resuelto"];
const STEP_INDEX = {
  [STATUS_KEYS.PENDING]:    0,
  [STATUS_KEYS.DUBIOUS]:    0,
  [STATUS_KEYS.ACCEPTED]:   1,
  [STATUS_KEYS.IN_PROCESS]: 2,
  [STATUS_KEYS.RESOLVED]:   3,
};

export function Progress({ statusKey }) {
  const current = STEP_INDEX[statusKey];
  if (current === undefined) return null;

  return (
    <ol className="mt-3 flex items-center" aria-label={`Progreso: ${STEPS[current]}`}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <span
              title={step}
              className={`h-2 w-2 shrink-0 rounded-full ${
                done ? (current === 3 ? "bg-emerald-500" : "bg-brand-mid") : "bg-slate-200"
              }`}
            />
            {i < STEPS.length - 1 && (
              <span
                className={`mx-1 h-0.5 flex-1 rounded-full ${
                  i < current ? (current === 3 ? "bg-emerald-500" : "bg-brand-mid") : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Thumb({ photo, title }) {
  const isVideo = /\.(mp4|webm|ogg|mov|m4v|avi)(\?.*)?$/i.test(photo ?? "");
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
      {!photo ? (
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff size={20} className="text-slate-300" />
        </div>
      ) : isVideo ? (
        <>
          <video src={photo} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play size={16} className="fill-white text-white" />
          </div>
        </>
      ) : (
        <img src={photo} alt={title} loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

export default function IncidentCard({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const statusKey = incident.status?.name;
  const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const badgeCls  = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex gap-3.5 bg-white border border-slate-100 rounded-xl shadow-xs p-3 cursor-pointer hover:border-brand-light active:bg-slate-50 transition-colors"
      >
        <Thumb photo={incident.photos?.[0]} title={incident.title} />

        <div className="min-w-0 flex-1">
          {/* Fila superior: título + badge */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 flex-1">
              {incident.title}
            </p>
            <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
              {label}
            </span>
          </div>

          {/* Fila medial: dirección • categoría • fecha */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 min-w-0">
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{incident.location?.address ?? "—"}</span>
            {incident.category?.name && (
              <>
                <span className="shrink-0 text-slate-300">•</span>
                <span className="shrink-0">{capitalize(incident.category.name)}</span>
              </>
            )}
            <span className="shrink-0 text-slate-300 ml-auto pl-2">•</span>
            <span className="shrink-0 text-[11px] text-slate-400">{formatDate(incident.createdAt)}</span>
          </div>

          <Progress statusKey={statusKey} />
        </div>
      </div>

      <IncidentDetailSheet incident={incident} open={open} onOpenChange={setOpen} onUpdated={onUpdated} />
    </>
  );
}
