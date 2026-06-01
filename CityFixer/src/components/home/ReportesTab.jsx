import IncidentCard, { EmptyState } from "./IncidentCard";
import IncidentSkeleton from "./IncidentSkeleton";

export default function ReportesTab({ incidents, loading, onUpdated }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Todos mis reportes
      </p>
      {loading ? (
        <>
          <IncidentSkeleton />
          <IncidentSkeleton />
          <IncidentSkeleton />
          <IncidentSkeleton />
        </>
      ) : incidents.length === 0 ? (
        <EmptyState />
      ) : (
        incidents.map((inc) => <IncidentCard key={inc._id} incident={inc} onUpdated={onUpdated} />)
      )}
    </div>
  );
}
