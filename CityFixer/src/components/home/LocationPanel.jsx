// Panel de ubicación de un incidente. Combina el mapa estático (MapView)
// con la dirección en texto y las coordenadas exactas debajo.
// Si no hay lat/lng, el mapa no se renderiza (MapView devuelve null).
//
// Props:
//   location      → objeto { lat, lng, address } del incidente
//   mapClassName  → clase CSS del contenedor del mapa (tamaño por defecto: h-44)
//
// Se usa en IncidentDetailSheet (vista del usuario) y en AdminIncidentDetailSheet (vista admin).
import MapView from "@/components/map/MapView";

export default function LocationPanel({ location, mapClassName = "w-full h-44 rounded-2xl z-0" }) {
  return (
    <div className="flex flex-col gap-2">
      <MapView lat={location?.lat} lng={location?.lng} interactive className={mapClassName} />
      <p className="text-sm text-gray-700 font-medium">
        {location?.address || "Dirección no disponible"}
      </p>
      {location?.lat && (
        <p className="text-xs text-gray-400">
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
