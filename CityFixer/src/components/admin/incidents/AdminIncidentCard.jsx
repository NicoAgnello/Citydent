import { useState } from "react";
import { MapPin } from "lucide-react";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import { formatDate } from "@/components/home/IncidentCard";
import IncidentDetailSheet from "@/components/home/IncidentDetailSheet";
import IncidentAdminActions from "./IncidentAdminActions";

const STATUS_BADGE = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border border-blanquito/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

const PRIORITY_DOT = {
  1: "bg-gray-300",
  2: "bg-blue-400",
  3: "bg-amber-400",
  4: "bg-orange-500",
  5: "bg-red-500",
};

const PRIORITY_LABELS = {
  1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Crítica",
};

export default function AdminIncidentCard({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const statusKey  = incident.status?.name;
  const label      = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const badgeCls   = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";
  const priority   = incident.priority ?? 1;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white border border-slate-100 rounded-xl shadow-xs p-3.5 cursor-pointer active:bg-slate-50 transition-colors"
      >
        {/* Fila superior: título + badge estado */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1 flex-1">
            {incident.title}
          </p>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
            {label}
          </span>
        </div>

        {/* Fila medial: dirección • categoría */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
          <MapPin size={11} className="shrink-0 text-slate-400" />
          <span className="truncate">{incident.location?.address ?? "—"}</span>
          {incident.category?.name && (
            <>
              <span className="shrink-0 text-slate-300">•</span>
              <span className="shrink-0">{capitalize(incident.category.name)}</span>
            </>
          )}
        </div>

        {/* Fila inferior: prioridad + fecha */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[priority] ?? PRIORITY_DOT[1]}`} />
            <span className="text-[11px] text-slate-400">{PRIORITY_LABELS[priority] ?? `P${priority}`}</span>
          </div>
          <span className="text-[11px] text-slate-400">{formatDate(incident.createdAt)}</span>
        </div>
      </div>

      <IncidentDetailSheet
        incident={incident}
        open={open}
        onOpenChange={setOpen}
        isAdmin
        onUpdated={onUpdated}
        actions={
          <IncidentAdminActions
            incident={incident}
            onUpdated={() => { onUpdated?.(); setOpen(false); }}
          />
        }
      />
    </>
  );
}
