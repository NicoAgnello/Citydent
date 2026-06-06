import { useMemo } from "react";
import { Source, Layer } from "react-map-gl";

const heatmapLayerStyle = {
  id: "incidents-heat",
  type: "heatmap",
  paint: {
    "heatmap-weight": 1,
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
    "heatmap-opacity": 0.85,
  },
};

export default function HeatmapLayer({ points }) {
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: points.map(([lat, lng]) => ({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: [lng, lat] },
      })),
    }),
    [points],
  );

  if (!points.length) return null;

  return (
    <Source id="incidents-heat" type="geojson" data={geojson}>
      <Layer {...heatmapLayerStyle} />
    </Source>
  );
}
