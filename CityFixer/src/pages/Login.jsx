// ─── Login ────────────────────────────────────────────────────────────────────
//
// Pantalla de inicio de sesión. Solo accesible si el usuario NO tiene sesión
// activa (PublicRoute en AppRouter la protege). Se monta en la ruta /login.
//
// Layout en dos mitades:
//   - Izquierda (solo desktop): panel de marca con un mapa real de Mapbox
//     (sin interacción) y marcadores de incidentes de ejemplo, que cuenta de qué trata la app.
//   - Derecha: el formulario de Clerk, sin tarjeta, sobre fondo claro.
//   En mobile el panel de marca se reduce a una franja superior con el logo.
//
// Clerk maneja todo el flujo de autenticación: validación, errores, sesión.
// Una vez que el usuario se loguea, Clerk redirige a "/" y App.jsx se encarga
// de sincronizar el usuario con la base de datos antes de mostrar la app.

import { SignIn } from "@clerk/clerk-react";
import Map, { Marker } from "react-map-gl";
import mapboxgl from "mapbox-gl";
import { MapPin, CheckCircle2 } from "lucide-react";

// Marcadores sobre el mapa real (mismo centro que el resto de la app).
// "resolved" usa el verde de la app; "open" usa el lila de marca.
const MAP_VIEW = { longitude: -63.2435, latitude: -32.4097, zoom: 14.6 };
const PINS = [
  { lng: -63.2475, lat: -32.4037, kind: "open", label: "Bache en Av. Mitre" },
  { lng: -63.2445, lat: -32.4062, kind: "resolved", label: "Luminaria reparada" },
  { lng: -63.2485, lat: -32.4092, kind: "open", label: "Pérdida de agua" },
  { lng: -63.2455, lat: -32.4115, kind: "resolved", label: "Árbol retirado" },
];

const WEBGL_OK = mapboxgl.supported();

function IncidentPin({ kind, label }) {
  const open = kind === "open";
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3.5 w-3.5">
        {open && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-60 motion-reduce:animate-none" />
        )}
        <span
          className={`relative inline-flex h-3.5 w-3.5 rounded-full ring-4 ${
            open
              ? "bg-brand-light ring-brand-light/30"
              : "bg-emerald-400 ring-emerald-400/30"
          }`}
        />
      </span>
      <span className="whitespace-nowrap rounded-full border border-white/15 bg-[#1a0f2e]/80 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1a0f2e] p-12 text-white">
      {/* Mapa real, solo de fondo: sin interacción ni controles.
          Mapbox necesita WebGL; si el navegador no lo soporta (por ejemplo
          con la aceleración por hardware desactivada) se muestra un fondo
          de marca en su lugar en vez de un panel roto. */}
      {WEBGL_OK ? (
        <div className="absolute inset-0">
          <Map
            initialViewState={MAP_VIEW}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: "100%", height: "100%" }}
            interactive={false}
            attributionControl={false}
          >
            {PINS.map((pin) => (
              <Marker key={pin.label} longitude={pin.lng} latitude={pin.lat} anchor="left">
                <IncidentPin kind={pin.kind} label={pin.label} />
              </Marker>
            ))}
          </Map>
        </div>
      ) : (
        <>
          <div aria-hidden="true" className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand/50 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-48 -right-24 h-[26rem] w-[26rem] rounded-full bg-brand-mid/30 blur-3xl" />
        </>
      )}

      {/* Tinte de marca y degradados para que el texto se lea sobre el mapa */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand/25 mix-blend-color" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#1a0f2e] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#1a0f2e] via-[#1a0f2e]/80 to-transparent" />

      <div className="relative z-10 flex items-center gap-3">
        <img src="/logoCityFixer.svg" alt="" className="h-10 w-auto" />
        <span className="text-xl font-semibold tracking-tight">CityFixer</span>
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
          Si lo ves en tu barrio, reportalo.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-brand-light/70">
          Sacá una foto, marcá el lugar y seguí el reclamo hasta que se resuelva.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-brand-light/80">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Recibís una notificación en cada cambio de estado
        </div>
      </div>
    </aside>
  );
}

function Login() {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#f5f6ff] to-white px-5 py-10 lg:min-h-0 lg:from-white">
        {/* Logo compacto, solo mobile (en desktop vive en el panel de marca) */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <img src="/logoCityFixer.svg" alt="" className="h-10 w-auto" />
          <span className="text-2xl font-semibold tracking-tight text-brand-dark">
            CityFixer
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 text-brand">
            <MapPin className="h-5 w-5" />
            <span className="text-sm font-medium">Reclamos urbanos</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1a0f2e]">
            Ingresá a tu cuenta
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Para reportar y seguir los incidentes de tu ciudad.
          </p>

          <div className="mt-8">
            {/* appearance deja a Clerk sin tarjeta propia ni encabezado: el
                título y el texto de arriba los controla esta pantalla. */}
            <SignIn
              routing="path"
              path="/login"
              fallbackRedirectUrl="/"
              appearance={{
                variables: {
                  colorPrimary: "#5C3F99",
                  colorBackground: "transparent",
                  colorText: "#1a0f2e",
                  colorTextSecondary: "#6b7280",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#1a0f2e",
                  borderRadius: "0.75rem",
                  fontFamily: "Geist Variable, sans-serif",
                },
                elements: {
                  rootBox: "!w-full !max-w-none",
                  cardBox: "!w-full !shadow-none !border-0 !bg-transparent !rounded-none",
                  card: "!w-full !bg-transparent !p-0 !shadow-none !border-0 !rounded-none gap-6",
                  header: { display: "none" },
                  socialButtonsBlockButton:
                    "h-11 border border-gray-200 bg-white hover:bg-[#f5f6ff] hover:border-brand-light transition-colors font-medium",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-400",
                  formFieldInput:
                    "h-11 border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand-light",
                  formButtonPrimary:
                    "h-11 bg-brand hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25 normal-case text-sm font-medium",
                  footer: "!bg-transparent !bg-none !p-0 !mt-4",
                  footerAction: "!bg-transparent",
                  footerActionLink:
                    "text-brand font-semibold hover:text-brand-dark",
                  footerPages: { display: "none" },
                },
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
