import { useState, useEffect, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import { reverseGeocode } from "@/lib/geocoding";

const DEFAULT_CENTER = { longitude: -63.2435, latitude: -32.4097, zoom: 17 };

function PinIcon({ color }) {
  return (
    <svg width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24S24 21 24 12C24 5.4 18.6 0 12 0z" fill={color} />
      <circle cx="12" cy="12" r="4.5" fill="white" />
    </svg>
  );
}

export default function MapPicker({ onChange, className = "w-full h-52 rounded-xl z-0" }) {
  const [viewState, setViewState]           = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation]     = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ latitude: lat, longitude: lng });
        setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        try {
          const ubicacion = await reverseGeocode(lat, lng);
          onChange?.(ubicacion);
          setSelectedLocation({ latitude: lat, longitude: lng });
        } catch {
          console.warn("No se pudo obtener la dirección de la ubicación actual.");
        }
      },
      () => console.warn("No se pudo obtener ubicación, usando Villa María por defecto."),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = useCallback(
    async (e) => {
      const { lat, lng } = e.lngLat;
      setSelectedLocation({ latitude: lat, longitude: lng });
      try {
        const ubicacion = await reverseGeocode(lat, lng);
        onChange?.(ubicacion);
      } catch {
        console.error("Error obteniendo dirección.");
      }
    },
    [onChange],
  );

  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <Map

        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
        dragRotate={false}
        attributionControl={false}
        cursor="crosshair"
      >
        <NavigationControl position="top-right" showCompass={false} />

        {userLocation && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="bottom">
            <PinIcon color="#3b82f6" />
          </Marker>
        )}

        {selectedLocation && (
          <Marker longitude={selectedLocation.longitude} latitude={selectedLocation.latitude} anchor="bottom">
            <PinIcon color="#ef4444" />
          </Marker>
        )}
      </Map>
    </div>
  );
}
