import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import StatusFilterPills from "./StatusFilterPills";
import AdminIncidentList from "./AdminIncidentList";
import { useStatuses } from "@/hooks/useStatuses";

export default function AdminIncidentesTab({ incidents, loading, onUpdated, onNuevoReporte }) {
  const [filter, setFilter] = useState("todos");
  const [userSearch, setUserSearch] = useState("");
  const { statuses } = useStatuses();

  const filtered = useMemo(() => {
    let result = incidents;
    if (filter !== "todos") result = result.filter((inc) => inc.status?.name === filter);
    if (userSearch.trim().length >= 3) {
      const q = userSearch.trim().toLowerCase();
      result = result.filter((inc) => {
        const name = [inc.user?.firstName, inc.user?.lastName].filter(Boolean).join(" ").toLowerCase();
        const email = (inc.user?.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }
    return result;
  }, [incidents, filter, userSearch]);

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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-azul-oscuro text-white text-xs font-semibold hover:bg-azul transition-colors"
          >
            <Plus size={13} />
            Nuevo reporte
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por usuario..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-azul-oscuro/30 transition-all"
          />
        </div>
        {userSearch.trim().length > 0 && userSearch.trim().length < 3 && (
          <p className="text-xs text-gray-400 pl-1">
            Ingresá al menos 3 caracteres para buscar.
          </p>
        )}
      </div>

      <AdminIncidentList incidents={filtered} loading={loading} onUpdated={onUpdated} />
    </div>
  );
}
