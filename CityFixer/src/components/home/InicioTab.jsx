// Tab de inicio (pantalla principal del usuario).
// Arriba, un mapa con los reportes del usuario como puntos de color, con el saludo
// y el botón para cargar un incidente superpuestos. Debajo, la lista de los últimos
// 5 reportes (con foto y progreso) y un resumen de estados.
//
// Props:
//   user          → datos del usuario de Clerk (para mostrar el nombre en el saludo)
//   incidents     → array de incidentes del usuario (de useIncidents)
//   loading       → booleano, muestra skeletons mientras carga
//   onVerTodos    → función sin argumentos, cambia al tab "reportes"
//   onNuevoReporte → función sin argumentos, abre el modal de nuevo reporte
//   onUpdated     → función sin argumentos, recarga la lista tras cancelar un incidente
//
// Se usa en Home.jsx como contenido del tab "inicio".
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import IncidentCard, { EmptyState } from "./IncidentCard";
import IncidentSkeleton from "./IncidentSkeleton";
import IncidentsMap from "./IncidentsMap";
import IncidentDetailSheet from "./IncidentDetailSheet";
import StatusSummary from "./StatusSummary";

export default function InicioTab({ user, incidents, loading, onVerTodos, onNuevoReporte, onUpdated }) {
  const [selected, setSelected] = useState(null);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const recent   = incidents.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* ── Portada: mapa con saludo y botón de reporte ── */}
      {loading ? (
        <div className="h-72 md:h-80 rounded-2xl bg-slate-200 animate-pulse" />
      ) : (
        <IncidentsMap incidents={incidents} onSelect={setSelected}>
          <div>
            <p className="text-sm text-white/70">{greeting},</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {user?.firstName ?? "Ciudadano"}
            </h2>
          </div>

          <div className="flex items-end justify-between gap-4">
            <p className="hidden sm:block max-w-xs text-sm text-white/70">
              {incidents.length === 0
                ? "Todavía no reportaste nada. Si ves algo roto en tu barrio, cargalo."
                : "Tocá un punto del mapa para ver el detalle de ese reporte."}
            </p>
            <button
              onClick={onNuevoReporte}
              className="pointer-events-auto flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/30 hover:bg-brand-mid active:bg-brand-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Plus size={16} />
              Cargar incidente
            </button>
          </div>
        </IncidentsMap>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Resumen de estados (arriba en mobile, a la derecha en desktop) ── */}
        <div className="lg:col-span-1 lg:order-2">
          {loading ? (
            <div className="h-56 rounded-2xl bg-white border border-slate-100 animate-pulse" />
          ) : (
            <StatusSummary incidents={incidents} />
          )}
        </div>

        {/* ── Reportes recientes ── */}
        <section className="lg:col-span-2 lg:order-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Mis reportes recientes</h2>
            <button
              onClick={onVerTodos}
              className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
            >
              Ver todos <ChevronRight size={13} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              <IncidentSkeleton />
              <IncidentSkeleton />
              <IncidentSkeleton />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2.5">
              {recent.map((inc) => (
                <IncidentCard key={inc._id} incident={inc} onUpdated={onUpdated} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Detalle del reporte tocado en el mapa */}
      {selected && (
        <IncidentDetailSheet
          incident={selected}
          open
          onOpenChange={(o) => !o && setSelected(null)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  );
}
