import IncidentCard, { EmptyState } from "./IncidentCard";

export default function ReportesTab({ incidents }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Todos mis reportes
      </p>
      {incidents.length === 0 ? (
        <EmptyState />
      ) : (
        incidents.map((inc) => <IncidentCard key={inc.id} incident={inc} />)
      )}
    </div>
  );
}
