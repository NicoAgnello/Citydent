import Map, { Marker } from "react-map-gl";

function PinIcon({ color }) {
  return (
    <svg width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill={color} />
      <circle cx="12" cy="12" r="4.5" fill="white" />
    </svg>
  );
}

export default function MapView({ lat, lng, className = "w-full h-48 rounded-2xl z-0", interactive = true }) {
  if (!lat || !lng) return null;

  return (
    <div className={className} style={{ overflow: "hidden", pointerEvents: interactive ? "auto" : "none" }}>
      <Map

        initialViewState={{ longitude: lng, latitude: lat, zoom: 16 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        dragRotate={false}
        attributionControl={false}
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <PinIcon color="#ef4444" />
        </Marker>
      </Map>
    </div>
  );
}
