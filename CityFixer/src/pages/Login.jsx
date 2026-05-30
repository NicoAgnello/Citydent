import { SignIn } from "@clerk/clerk-react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const PARTICLE_OPTIONS = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ["#D3D6FF", "#3B418F", "#ffffff"] },
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
      color: "#3B418F",
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

function LoginContent() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-5 bg-[#181b3a] overflow-hidden">
      <Particles
        id="tsparticles"
        className="absolute inset-0 w-full h-full"
        options={PARTICLE_OPTIONS}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="mb-7 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-4xl mx-auto mb-4">
            🏙️
          </div>
          <h1 className="text-white text-3xl font-bold tracking-tight">CityFixer</h1>
          <p className="text-blanquito/70 text-sm mt-1.5">Ingresá a tu cuenta para continuar</p>
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

function Login() {
  return (
    <ParticlesProvider init={initEngine}>
      <LoginContent />
    </ParticlesProvider>
  );
}

export default Login;
