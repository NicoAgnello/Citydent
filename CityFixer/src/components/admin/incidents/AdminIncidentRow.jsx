// Fila de incidente para la vista desktop del panel admin (tabla HTML).
// Muestra: prioridad, título, categoría, dirección, fecha, cantidad de duplicados,
// badge de estado, y un menú de acciones (⋯) con opciones de ver detalle.
// Al hacer clic en "Ver" o en la fila, abre IncidentDetailSheet.
//
// Props:
//   incident  → objeto de incidente con todos sus datos
//   onUpdated → función sin argumentos, recarga la lista tras cambios de estado
//
// Se usa en AdminIncidentList.jsx en pantallas medianas/grandes (desktop).
import { useState } from "react";
import { MoreHorizontal, Eye, AlertTriangle, Archive, Users } from "lucide-react";
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

function getPriorityStyle(p) {
  if (p <= 2) return "bg-green-50 text-green-700 border border-green-200";
  if (p <= 4) return "bg-blue-50 text-blue-600 border border-blue-200";
  if (p <= 6) return "bg-amber-50 text-amber-700 border border-amber-200";
  if (p <= 8) return "bg-orange-50 text-orange-600 border border-orange-200";
  return "bg-red-50 text-red-600 border border-red-200";
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminIncidentRow({ incident, onUpdated, isReadOnly = false }) {
  const [open, setOpen] = useState(false);
  const priority = incident.priority ?? 1;

  return (
    <>
      <TableRow className={`hover:bg-slate-50/80 ${isReadOnly ? "opacity-60" : ""}`}>
        {/* Detalle: título + dirección */}
        <TableCell className="py-2.5 pl-5 cursor-pointer" onClick={() => setOpen(true)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{incident.representativeId?.title}</p>
            {incident.representativeId?.is_dubious && (
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
              {incident.representativeId?.location?.address ?? "—"}
            </p>
            {incident.incidents?.length > 1 && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                <Users size={9} />
                {incident.incidents.length}
              </span>
            )}
          </div>
        </TableCell>

        {/* Categoría */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-light/20 text-brand border border-brand-light/40 whitespace-nowrap">
            {capitalize(incident.category?.name ?? "—")}
          </span>
        </TableCell>

        {/* Prioridad */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${getPriorityStyle(priority)}`}>
            {priority} — {getPriorityLabel(priority)}
          </span>
        </TableCell>

        {/* Estado */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <StatusBadge statusName={incident.status?.name} />
        </TableCell>

        {/* Fecha */}
        <TableCell className="py-2.5 text-xs text-slate-500 whitespace-nowrap cursor-pointer" onClick={() => setOpen(true)}>
          {formatDate(incident.representativeId?.createdAt)}
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
