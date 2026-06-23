// Tab "Mis Reportes" — muestra todos los incidentes del usuario en grilla.
// Cada tarjeta es un IncidentGridCard con foto de portada y badge de estado.
// Mientras carga, muestra skeletons animados (GridSkeleton) en lugar de las tarjetas.
// Si no hay incidentes, muestra EmptyState con un mensaje.
//
// Props:
//   incidents → array de incidentes del usuario (de useIncidents)
//   loading   → booleano, muestra skeletons mientras carga
//   onUpdated → función sin argumentos, recarga la lista tras cancelar un incidente
//
// Se usa en Home.jsx como contenido del tab "reportes".
import { EmptyState } from "./IncidentCard";
import IncidentGridCard from "./IncidentGridCard";

function GridSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs animate-pulse">
      <div className="h-40 bg-slate-100" />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 bg-slate-100 rounded-full flex-1" />
          <div className="h-5 w-16 bg-slate-100 rounded-full shrink-0" />
        </div>
        <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        <div className="h-3 bg-slate-100 rounded-full w-1/4 ml-auto mt-1" />
      </div>
    </div>
  );
}

export default function ReportesTab({ incidents, loading, onUpdated }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <p className="text-sm font-semibold text-slate-900 mb-4">
        Todos mis reportes
        {!loading && incidents.length > 0 && (
          <span className="ml-2 text-xs font-normal text-slate-400">({incidents.length})</span>
        )}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <GridSkeleton key={i} />)}
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.map((inc) => (
            <IncidentGridCard key={inc._id} incident={inc} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
