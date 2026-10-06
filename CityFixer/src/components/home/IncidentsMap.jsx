// Mapa de portada del inicio: muestra los reportes del usuario como puntos de
// color según su estado. Al tocar un punto se llama a onSelect con el incidente.
//
// Se encuadra solo sobre los incidentes que tienen coordenadas. Si no hay ninguno,
// queda centrado en la ciudad. Mapbox necesita WebGL: si el navegador no lo soporta
// se muestra un fondo de marca en vez de un recuadro roto.
//
// Props:
//   incidents → array de incidentes del usuario (usa location.lat / location.lng)
//   onSelect  → función que recibe el incidente tocado
//   children  → contenido que se superpone al mapa (saludo, botón de reporte)
import { useMemo } from "react";
import Map, { Marker } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";
import { useDark } from "@/lib/theme";

const WEBGL_OK = mapboxgl.supported();
const CITY_VIEW = { longitude: -63.2435, latitude: -32.4097, zoom: 13.5 };

// Color del punto según estado. Hex porque va en un style inline del marcador.
// Sobre el mapa claro se usan tonos más oscuros para que no se pierdan.
const DOT_COLORS_DARK = {
  pendiente:  "#F59E0B",
  dudoso:     "#F59E0B",
  aceptado:   "#2DD4BF",
  en_proceso: "#B7A6F0",
  resuelto:   "#34D399",
  rechazado:  "#FB7185",
  cancelado:  "#94A3B8",
};
const DOT_COLORS_LIGHT = {
  pendiente:  "#D97706",
  dudoso:     "#D97706",
  aceptado:   "#0D9488",
  en_proceso: "#6B4FA8",
  resuelto:   "#059669",
  rechazado:  "#E11D48",
  cancelado:  "#64748B",
};

function getInitialView(points) {
  if (points.length === 0) return CITY_VIEW;
  if (points.length === 1) {
    return { longitude: points[0].lng, latitude: points[0].lat, zoom: 15.5 };
  }
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return {
    bounds: [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    fitBoundsOptions: {
      padding: { top: 120, bottom: 90, left: 60, right: 60 },
      maxZoom: 16,
    },
  };
}

export default function IncidentsMap({ incidents, onSelect, children }) {
  const dark = useDark();
  const dotColors = dark ? DOT_COLORS_DARK : DOT_COLORS_LIGHT;
  const points = useMemo(
    () =>
      incidents
        .filter((i) => i.location?.lat && i.location?.lng)
        .map((i) => ({ incident: i, lat: i.location.lat, lng: i.location.lng })),
    [incidents]
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-100 h-72 md:h-80">
      {WEBGL_OK ? (
        <Map
          initialViewState={getInitialView(points)}
          mapStyle={dark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
          style={{ width: "100%", height: "100%" }}
          dragRotate={false}
          attributionControl={false}
        >
          {points.map(({ incident, lat, lng }) => {
            const key = incident.status?.name;
            const color = dotColors[key] ?? "#94A3B8";
            return (
              <Marker key={incident._id} longitude={lng} latitude={lat} anchor="center">
                <button
                  type="button"
                  onClick={() => onSelect(incident)}
                  title={`${incident.title} · ${STATUS_LABELS[key] ?? capitalize(key)}`}
                  aria-label={`${incident.title}, ${STATUS_LABELS[key] ?? capitalize(key)}`}
                  className="block h-4 w-4 rounded-full border-2 border-white/90 shadow-lg transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 focus-visible:outline-white"
                  style={{ backgroundColor: color, boxShadow: `0 0 0 5px ${color}33` }}
                />
              </Marker>
            );
          })}
        </Map>
      ) : (
        <>
          <div aria-hidden="true" className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-brand/50 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-40 -right-16 h-80 w-80 rounded-full bg-brand-mid/30 blur-3xl" />
        </>
      )}

      {/* Degradados para que el texto superpuesto se lea. Usan slate-50, que en
          claro es casi blanco y en oscuro el violeta de fondo. El tinte de marca
          solo va en oscuro. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-brand/20 mix-blend-color dark:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-50/75 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50/60 to-transparent" />

      {/* El contenedor no captura clics; solo lo hacen los hijos interactivos */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 md:p-6">
        {children}
      </div>
    </div>
  );
}
