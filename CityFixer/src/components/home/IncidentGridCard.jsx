import { useState } from "react";
import { MapPin, ImageOff } from "lucide-react";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import { formatDate } from "./IncidentCard";
import IncidentDetailSheet from "./IncidentDetailSheet";

const STATUS_BADGE = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border border-blanquito/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

export default function IncidentGridCard({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const statusKey = incident.status?.name;
  const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const badgeCls  = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";
  const photo     = incident.photos?.[0];

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white border border-slate-100 rounded-xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-shadow flex flex-col"
      >
        {/* Miniatura superior */}
        {photo ? (
          <img
            src={photo}
            alt={incident.title}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="h-40 w-full bg-slate-50 flex flex-col items-center justify-center gap-2 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin size={18} className="text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-300">Sin foto</p>
          </div>
        )}

        {/* Contenido */}
        <div className="p-4 flex flex-col flex-1">
          {/* Título + badge */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 line-clamp-1 flex-1 leading-snug">
              {incident.title}
            </p>
            <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
              {label}
            </span>
          </div>

          {/* Dirección • categoría */}
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-1 flex items-center gap-1">
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{incident.location?.address ?? "—"}</span>
            {incident.category?.name && (
              <span className="shrink-0 text-slate-300">
                &nbsp;•&nbsp;{capitalize(incident.category.name)}
              </span>
            )}
          </p>

          {/* Fecha al pie */}
          <p className="text-[11px] text-slate-400 mt-3 text-right">
            {formatDate(incident.createdAt)}
          </p>
        </div>
      </div>

      <IncidentDetailSheet
        incident={incident}
        open={open}
        onOpenChange={setOpen}
        onUpdated={onUpdated}
      />
    </>
  );
}
