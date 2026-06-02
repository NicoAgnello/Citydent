import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { reverseGeocode } from "@/lib/geocoding";

const DEFAULT_CENTER = [-32.4097, -63.2435];
const DEFAULT_ZOOM   = 17;

const userIcon = new L.Icon({
  iconUrl:    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
});

const incidentIcon = new L.Icon({
  iconUrl:    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
});

// Mueve la vista del mapa cuando se detecta la ubicación GPS — sin forzar remount
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, DEFAULT_ZOOM);
  }, [position, map]);
  return null;
}

function MarkerSelector({ onSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onSelect(lat, lng);
    },
  });

  return position ? <Marker position={position} icon={incidentIcon} /> : null;
}

export default function MapPicker({ onChange, className = "w-full h-52 rounded-xl z-0" }) {
  const [userLocation, setUserLocation]   = useState(null);
  const [locationFound, setLocationFound] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation([lat, lng]);
        setLocationFound(true);
        try {
          const ubicacion = await reverseGeocode(lat, lng);
          onChange?.(ubicacion);
        } catch {
          console.warn("No se pudo obtener la dirección de la ubicación actual.");
        }
      },
      () => console.warn("No se pudo obtener ubicación, usando Villa María por defecto."),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = async (lat, lng) => {
    try {
      const ubicacion = await reverseGeocode(lat, lng);
      onChange?.(ubicacion);
    } catch {
      console.error("Error obteniendo dirección.");
    }
  };

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className={className}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {userLocation && <FlyToLocation position={userLocation} />}
      {locationFound && <Marker position={userLocation} icon={userIcon} />}
      <MarkerSelector onSelect={handleSelect} />
    </MapContainer>
  );
}
