// Lista de incidentes del panel admin. Muestra la vista correcta según el tamaño de pantalla:
//   - Desktop (md+): tabla con AdminIncidentRow
//   - Mobile:        tarjetas con AdminIncidentCard
//
// También maneja el foco automático: si llega un focusedIncidentId (desde una notificación),
// busca el incidente en la lista y abre su detalle automáticamente.
//
// Props:
//   incidents         → array de incidentes filtrados
//   loading           → booleano, muestra skeletons mientras carga
//   onUpdated         → función sin argumentos, recarga la lista tras cambios
//   focusedIncidentId → id de incidente a abrir automáticamente
//   onClearFocus      → función sin argumentos, limpia el foco tras usarlo
//   isReadOnly        → booleano, si true oculta las acciones de cambio de estado
//
// Se usa en AdminIncidentesTab.jsx.
import { useState, useEffect } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminIncidentRow from "./AdminIncidentRow";
import AdminIncidentCard from "./AdminIncidentCard";
import IncidentDetailSheet from "@/components/home/IncidentDetailSheet";
import IncidentAdminActions from "./IncidentAdminActions";
import IncidentSkeleton from "@/components/home/IncidentSkeleton";
import { EmptyState } from "@/components/home/IncidentCard";

export default function AdminIncidentList({ incidents, loading, onUpdated, focusedIncidentId, onClearFocus, isReadOnly = false }) {
  const [focusedIncident, setFocusedIncident] = useState(null);
  const [focusedOpen,     setFocusedOpen]     = useState(false);

  useEffect(() => {
    if (!focusedIncidentId || focusedOpen) return;
    const found = incidents.find((i) => i._id === focusedIncidentId);
    if (found) {
      setFocusedIncident(found);
      setFocusedOpen(true);
      onClearFocus?.();
    }
  }, [focusedIncidentId, incidents]);

  const handleFocusedOpenChange = (v) => {
    setFocusedOpen(v);
    if (!v) setFocusedIncident(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => <IncidentSkeleton key={i} />)}
      </div>
    );
  }

  if (!incidents.length) {
    return <EmptyState message="No hay incidentes para mostrar." />;
  }

  return (
    <>
      {/* ── DESKTOP: Data Table ── */}
      <div className="hidden md:block rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/60 border-b border-gray-100">
              <TableHead className="pl-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Incidente
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Categoría
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Prioridad
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Fecha
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((inc) => (
              <AdminIncidentRow key={inc._id} incident={inc} onUpdated={onUpdated} isReadOnly={isReadOnly} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── MOBILE: Cards simplificadas ── */}
      <div className="md:hidden flex flex-col gap-2.5">
        {incidents.map((inc) => (
          <AdminIncidentCard key={inc._id} incident={inc} onUpdated={onUpdated} isReadOnly={isReadOnly} />
        ))}
      </div>

      {/* ── Sheet único para el incidente buscado (desktop y mobile) ── */}
      {focusedIncident && (
        <IncidentDetailSheet
          incident={focusedIncident}
          open={focusedOpen}
          onOpenChange={handleFocusedOpenChange}
          isAdmin
          onUpdated={onUpdated}
          actions={
            isReadOnly ? null : (
              <IncidentAdminActions
                incident={focusedIncident}
                onUpdated={() => { onUpdated?.(); handleFocusedOpenChange(false); }}
              />
            )
          }
        />
      )}
    </>
  );
}