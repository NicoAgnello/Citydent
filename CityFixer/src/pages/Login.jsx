import { SignIn } from "@clerk/clerk-react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

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

// Definido fuera del componente para que sea estable (requisito de ParticlesProvider v4)
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
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-blanquito/60 bg-clip-text text-transparent">
            CityFixer
          </h1>
          <p className="text-blanquito/50 text-sm tracking-wide">Ingresá a tu cuenta para continuar</p>
        </div>

        <div className="w-full rounded-3xl overflow-hidden shadow-2xl">
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
                  "bg-azul-oscuro hover:bg-celestito transition-colors shadow-md",
                footerActionLink:
                  "text-azul-oscuro font-semibold hover:text-celestito",
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
