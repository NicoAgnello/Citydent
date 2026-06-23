// Tab de inicio (pantalla principal del usuario).
// Muestra un saludo según la hora del día, 4 contadores KPI (total, en proceso,
// resueltos, rechazados) y una lista de los últimos 5 incidentes del usuario.
// También tiene un botón flotante para crear un nuevo reporte.
//
// Props:
//   user          → datos del usuario de Clerk (para mostrar el nombre en el saludo)
//   incidents     → array de incidentes del usuario (de useIncidents)
//   loading       → booleano, muestra skeletons mientras carga
//   onVerTodos    → función sin argumentos, cambia al tab "reportes"
//   onNuevoReporte → función sin argumentos, abre el modal de nuevo reporte
//   onUpdated     → función sin argumentos, recarga la lista tras cancelar un incidente
//
// Se usa en Home.jsx como contenido del tab "inicio".
import { ChevronRight, Plus, MapPin } from "lucide-react";
import IncidentCard, { EmptyState } from "./IncidentCard";
import IncidentSkeleton from "./IncidentSkeleton";
import { STATUS_KEYS } from "@/lib/incidents";

export default function InicioTab({ user, incidents, loading, onVerTodos, onNuevoReporte, onUpdated }) {
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const recent   = incidents.slice(0, 5);

  // ── Contadores KPI ──
  const total      = incidents.length;
  const enProceso  = incidents.filter((i) => i.status?.name === STATUS_KEYS.IN_PROCESS).length;
  const resueltos  = incidents.filter((i) => i.status?.name === STATUS_KEYS.RESOLVED).length;
  const rechazados = incidents.filter((i) => i.status?.name === STATUS_KEYS.REJECTED).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Columna principal (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Saludo */}
          <div>
            <p className="text-sm text-slate-400">{greeting},</p>
            <h2 className="text-2xl font-bold text-slate-900">{user?.firstName ?? "Ciudadano"}</h2>
          </div>

          {/* CTA card — solo mobile */}
          <div
            className="lg:hidden rounded-2xl bg-primary px-5 py-6 flex flex-col gap-4 cursor-pointer active:opacity-95 transition-opacity"
            onClick={onNuevoReporte}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-snug">¿Ves algo en tu ciudad?</p>
                <p className="text-white/65 text-sm mt-1">Reportalo y ayudá a que se resuelva más rápido.</p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onNuevoReporte(); }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white text-primary text-sm font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <Plus size={15} />
              Cargar Incidente
            </button>
          </div>

          {/* KPI — 2×2 en mobile, fila única en md+ */}
          {loading ? (
            <div className="h-24 md:h-[72px] bg-white rounded-xl border border-slate-100 animate-pulse" />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-0 bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
              {[
                { value: total,      label: "Reportados",  color: "text-slate-900"   },
                { value: enProceso,  label: "En proceso",  color: "text-brand-mid"   },
                { value: resueltos,  label: "Resueltos",   color: "text-emerald-600" },
                { value: rechazados, label: "Rechazados",  color: "text-red-500"     },
              ].map(({ value, label, color }, i) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-0.5 p-4 ${i < 3 ? "md:border-r md:border-slate-100" : ""}`}
                >
                  <span className={`text-xl font-bold ${color}`}>{value}</span>
                  <span className="text-[11px] tracking-tight text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reportes recientes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">Mis Reportes Recientes</p>
              <button
                onClick={onVerTodos}
                className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
              >
                Ver todos <ChevronRight size={13} />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2.5">
                <IncidentSkeleton />
                <IncidentSkeleton />
                <IncidentSkeleton />
              </div>
            ) : recent.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col gap-2.5">
                {recent.map((inc) => (
                  <IncidentCard key={inc._id} incident={inc} onUpdated={onUpdated} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Columna lateral (1/3, solo desktop) ── */}
        <div className="hidden lg:flex flex-col gap-4 lg:col-span-1">

          {/* CTA Card */}
          <div className="rounded-2xl bg-primary p-6 flex flex-col gap-4 sticky top-20">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <MapPin size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-snug">¿Ves algo en tu ciudad?</p>
              <p className="text-white/65 text-sm mt-1">Reportalo y ayudá a que se resuelva más rápido.</p>
            </div>
            <button
              onClick={onNuevoReporte}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-primary text-sm font-bold hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <Plus size={16} />
              Cargar Incidente
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
