import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import HeatmapLayer from "./HeatmapLayer";

const DEFAULT_CENTER = [-32.4097, -63.2435];
const DEFAULT_ZOOM   = 13;

// Dispara invalidateSize cuando el contenedor cambia de tamaño
// (incluye la transición de display:none → display:block al activar el tab)
function MapResizeObserver() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer  = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function AdminHeatmapView({ incidents, loading }) {
  const heatPoints = useMemo(
    () =>
      incidents
        .filter(
          (inc) =>
            typeof inc.location?.lat === "number" &&
            typeof inc.location?.lng === "number"
        )
        .map((inc) => [inc.location.lat, inc.location.lng, 1]),
    [incidents]
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

      {/* Encabezado */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900">Densidad geográfica de reportes</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {heatPoints.length} incidente{heatPoints.length !== 1 ? "s" : ""} geolocalizados de {incidents.length} totales
        </p>
      </div>

      {/* Mapa + overlays */}
      <div className="relative">

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-[500px] w-full rounded-xl z-0"
          scrollWheelZoom
          attributionControl={false}
        >
          {/* Tiles monocromáticos para que el calor resalte */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <MapResizeObserver />

          {heatPoints.length > 0 && <HeatmapLayer points={heatPoints} />}
        </MapContainer>

        {/* Leyenda de intensidad */}
        <div className="absolute bottom-5 right-4 z-[1001] bg-white/90 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-sm px-3 py-2.5 pointer-events-none select-none">
          <p className="text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            Intensidad
          </p>
          <div
            className="h-2 w-24 rounded-full"
            style={{
              background: "linear-gradient(to right, #a78bfa, #7c3aed, #5C3F99, #f97316, #dc2626)",
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-400">Baja</span>
            <span className="text-[9px] text-slate-400">Alta</span>
          </div>
        </div>

        {/* Estado vacío cuando no hay coordenadas */}
        {heatPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[999] rounded-xl pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-sm border border-slate-100 text-center">
              <p className="text-sm font-semibold text-slate-700">Sin datos georreferenciados</p>
              <p className="text-xs text-slate-400 mt-1">
                Los reportes sin coordenadas no aparecen en el mapa
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
