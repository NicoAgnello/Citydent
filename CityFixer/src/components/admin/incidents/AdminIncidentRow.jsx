// Fila de incidente para la vista desktop del panel admin (tabla HTML).
// Muestra: miniatura, título, dirección, cantidad de duplicados, estado (con punto de
// color), prioridad (número y nivel, sin pastilla para no saturar), categoría, fecha, y
// un menú de acciones (⋯) con opciones de ver detalle.
// Al hacer clic en "Ver" o en la fila, abre IncidentDetailSheet.
//
// Props:
//   incident  → objeto de incidente con todos sus datos
//   onUpdated → función sin argumentos, recarga la lista tras cambios de estado
//
// Se usa en AdminIncidentList.jsx en pantallas medianas/grandes (desktop).
import { useState } from "react";
import { MoreHorizontal, Eye, AlertTriangle, Archive, Users, ImageOff } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IncidentDetailSheet from "@/components/home/IncidentDetailSheet";
import IncidentAdminActions from "./IncidentAdminActions";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import { formatDate } from "@/lib/dates";

function getPriorityLabel(p) {
  if (p <= 2) return "Muy baja";
  if (p <= 4) return "Baja";
  if (p <= 6) return "Media";
  if (p <= 8) return "Alta";
  return "Crítica";
}

// Color del texto y de la barrita según prioridad. Sin fondo: en una lista donde la
// mayoría es crítica, una pastilla roja en cada fila deja de señalar lo importante.
function getPriorityTone(p) {
  if (p <= 2) return { text: "text-green-600",  bar: "bg-green-400"  };
  if (p <= 4) return { text: "text-blue-600",   bar: "bg-blue-400"   };
  if (p <= 6) return { text: "text-amber-600",  bar: "bg-amber-400"  };
  if (p <= 8) return { text: "text-orange-600", bar: "bg-orange-500" };
  return { text: "text-red-600", bar: "bg-red-500" };
}

function Thumb({ photo, title }) {
  const isVideo = /\.(mp4|webm|ogg|mov|m4v|avi)(\?.*)?$/i.test(photo ?? "");
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
      {!photo || isVideo ? (
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff size={16} className="text-slate-300" />
        </div>
      ) : (
        <img src={photo} alt={title ?? ""} loading="lazy" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

const STATUS_TABLE_STYLES = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-brand-light/20 text-brand-dark border border-brand-light/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

function StatusBadge({ statusName }) {
  const label = STATUS_LABELS[statusName] ?? capitalize(statusName ?? "—");
  const cls   = STATUS_TABLE_STYLES[statusName] ?? "bg-sky-50 text-sky-700 border border-sky-200";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function AdminIncidentRow({ incident, onUpdated, isReadOnly = false }) {
  const [open, setOpen] = useState(false);
  const priority = incident.priority ?? 1;
  const tone     = getPriorityTone(priority);
  const rep      = incident.representativeId;

  return (
    <>
      <TableRow className={`hover:bg-slate-50/80 ${isReadOnly ? "opacity-60" : ""}`}>
        {/* Incidente: miniatura + título + dirección */}
        <TableCell className="py-2.5 pl-5 cursor-pointer" onClick={() => setOpen(true)}>
          <div className="flex items-center gap-3">
            <Thumb photo={rep?.photos?.[0]} title={rep?.title} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{rep?.title}</p>
                {rep?.is_dubious && (
                  <AlertTriangle size={13} className="shrink-0 text-orange-400" title="Incidente dudoso" />
                )}
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    <Archive size={9} /> Archivado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500 truncate max-w-[220px]">
                  {rep?.location?.address ?? "—"}
                </p>
                {incident.incidents?.length > 1 && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    <Users size={9} />
                    {incident.incidents.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TableCell>

        {/* Estado */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <StatusBadge statusName={incident.status?.name} />
        </TableCell>

        {/* Prioridad */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <div className="flex items-center gap-2">
            <span className={`h-5 w-1 rounded-full ${tone.bar}`} />
            <span className={`text-sm font-bold tabular-nums ${tone.text}`}>{priority}</span>
            <span className="text-xs text-slate-500">{getPriorityLabel(priority)}</span>
          </div>
        </TableCell>

        {/* Categoría */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-light/20 text-brand border border-brand-light/40 whitespace-nowrap">
            {capitalize(incident.category?.name ?? "—")}
          </span>
        </TableCell>

        {/* Fecha */}
        <TableCell className="py-2.5 text-xs text-slate-500 whitespace-nowrap cursor-pointer" onClick={() => setOpen(true)}>
          {formatDate(rep?.createdAt)}
        </TableCell>

        {/* Acciones */}
        <TableCell className="py-2.5 pr-4 w-10">
          {isReadOnly ? (
            <button
              onClick={() => setOpen(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <Eye size={16} />
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 focus:outline-none">
                <MoreHorizontal size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setOpen(true)} className="gap-2 cursor-pointer text-sm">
                  <Eye size={14} /> Ver Detalle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>

      <IncidentDetailSheet
        incident={incident}
        open={open}
        onOpenChange={setOpen}
        isAdmin
        onUpdated={onUpdated}
        actions={
          isReadOnly ? null : (
            <IncidentAdminActions
              incident={incident}
              onUpdated={() => { onUpdated?.(); setOpen(false); }}
            />
          )
        }
      />
    </>
  );
}
