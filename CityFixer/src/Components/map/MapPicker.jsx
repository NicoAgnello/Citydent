import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER = [-32.4097, -63.2435];
const DEFAULT_ZOOM = 17;

// Marker azul para ubicación del usuario
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Marker rojo para el incidente
const incidentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [locationFound, setLocationFound] = useState(false);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setLocationFound(true);
        handleSelect(lat, lng); // 👈 esto es lo nuevo
      },
      () => {
        console.warn(
          "No se pudo obtener ubicación, usando Villa María por defecto",
        );
      },
    );
  }, []);

  async function handleSelect(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "es" } },
      );
      const data = await res.json();
      const address = data.address;

      const ubicacion = {
        lat,
        lng,
        calle: address.road || "",
        numero: address.house_number || "S/N",
        barrio: address.suburb || address.neighbourhood || "",
        ciudad: address.city || address.town || address.village || "",
        provincia: address.state || "",
        codigoPostal: address.postcode || "",
        displayName: data.display_name || "",
      };

      onChange?.(ubicacion);
    } catch (error) {
      console.error("Error obteniendo dirección:", error);
    }
  }

  return (
    <MapContainer
      key={userLocation.toString()}
      center={userLocation}
      zoom={DEFAULT_ZOOM}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locationFound && <Marker position={userLocation} icon={userIcon} />}
      <MarkerSelector onSelect={handleSelect} />
    </MapContainer>
  );
}
