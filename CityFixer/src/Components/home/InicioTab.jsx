import { ChevronRight, ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import IncidentCard, { EmptyState } from "./IncidentCard";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4">
        <Icon size={18} className={`mb-2 ${color}`} />
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function InicioTab({ user, incidents, onVerTodos }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const kpis = [
    { label: "Reportados",  value: incidents.length,                                           icon: ClipboardList, color: "text-[#292D60]" },
    { label: "En revisión", value: incidents.filter((i) => i.estado === "En revisión").length, icon: Clock,         color: "text-[#3B418F]" },
    { label: "Resueltos",   value: incidents.filter((i) => i.estado === "Resuelto").length,    icon: CheckCircle2,  color: "text-green-600" },
    { label: "Rechazados",  value: incidents.filter((i) => i.estado === "Rechazado").length,   icon: XCircle,       color: "text-red-500"   },
  ];

  const recent = incidents.slice(0, 3);

  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      <div>
        <p className="text-sm text-gray-400">{greeting},</p>
        <h2 className="text-2xl font-bold text-[#292D60]">{user?.firstName ?? "Ciudadano"}</h2>
      </div>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen</p>
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Últimos reportes
          </p>
          <button
            onClick={onVerTodos}
            className="text-xs text-[#3B418F] font-semibold flex items-center gap-0.5"
          >
            Ver todos <ChevronRight size={13} />
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
