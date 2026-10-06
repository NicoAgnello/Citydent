// Mapa de portada del inicio: muestra los reportes del usuario como puntos de
// color según su estado. Al pasar el mouse (o enfocar con teclado) sobre un punto
// aparece una tarjeta con el resumen; al tocar el punto o el botón de la tarjeta se
// llama a onSelect con el incidente.
//
// Para armar la tarjeta se leen, si existen: title, status, photos, location.address,
// category.name, priority, reportsCount y createdAt.
//
// Se encuadra solo sobre los incidentes que tienen coordenadas. Si no hay ninguno,
// queda centrado en la ciudad. Mapbox necesita WebGL: si el navegador no lo soporta
// se muestra un fondo de marca en vez de un recuadro roto.
//
// Props:
//   incidents → array de incidentes del usuario (usa location.lat / location.lng)
//   onSelect  → función que recibe el incidente tocado
//   children  → contenido que se superpone al mapa (saludo, botón de reporte)
//   plain     → si es true no dibuja degradados ni capa de contenido (mapa solo)
//   className → alto del contenedor (por defecto h-72 md:h-80)
import { useMemo, useRef, useState } from "react";
import Map, { Marker } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import { MapPin, ImageOff, Users } from "lucide-react";
import { STATUS_LABELS, STATUS_BADGE, capitalize } from "@/lib/incidents";
import { formatDate } from "@/lib/dates";
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

function getPriorityLabel(p) {
  if (p <= 2) return "Muy baja";
  if (p <= 4) return "Baja";
  if (p <= 6) return "Media";
  if (p <= 8) return "Alta";
  return "Crítica";
}

// Tarjeta de resumen que sale al pasar el mouse por un punto. Vive dentro del propio
// marcador, así que mientras el mouse esté sobre el punto o sobre la tarjeta sigue
// abierta y se puede hacer clic en "Abrir detalle". `placement` indica de qué lado del
// punto se dibuja para que no se corte contra el borde del mapa.
function SummaryCard({ incident, placement, onOpen }) {
  const key       = incident.status?.name;
  const label     = STATUS_LABELS[key] ?? capitalize(key);
  const badgeCls  = STATUS_BADGE[key] ?? "bg-gray-50 text-gray-500 border border-gray-200";
  const photo     = incident.photos?.[0];
  const isVideo   = /\.(mp4|webm|ogg|mov|m4v|avi)(\?.*)?$/i.test(photo ?? "");
  const vertical  = placement.v === "below" ? "top-full" : "bottom-full";
  const bridge    = placement.v === "below" ? "pt-2" : "pb-2";
  const horizontal =
    placement.h === "left" ? "left-0" : placement.h === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div className={`absolute z-10 w-64 ${vertical} ${horizontal} ${bridge}`} onClick={(e) => e.stopPropagation()}>
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl">
        <div className="flex gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {!photo || isVideo ? (
              <div className="flex h-full w-full items-center justify-center">
                <ImageOff size={16} className="text-slate-300" />
              </div>
            ) : (
              <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{incident.title}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeCls}`}>
              {label}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={11} className="shrink-0 text-slate-400" />
          <span className="truncate">{incident.location?.address ?? "—"}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
          {incident.priority != null && (
            <span className="font-medium text-slate-600">
              Prioridad {incident.priority} · {getPriorityLabel(incident.priority)}
            </span>
          )}
          {incident.category?.name && <span>{capitalize(incident.category.name)}</span>}
          {incident.reportsCount > 1 && (
            <span className="inline-flex items-center gap-1">
              <Users size={10} />
              {incident.reportsCount} reportes
            </span>
          )}
          {incident.createdAt && <span className="ml-auto">{formatDate(incident.createdAt)}</span>}
        </div>

        <button
          type="button"
          onClick={() => onOpen(incident)}
          className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-brand-mid"
        >
          Abrir detalle
        </button>
      </div>
    </div>
  );
}

export default function IncidentsMap({ incidents, onSelect, children, plain = false, className = "h-72 md:h-80" }) {
  const dark = useDark();
  const dotColors = dark ? DOT_COLORS_DARK : DOT_COLORS_LIGHT;
  const containerRef = useRef(null);
  const closeTimer   = useRef(null);
  const [hovered, setHovered] = useState(null); // { id, placement }

  // Abre la tarjeta del punto y decide de qué lado dibujarla según la distancia a los
  // bordes del mapa. Cancela un cierre pendiente: así se puede pasar del punto a la tarjeta.
  const openCard = (id, el) => {
    clearTimeout(closeTimer.current);
    const box = containerRef.current?.getBoundingClientRect();
    const dot = el.getBoundingClientRect();
    const placement = { v: "above", h: "center" };
    if (box) {
      if (dot.top - box.top < 230) placement.v = "below";
      if (dot.left - box.left < 150) placement.h = "left";
      else if (box.right - dot.right < 150) placement.h = "right";
    }
    setHovered({ id, placement });
  };
  const closeCard = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(null), 150);
  };
  const points = useMemo(
    () =>
      incidents
        .filter((i) => i.location?.lat && i.location?.lng)
        .map((i) => ({ incident: i, lat: i.location.lat, lng: i.location.lng })),
    [incidents]
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden rounded-2xl bg-slate-100 ${className}`}>
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
              <Marker
                key={incident._id}
                longitude={lng}
                latitude={lat}
                anchor="center"
                style={{ zIndex: hovered?.id === incident._id ? 20 : 1 }}
              >
                <div
                  className="relative"
                  onMouseEnter={(e) => openCard(incident._id, e.currentTarget)}
                  onMouseLeave={closeCard}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(incident)}
                    onFocus={(e) => openCard(incident._id, e.currentTarget)}
                    onBlur={closeCard}
                    aria-label={`${incident.title}, ${STATUS_LABELS[key] ?? capitalize(key)}`}
                    className="block h-4 w-4 rounded-full border-2 border-white/90 shadow-lg transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 focus-visible:outline-white"
                    style={{ backgroundColor: color, boxShadow: `0 0 0 5px ${color}33` }}
                  />
                  {hovered?.id === incident._id && (
                    <SummaryCard incident={incident} placement={hovered.placement} onOpen={onSelect} />
                  )}
                </div>
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

      {!plain && (
        <>
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
        </>
      )}
    </div>
  );
}
