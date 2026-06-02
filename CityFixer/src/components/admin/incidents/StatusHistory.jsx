import { useState, useEffect } from "react";
import { Bot, UserCog, User } from "lucide-react";
import { getIncidentHistory } from "@/services/api";
import { STATUS_LABELS, capitalize, getStatusStyle } from "@/lib/incidents";

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SOURCE_CONFIG = {
  ai:    { label: "IA",      icon: Bot,     className: "bg-violet-100 text-violet-700" },
  admin: { label: "Admin",   icon: UserCog, className: "bg-blanquito/70 text-azul"     },
  user:  { label: "Usuario", icon: User,    className: "bg-gray-100 text-gray-600"     },
};

export default function StatusHistory({ incidentId }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (history !== null) return;
    setLoading(true);
    getIncidentHistory(incidentId)
      .then((res) => setHistory(res.data.incident?.statusHistory ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [incidentId, history]);

  return (
    <section>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Historial de estados
      </p>

      {loading && (
        <p className="text-xs text-slate-400">Cargando...</p>
      )}

      {!loading && (!history || history.length === 0) && (
        <p className="text-xs text-slate-400">Sin historial registrado.</p>
      )}

      {!loading && history?.length > 0 && (
        <ol className="flex flex-col gap-4">
          {history.map((entry, i) => {
            const statusKey = entry.status?.name;
            const style     = getStatusStyle(statusKey);
            const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
            const src       = SOURCE_CONFIG[entry.source] ?? SOURCE_CONFIG.admin;
            const SrcIcon   = src.icon;
            const changedBy = entry.changedBy
              ? [entry.changedBy.firstName, entry.changedBy.lastName].filter(Boolean).join(" ")
              : null;

            return (
              <li key={i} className="flex items-start gap-3">
                {/* Nodo indicador */}
                <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300 ring-2 ring-white" />
                  {i < history.length - 1 && (
                    <div className="w-px flex-1 min-h-[1rem] bg-slate-200" />
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${src.className}`}>
                      <SrcIcon size={10} />
                      {src.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(entry.changedAt)}
                    {changedBy && (
                      <span className="text-slate-500"> · {changedBy}</span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
