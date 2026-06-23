// ─── Login ────────────────────────────────────────────────────────────────────
//
// Pantalla de inicio de sesión. Solo accesible si el usuario NO tiene sesión
// activa (PublicRoute en AppRouter la protege). Se monta en la ruta /login.
//
// Qué muestra:
//   - Fondo oscuro con animación de partículas (tsparticles)
//   - Logo y nombre de la app
//   - Formulario de login de Clerk (maneja email, contraseña, OAuth, etc.)
//
// Clerk maneja todo el flujo de autenticación: validación, errores, sesión.
// Una vez que el usuario se loguea, Clerk redirige a "/" y App.jsx se encarga
// de sincronizar el usuario con la base de datos antes de mostrar la app.
//
// Por qué <SignIn> está fuera de <ParticlesProvider>:
//   ParticlesProvider inicializa el motor de partículas de forma asíncrona.
//   Si Clerk estuviera dentro de ese árbol, su propio proceso de init podría
//   interferir. Tenerlos como hermanos los mantiene independientes.

import { SignIn } from "@clerk/clerk-react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Configuración de las partículas del fondo animado.
// Los colores usan hex directamente porque tsparticles no puede leer
// variables CSS de Tailwind (brand-light, brand-mid) en tiempo de ejecución.
const PARTICLE_OPTIONS = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ["#D3D6FF", "#6B4FA8", "#ffffff"] },
    opacity: { value: { min: 0.1, max: 0.4 } },
    size: { value: { min: 1, max: 3 } },
    move: {
      enable: true,
      speed: 0.5,
      random: true,
      outModes: { default: "bounce" },
    },
    links: {
      enable: true,
      distance: 130,
      color: "#6B4FA8",
      opacity: 0.2,
      width: 1,
    },
  },
  detectRetina: true,
};

// Definido fuera del componente para que la referencia sea estable.
// ParticlesProvider v4 exige que la función init no cambie entre renders,
// de lo contrario reinicializa el motor innecesariamente.
async function initEngine(engine) {
  await loadSlim(engine);
}

function Login() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-5 bg-[#1a0f2e] overflow-hidden">

      {/* Partículas aisladas — su ciclo de init no afecta a SignIn */}
      <ParticlesProvider init={initEngine}>
        <Particles
          id="tsparticles"
          className="absolute inset-0 w-full h-full"
          options={PARTICLE_OPTIONS}
        />
      </ParticlesProvider>

      {/* SignIn fuera del árbol de ParticlesProvider */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="mb-7 text-center flex flex-col items-center gap-2">
          <img src="/logoCityFixer.svg" alt="CityFixer" className="h-20 w-auto" />
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-brand-light/60 bg-clip-text text-transparent">
            CityFixer
          </h1>
          <p className="text-brand-light/50 text-sm tracking-wide">Ingresá a tu cuenta para continuar</p>
        </div>

        <div className="w-full rounded-3xl overflow-hidden shadow-2xl">
          {/* appearance personaliza los colores y tipografía del formulario de Clerk
              para que coincida con el diseño de la app. */}
          <SignIn
            routing="path"
            path="/login"
            fallbackRedirectUrl="/"
            appearance={{
              variables: {
                colorPrimary: "#292D60",
                colorBackground: "#ffffff",
                colorText: "#1a1a2e",
                colorTextSecondary: "#6b7280",
                colorInputBackground: "#f5f6ff",
                colorInputText: "#1a1a2e",
                borderRadius: "0px",
                fontFamily: "Geist Variable, sans-serif",
              },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 w-full rounded-none",
                header: { display: "none" },
                socialButtonsBlockButton:
                  "border border-gray-200 hover:bg-[#f5f6ff] transition-colors font-medium",
                formButtonPrimary:
                  "bg-brand-dark hover:bg-brand-mid transition-colors shadow-md",
                footerActionLink:
                  "text-brand-dark font-semibold hover:text-brand-mid",
                footerPages: { display: "none" },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Login;
