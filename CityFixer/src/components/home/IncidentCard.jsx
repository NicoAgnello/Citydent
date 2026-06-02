import { useState } from "react";
import { MapPin, AlertTriangle } from "lucide-react";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import IncidentDetailSheet from "./IncidentDetailSheet";

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "—";
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart  = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays   = Math.round((todayStart - dateStart) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function EmptyState({ message = "No tenés reportes todavía.\n¡Reportá tu primer incidente!" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertTriangle size={40} strokeWidth={1.5} className="text-gray-200" />
      <p className="text-sm text-center text-gray-400 whitespace-pre-line">{message}</p>
    </div>
  );
}

const STATUS_BADGE = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border border-blanquito/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

export default function IncidentCard({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const statusKey = incident.status?.name;
  const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const badgeCls  = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white border border-slate-100 rounded-xl shadow-xs p-3.5 cursor-pointer active:bg-slate-50 transition-colors"
      >
        {/* Fila superior: título + badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1 flex-1">
            {incident.title}
          </p>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
            {label}
          </span>
        </div>

        {/* Fila medial: dirección • categoría • fecha */}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 min-w-0">
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
      </div>

      <IncidentDetailSheet incident={incident} open={open} onOpenChange={setOpen} onUpdated={onUpdated} />
    </>
  );
}
