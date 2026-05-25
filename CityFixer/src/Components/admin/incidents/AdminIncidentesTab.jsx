import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import StatusFilterPills from "./StatusFilterPills";
import AdminIncidentList from "./AdminIncidentList";
import { useStatuses } from "@/hooks/useStatuses";

export default function AdminIncidentesTab({ incidents, loading, onUpdated, onNuevoReporte }) {
  const [filter, setFilter] = useState("todos");
  const { statuses } = useStatuses();

  const filtered = useMemo(() => {
    if (filter === "todos") return incidents;
    return incidents.filter((inc) => inc.status?.name === filter);
  }, [incidents, filter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <StatusFilterPills active={filter} onChange={setFilter} statuses={statuses} />
        <div className="flex items-center gap-3 shrink-0">
          <p className="text-xs text-gray-400">
            {loading ? "—" : `${filtered.length} incidente${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <button
            onClick={onNuevoReporte}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292D60] text-white text-xs font-semibold hover:bg-[#2F347A] transition-colors"
          >
            <Plus size={13} />
            Nuevo reporte
          </button>
        </div>
      </div>

      <AdminIncidentList incidents={filtered} loading={loading} onUpdated={onUpdated} />
    </div>
  );
}
