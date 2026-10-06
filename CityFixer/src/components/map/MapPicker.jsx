// Mapa interactivo para que el usuario elija la ubicación de un incidente.
// Al hacer clic en el mapa, coloca un pin y llama a reverseGeocode (Nominatim/OSM)
// para convertir las coordenadas en una dirección de texto legible.
// El centro por defecto es Villa María, Córdoba.
//
// Props:
//   onChange → función que recibe { lat, lng, address } cuando el usuario elige un punto
//
// Se usa dentro de IncidentForm (paso de ubicación del formulario de reporte).
import { useState, useEffect, useCallback } from "react";
import { LocateFixed, MapPinOff } from "lucide-react";
import mapboxgl from "mapbox-gl";
import Map, { Marker, NavigationControl } from "react-map-gl";
import { reverseGeocode } from "@/lib/geocoding";
import { useDark } from "@/lib/theme";

// Mapbox necesita WebGL. Si el navegador no lo soporta (aceleración por hardware
// desactivada, protecciones de privacidad, etc.) se muestra un aviso en vez de un
// recuadro vacío; "Usar mi ubicación" sigue funcionando porque no depende del mapa.
const WEBGL_OK = mapboxgl.supported();

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
  const dark = useDark();
  const [viewState, setViewState]           = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation]     = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Pide la posición del dispositivo, centra el mapa ahí y deja el pin rojo en ese punto.
  // Se llama sola al abrir el mapa y también desde el botón "Usar mi ubicación".
  const locateMe = useCallback(() => {
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
  }, [onChange]);

  useEffect(() => {
    locateMe();
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
    <div className={`${className} relative`} style={{ overflow: "hidden" }}>
      <button
        type="button"
        onClick={locateMe}
        className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md transition-colors hover:bg-slate-50"
      >
        <LocateFixed size={14} className="text-primary" />
        Usar mi ubicación
      </button>
      {!WEBGL_OK && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 px-8 text-center">
          <MapPinOff size={28} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-700">Tu navegador no puede mostrar el mapa</p>
          <p className="text-xs text-slate-500">
            Tocá &ldquo;Usar mi ubicación&rdquo; para marcar donde estás, o probá con otro navegador (por ejemplo Safari o Chrome).
          </p>
        </div>
      )}
      {WEBGL_OK && (
      <Map

        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleClick}
        mapStyle={dark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
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
      )}
    </div>
  );
}
