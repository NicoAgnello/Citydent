// Mapa de calor interactivo de incidentes (vista del panel admin).
// Muestra todos los incidentes (excepto rechazados y dudosos) como un heatmap de colores
// sobre el mapa de Mapbox. Al hacer clic en una zona, aparece un panel lateral con
// el resumen del grupo de incidentes y botones para navegar a él en la lista.
//
// La intensidad del calor depende de la prioridad del incidente (a mayor prioridad, más peso).
//
// Props:
//   incidents       → array de incidentes con coordenadas (lat/lng en location)
//   onTabChange     → función que recibe un tab id, para navegar al tab de incidentes
//   onFocusIncident → función que recibe un id de incidente, para abrirlo desde la lista
//
// Se usa en AdminEstadisticasTab.jsx dentro de la pestaña "Mapa de Calor".
import { useMemo, useState, useCallback } from "react";
import Map from "react-map-gl";
import HeatmapLayer from "./HeatmapLayer";
import { STATUS_LABELS, STATUS_STYLES, capitalize } from "@/lib/incidents";
import { X, MapPin, Users, Calendar, Tag, ArrowRight } from "lucide-react";

const DEFAULT_VIEW = { longitude: -63.2435, latitude: -32.4097, zoom: 13 };
const EXCLUDED_STATUSES = new Set(["rechazado", "dudoso"]);

function priorityMeta(p) {
  if (p >= 9) return { label: "Crítica",   color: "text-red-600    bg-red-50"    };
  if (p >= 7) return { label: "Alta",      color: "text-orange-600 bg-orange-50" };
  if (p >= 5) return { label: "Media",     color: "text-amber-600  bg-amber-50"  };
  if (p >= 3) return { label: "Baja",      color: "text-lime-600   bg-lime-50"   };
  return       { label: "Muy baja",        color: "text-green-600  bg-green-50"  };
}

function GroupDetailPanel({ group, onClose, onTabChange, onFocusIncident }) {
  const statusName  = group.status?.name;
  const statusLabel = STATUS_LABELS[statusName] ?? statusName ?? "—";
  const statusStyle = STATUS_STYLES[statusName] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  const { label: priLabel, color: priColor } = priorityMeta(group.priority ?? 5);
  const category     = capitalize(group.category?.name    ?? "Sin categoría");
  const neighborhood = group.neighborhood?.name           ?? "Sin barrio";
  const count        = group.incidents?.length            ?? 1;
  const title        = capitalize(group.representativeId?.title ?? "Incidente sin título");
  const date         = group.createdAt
    ? new Date(group.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const lastHistory  = group.statusHistory?.[group.statusHistory.length - 1];
  const lastUpdate   = lastHistory?.changedAt ?? group.updatedAt;
  const lastUpdateStr = lastUpdate
    ? new Date(lastUpdate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="absolute top-3 right-3 z-20 w-72 bg-white rounded-xl border border-slate-200/80 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">{title}</p>
          <div className="flex items-center gap-1 mt-1">
            <Tag size={10} className="text-slate-300 shrink-0" />
            <p className="text-[11px] text-slate-400 truncate">{category}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>

      {/* Chips */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          {statusLabel}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priColor}`}>
          Prioridad {priLabel}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 pt-2.5 pb-4 flex flex-col gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Users size={11} className="text-slate-300 shrink-0" />
          <span>
            <span className="font-semibold text-slate-700">{count}</span>{" "}
            reporte{count !== 1 ? "s" : ""} agrupado{count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={11} className="text-slate-300 shrink-0" />
          <span>Barrio: <span className="font-semibold text-slate-700">{neighborhood}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={11} className="text-slate-300 shrink-0" />
          <span>Creado el {date}</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRight size={11} className="text-slate-300 shrink-0" />
          <span>Últ. actualización: {lastUpdateStr}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3">
        <button
          onClick={() => { onFocusIncident?.(group._id); onTabChange?.("incidentes"); onClose(); }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
        >
          Ver grupo <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
}

export default function AdminHeatmapView({ incidents, loading, onTabChange, onFocusIncident }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [cursor, setCursor] = useState("grab");

  const heatPoints = useMemo(
    () =>
      incidents
        .filter((inc) => {
          if (EXCLUDED_STATUSES.has(inc.status?.name)) return false;
          const loc = inc.representativeId?.location;
          return typeof loc?.lat === "number" && typeof loc?.lng === "number";
        })
        .map((inc) => ({
          lat:      inc.representativeId.location.lat,
          lng:      inc.representativeId.location.lng,
          weight:   inc.incidents?.length ?? 1,
          id:       String(inc._id),
          priority: inc.priority ?? 5,
        })),
    [incidents],
  );

  const handleClick = useCallback(
    (e) => {
      const features = e.features ?? [];
      if (!features.length) { setSelectedGroup(null); return; }
      const id    = features[0].properties?.id;
      const group = incidents.find((i) => String(i._id) === id);
      setSelectedGroup(group ?? null);
    },
    [incidents],
  );

  const handleMouseMove = useCallback((e) => {
    setCursor((e.features ?? []).length > 0 ? "pointer" : "grab");
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
        <div className="h-[500px] bg-slate-50 rounded-xl animate-pulse flex items-center justify-center">
          <p className="text-xs text-slate-400">Cargando mapa de calor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900">Densidad geográfica de reportes</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {heatPoints.length} grupo{heatPoints.length !== 1 ? "s" : ""} geolocalizados de{" "}
          {incidents.length} totales · Hacé zoom para ver y clickear grupos individuales
        </p>
      </div>

      <div className="relative">
        <div className="h-[500px] rounded-xl overflow-hidden">
          <Map
            initialViewState={DEFAULT_VIEW}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: "100%", height: "100%" }}
            dragRotate={false}
            attributionControl={false}
            interactiveLayerIds={["incidents-circles"]}
            cursor={cursor}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
          >
            <HeatmapLayer points={heatPoints} />
          </Map>
        </div>

        {selectedGroup && (
          <GroupDetailPanel
            group={selectedGroup}
            onClose={() => setSelectedGroup(null)}
            onTabChange={onTabChange}
            onFocusIncident={onFocusIncident}
          />
        )}

        {/* Leyenda de calor */}
        <div className="absolute bottom-5 right-4 z-10 bg-white/90 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-sm px-3 py-2.5 pointer-events-none select-none">
          <p className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            Intensidad
          </p>
          <div
            className="h-2 w-24 rounded-full"
            style={{ background: "linear-gradient(to right, #a78bfa, #7c3aed, #5C3F99, #f97316, #dc2626)" }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">Baja</span>
            <span className="text-[9px] text-slate-400">Alta</span>
          </div>
        </div>

        {heatPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-sm border border-slate-100 text-center">
              <p className="text-sm font-semibold text-slate-700">Sin datos georreferenciados</p>
              <p className="text-xs text-slate-400 mt-1">Los reportes sin coordenadas no aparecen en el mapa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
