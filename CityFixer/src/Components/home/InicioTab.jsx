import { ChevronRight, Plus } from "lucide-react";
import IncidentCard, { EmptyState } from "./IncidentCard";
import IncidentSkeleton from "./IncidentSkeleton";
import KpiSection from "./KpiSection";

export default function InicioTab({ user, incidents, loading, onVerTodos, onNuevoReporte }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const recent = incidents.slice(0, 3);

  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      <div>
        <p className="text-sm text-gray-400">{greeting},</p>
        <h2 className="text-2xl font-bold text-azul-oscuro">{user?.firstName ?? "Ciudadano"}</h2>
      </div>

      <div className="rounded-2xl bg-azul-oscuro px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-white font-semibold text-sm">¿Ves algo en tu ciudad?</p>
            <p className="text-blanquito/70 text-xs mt-0.5">Reportalo y ayudá a resolverlo</p>
          </div>
        </div>
        <button
          onClick={onNuevoReporte}
          className="flex items-center justify-center gap-1.5 w-full md:w-auto md:shrink-0 px-4 py-2.5 rounded-xl bg-white text-azul-oscuro text-sm font-bold hover:bg-blanquito transition-colors"
        >
          <Plus size={15} />
          Cargar Incidente
        </button>
      </div>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen</p>
        <KpiSection incidents={incidents} loading={loading} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Últimos reportes
          </p>
          <button
            onClick={onVerTodos}
            className="text-xs text-celestito font-semibold flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={13} />
          </button>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">
            <IncidentSkeleton />
            <IncidentSkeleton />
            <IncidentSkeleton />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((inc) => <IncidentCard key={inc._id} incident={inc} />)}
          </div>
        )}
      </section>
    </div>
  );
}
