// Editor inline de prioridad de un incidente (escala 1-10).
// En modo normal muestra un badge con el nivel y el label (Muy baja / Baja / Media / Alta / Crítica).
// Al hacer clic en el lápiz, muestra 10 puntos de colores para seleccionar el nuevo valor.
// Al confirmar, hace PATCH al backend con la nueva prioridad.
//
// Props:
//   incidentId → id del incidente a actualizar
//   priority   → valor actual de prioridad (número 1-10)
//   onUpdated  → función sin argumentos, recarga el incidente tras guardar
//
// Se usa dentro de AIInsights.jsx en la sección de análisis IA del detalle de incidente.
import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { updateIncidentPriority } from "@/services/api";

function getPriorityConfig(p) {
  if (p <= 2)  return { label: "Muy baja", bar: "bg-green-400",   text: "text-green-700",   bg: "bg-green-100"   };
  if (p <= 4)  return { label: "Baja",     bar: "bg-lime-400",    text: "text-lime-700",    bg: "bg-lime-100"    };
  if (p <= 6)  return { label: "Media",    bar: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-100"   };
  if (p <= 8)  return { label: "Alta",     bar: "bg-orange-500",  text: "text-orange-700",  bg: "bg-orange-100"  };
               return { label: "Crítica",  bar: "bg-red-500",     text: "text-red-700",     bg: "bg-red-100"     };
}

export default function PriorityEditor({ incidentId, priority, onUpdated }) {
  const [editing,  setEditing]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);

  const activeValue = editing && selected ? selected : priority;
  const cfg         = getPriorityConfig(activeValue);

  const handleConfirm = async () => {
    if (!selected || selected === priority) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateIncidentPriority(incidentId, selected);
      onUpdated?.();
    } finally {
      setSaving(false);
      setEditing(false);
      setSelected(null);
    }
  };

  const handleCancel = () => { setEditing(false); setSelected(null); };

  return (
    <div className="flex flex-col gap-2">
      {/* Badge + botón editar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">Prioridad</span>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
            {activeValue}/10 — {cfg.label}
          </span>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setSelected(priority); }}
              className="text-gray-400 hover:text-violet-500 transition-colors"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso (10 segmentos) */}
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => {
          const segCfg = getPriorityConfig(i + 1);
          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i < activeValue ? segCfg.bar : "bg-gray-200"}`}
            />
          );
        })}
      </div>

      {/* Selector (solo en modo edición) */}
      {editing && (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => {
              const p    = i + 1;
              const pcfg = getPriorityConfig(p);
              return (
                <button
                  key={p}
                  onClick={() => setSelected(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${
                    selected === p
                      ? `${pcfg.bg} ${pcfg.text} border-current`
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={saving || selected === priority}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold disabled:opacity-50 transition-colors"
            >
              <Check size={13} />
              {saving ? "Guardando..." : "Confirmar"}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors"
            >
              <X size={13} />
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
