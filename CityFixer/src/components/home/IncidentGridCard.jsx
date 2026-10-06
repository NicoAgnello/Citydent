// Tarjeta de incidente en formato grilla (con foto de portada).
// Al hacer clic abre IncidentDetailSheet con el detalle completo.
// Si el primer archivo adjunto es un video, muestra un ícono de play superpuesto.
// Muestra: foto/video con el badge de estado encima, título, dirección, categoría,
// línea de progreso y fecha relativa.
//
// Props:
//   incident  → objeto de incidente (id, title, status, location, photos, etc.)
//   onUpdated → función sin argumentos, se pasa a IncidentDetailSheet para recargar tras cancelar
//
// Se usa en ReportesTab (grilla de todos los reportes del usuario).
import { useState } from "react";
import { MapPin, Play } from "lucide-react";
import { STATUS_LABELS, STATUS_BADGE, capitalize } from "@/lib/incidents";
import { formatDate } from "@/lib/dates";
import IncidentDetailSheet from "./IncidentDetailSheet";
import { Progress } from "./IncidentCard";

export default function IncidentGridCard({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const statusKey = incident.status?.name;
  const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const badgeCls  = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";
  const photo     = incident.photos?.[0];
  const isVideo   = /\.(mp4|webm|ogg|mov|m4v|avi)(\?.*)?$/i.test(photo ?? "");

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white border border-slate-100 rounded-xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-shadow flex flex-col"
      >
        {/* Miniatura superior, con el badge de estado encima */}
        <div className="relative">
        {photo ? (
          isVideo ? (
            <div className="relative h-40 w-full bg-slate-900">
              <video
                src={photo}
                muted
                playsInline
                preload="metadata"
                className="h-40 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                  <Play size={15} className="text-slate-700 fill-slate-700 translate-x-px" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={photo}
              alt={incident.title}
              className="h-40 w-full object-cover"
            />
          )
        ) : (
          <div className="h-40 w-full bg-slate-50 flex flex-col items-center justify-center gap-2 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin size={18} className="text-slate-300" />
            </div>
            <p className="text-[11px] text-slate-300">Sin foto</p>
          </div>
        )}
        {/* Base opaca: algunos badges son translucidos y se perderian sobre la foto */}
        <span className="absolute left-3 top-3 rounded-full bg-white shadow-sm">
          <span className={`block text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badgeCls}`}>
            {label}
          </span>
        </span>
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col flex-1">
          {/* Título */}
          <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
            {incident.title}
          </p>

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

          <Progress statusKey={statusKey} />

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