// ─── Login ────────────────────────────────────────────────────────────────────
//
// Pantalla de inicio de sesión. Solo accesible si el usuario NO tiene sesión
// activa (PublicRoute en AppRouter la protege). Se monta en la ruta /login.
//
// Layout en dos mitades:
//   - Izquierda (solo desktop): panel de marca con un mapa de calles abstracto
//     y marcadores de incidentes, que cuenta de qué trata la app.
//   - Derecha: el formulario de Clerk, sin tarjeta, sobre fondo claro.
//   En mobile el panel de marca se reduce a una franja superior con el logo.
//
// Clerk maneja todo el flujo de autenticación: validación, errores, sesión.
// Una vez que el usuario se loguea, Clerk redirige a "/" y App.jsx se encarga
// de sincronizar el usuario con la base de datos antes de mostrar la app.

import { SignIn } from "@clerk/clerk-react";
import { MapPin, CheckCircle2 } from "lucide-react";

// Marcadores del mapa decorativo: posición en % dentro del panel y estado.
// "resolved" usa el verde de la app; "open" usa el lila de marca.
const PINS = [
  { x: 22, y: 30, kind: "open", label: "Bache en Av. Mitre" },
  { x: 68, y: 22, kind: "resolved", label: "Luminaria reparada" },
  { x: 48, y: 58, kind: "open", label: "Pérdida de agua" },
  { x: 80, y: 70, kind: "resolved", label: "Árbol retirado" },
];

function CityMap() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <g fill="none" stroke="#D3D6FF" strokeLinecap="round">
        {/* Avenidas principales */}
        <g strokeOpacity="0.22" strokeWidth="5">
          <path d="M-20 120 L180 150 L420 90" />
          <path d="M90 -20 L130 200 L100 420" />
          <path d="M-20 300 L220 260 L420 330" />
          <path d="M300 -20 L270 180 L320 420" />
        </g>
        {/* Calles secundarias */}
        <g strokeOpacity="0.1" strokeWidth="2">
          <path d="M-20 40 L420 20" />
          <path d="M-20 210 L420 200" />
          <path d="M-20 370 L420 390" />
          <path d="M20 -20 L10 420" />
          <path d="M200 -20 L190 420" />
          <path d="M380 -20 L390 420" />
          <path d="M130 200 L220 260" />
          <path d="M180 150 L270 180" />
        </g>
      </g>
    </svg>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1a0f2e] p-12 text-white">
      {/* Resplandor de marca detrás del mapa */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -right-24 h-[26rem] w-[26rem] rounded-full bg-brand-mid/30 blur-3xl"
      />
      <CityMap />

      {/* Marcadores */}
      {PINS.map((pin) => (
        <div
          key={pin.label}
          className="absolute flex items-center gap-2"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <span className="relative flex h-3 w-3">
            {pin.kind === "open" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-60 motion-reduce:animate-none" />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ring-4 ${
                pin.kind === "open"
                  ? "bg-brand-light ring-brand-light/20"
                  : "bg-emerald-400 ring-emerald-400/20"
              }`}
            />
          </span>
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
            {pin.label}
          </span>
        </div>
      ))}

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
