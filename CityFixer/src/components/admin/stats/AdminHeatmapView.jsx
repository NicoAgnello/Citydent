import { useMemo } from "react";
import Map from "react-map-gl";
import HeatmapLayer from "./HeatmapLayer";

const DEFAULT_VIEW = { longitude: -63.2435, latitude: -32.4097, zoom: 13 };

export default function AdminHeatmapView({ incidents, loading }) {
  const heatPoints = useMemo(
    () =>
      incidents
        .filter(
          (inc) =>
            typeof inc.location?.lat === "number" &&
            typeof inc.location?.lng === "number",
        )
        .map((inc) => [inc.location.lat, inc.location.lng]),
    [incidents],
  );

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
          {heatPoints.length} incidente{heatPoints.length !== 1 ? "s" : ""} geolocalizados de {incidents.length} totales
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
          >
            <HeatmapLayer points={heatPoints} />
          </Map>
        </div>

        {/* Leyenda */}
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
