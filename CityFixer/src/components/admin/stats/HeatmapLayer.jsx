// Capa de mapa de calor de Mapbox GL, renderizada dentro de un mapa de react-map-gl.
// Convierte el array de incidentes en un GeoJSON de puntos y los pinta con un gradiente
// de colores que va de violeta (baja densidad) a rojo (alta densidad).
// La opacidad se desvanece a medida que se hace zoom para evitar tapar los marcadores.
//
// Props:
//   incidents → array de incidentes con location.lat y location.lng
//
// Se usa dentro de AdminHeatmapView.jsx como layer del mapa Mapbox.
import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";

const heatmapLayerStyle = {
  id: "incidents-heat",
  type: "heatmap",
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 1, 0.5, 10, 3],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 18, 3],
    "heatmap-color": [
      "interpolate", ["linear"], ["heatmap-density"],
      0,    "rgba(0,0,0,0)",
      0.15, "#a78bfa",
      0.40, "#7c3aed",
      0.60, "#5C3F99",
      0.80, "#f97316",
      1.0,  "#dc2626",
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 15, 18, 35],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.85, 14.5, 0],
  },
};

const circleLayerStyle = {
  id: "incidents-circles",
  type: "circle",
  minzoom: 12,
  paint: {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, ["interpolate", ["linear"], ["get", "weight"], 1, 4, 15, 9],
      16, ["interpolate", ["linear"], ["get", "weight"], 1, 9, 15, 22],
    ],
    "circle-color": [
      "step", ["get", "priority"],
      "#4ade80",
      4,  "#fbbf24",
      6,  "#f97316",
      8,  "#dc2626",
    ],
    "circle-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 13.5, 0.9],
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "rgba(255,255,255,0.65)",
  },
};

export default function HeatmapLayer({ points }) {
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: points.map(({ lat, lng, weight, id, priority }) => ({
        type: "Feature",
        properties: { weight, id, priority: priority ?? 5 },
        geometry: { type: "Point", coordinates: [lng, lat] },
      })),
    }),
    [points],
  );

  if (!points.length) return null;

  return (
    <Source id="incidents-heat" type="geojson" data={geojson}>
      <Layer {...heatmapLayerStyle} />
      <Layer {...circleLayerStyle} />
    </Source>
  );
}
