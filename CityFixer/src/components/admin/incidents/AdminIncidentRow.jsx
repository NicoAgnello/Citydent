import { useState } from "react";
import { MoreHorizontal, Eye, RefreshCw } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IncidentDetailSheet from "@/components/home/IncidentDetailSheet";
import IncidentAdminActions from "./IncidentAdminActions";
import { STATUS_LABELS, getStatusStyle, capitalize } from "@/lib/incidents";
import { formatDate } from "@/components/home/IncidentCard";

const PRIORITY_LABELS = { 1: "Muy baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Crítica" };

const PRIORITY_STYLES = {
  1: "bg-gray-100 text-gray-500 border border-gray-200",
  2: "bg-blue-50 text-blue-600 border border-blue-200",
  3: "bg-amber-50 text-amber-700 border border-amber-200",
  4: "bg-orange-50 text-orange-600 border border-orange-200",
  5: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_TABLE_STYLES = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border border-blanquito/50",
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

export default function AdminIncidentRow({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const priority = incident.priority ?? 1;

  return (
    <>
      <TableRow className="hover:bg-slate-50/80">
        {/* Detalle: título + dirección */}
        <TableCell className="py-2.5 pl-5 cursor-pointer" onClick={() => setOpen(true)}>
          <p className="text-sm font-semibold text-slate-900 leading-tight">{incident.title}</p>
          <p className="text-xs text-slate-500 truncate max-w-[260px] mt-0.5">
            {incident.location?.address ?? "—"}
          </p>
        </TableCell>

        {/* Categoría */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blanquito/20 text-azul border border-blanquito/40 whitespace-nowrap">
            {capitalize(incident.category?.name ?? "—")}
          </span>
        </TableCell>

        {/* Prioridad */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${PRIORITY_STYLES[priority]}`}>
            {PRIORITY_LABELS[priority] ?? `P${priority}`}
          </span>
        </TableCell>

        {/* Estado */}
        <TableCell className="py-2.5 cursor-pointer" onClick={() => setOpen(true)}>
          <StatusBadge statusName={incident.status?.name} />
        </TableCell>

        {/* Fecha */}
        <TableCell className="py-2.5 text-xs text-slate-500 whitespace-nowrap cursor-pointer" onClick={() => setOpen(true)}>
          {formatDate(incident.createdAt)}
        </TableCell>

        {/* Acciones */}
        <TableCell className="py-2.5 pr-4 w-10">
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 focus:outline-none">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setOpen(true)}
                className="gap-2 cursor-pointer text-sm"
              >
                <Eye size={14} />
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setOpen(true)}
                className="gap-2 cursor-pointer text-sm"
              >
                <RefreshCw size={14} />
                Cambiar Estado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

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
