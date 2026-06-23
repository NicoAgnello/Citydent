// Sección de análisis de inteligencia artificial de un incidente.
// Muestra: prioridad editable (PriorityEditor), categoría sugerida por la IA,
// justificación en texto, y un badge de "¡Emergencia!" si la IA lo marcó así.
// Solo se renderiza si el incidente tiene resultados de IA (ai_justification o
// ai_suggested_category en su representativeId). Si no hay IA, devuelve null.
//
// Props:
//   incident  → objeto de incidente (se accede a incident.representativeId para los datos de IA)
//   onUpdated → función sin argumentos, se pasa a PriorityEditor para recargar tras editar
//
// Se usa en IncidentDetailSheet cuando el usuario es admin.
import { Bot, Zap } from "lucide-react";
import { capitalize } from "@/lib/incidents";
import PriorityEditor from "./PriorityEditor";

export default function AIInsights({ incident, onUpdated }) {
  const rep      = incident.representativeId ?? {};
  const priority = Math.min(Math.max(Math.round(incident.priority ?? 1), 1), 10);
  const hasAI    = rep.ai_justification || rep.ai_suggested_category;

  if (!hasAI) return null;

  return (
    <section className="rounded-2xl bg-violet-50 border border-violet-100 p-4 flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 uppercase tracking-wider">
          <Bot size={13} />
          Análisis IA
        </span>
        {rep.is_emergency && (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
            <Zap size={10} /> Emergencia
          </span>
        )}
      </div>

      <PriorityEditor
        incidentId={incident._id}
        priority={priority}
        onUpdated={onUpdated}
      />

      <div className="flex flex-col gap-2 border-t border-violet-100 pt-3">
        {rep.ai_suggested_category && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Categoría sugerida</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {capitalize(rep.ai_suggested_category)}
            </span>
          </div>
        )}
        {rep.ai_justification && (
          <p className="text-xs text-gray-500 leading-relaxed italic">
            "{rep.ai_justification}"
          </p>
        )}
      </div>

    </section>
  );
}
