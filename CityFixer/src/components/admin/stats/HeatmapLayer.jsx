import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const HEAT_OPTIONS = {
  radius: 30,
  blur: 15,
  maxZoom: 18,
  minOpacity: 0.45,
  max: 1.0,
  gradient: {
    0.15: "#a78bfa",  // violet-400 — lila suave, visible sobre fondo claro
    0.40: "#7c3aed",  // violet-600 — púrpura medio
    0.60: "#5C3F99",  // brand primary — zona de atención
    0.80: "#f97316",  // orange-500  — zona de alerta
    1.00: "#dc2626",  // red-600     — zona crítica
  },
};

export default function HeatmapLayer({ points }) {
  const map      = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!points.length) return;

    layerRef.current = L.heatLayer(points, HEAT_OPTIONS).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}
