import { useState } from "react";
import {
  Home as HomeIcon, FileText, User, MapPinned, Plus, MapPin,
} from "lucide-react";

// Slides "estándar": ícono + título + texto
const SLIDES = [
  {
    type: "intro",
    icon: MapPinned,
    title: "¡Bienvenido a CityFixer!",
    text: "Reportá baches, luminarias rotas, basurales y otros problemas que ves en tu ciudad, y ayudanos a que se resuelvan más rápido.",
  },
  {
    type: "icon",
    icon: HomeIcon,
    title: "Inicio",
    text: "Acá vas a ver tus incidentes reportados en la ciudad, con un resumen de tu actividad reciente.",
  },
  {
    type: "icon",
    icon: FileText,
    title: "Mis Reportes",
    text: "Hacé seguimiento de todo lo que reportaste: estado, fecha y detalles de cada incidente.",
  },
  {
    type: "icon",
    icon: User,
    title: "Perfil",
    text: "Desde acá podés ver y editar tus datos personales cuando lo necesites.",
  },
  {
    type: "component",
    title: "Cargar un incidente",
    text: "Tocá este botón para reportar un incidente nuevo. Lo vas a encontrar siempre a mano en la pantalla de Inicio.",
  },
];

// Preview no interactivo de la CTA card real de InicioTab
function CtaCardPreview() {
  return (
    <div className="w-full rounded-2xl bg-primary px-5 py-5 flex flex-col gap-3.5 pointer-events-none select-none">
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        <MapPin size={18} className="text-white" />
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-snug">¿Ves algo en tu ciudad?</p>
        <p className="text-white/65 text-xs mt-1">Reportalo y ayudá a que se resuelva más rápido.</p>
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-primary text-xs font-bold"
      >
        <Plus size={14} />
        Cargar Incidente
      </button>
    </div>
  );
}

export default function TutorialScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen bg-azul-oscuro flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Branding, igual que ProfileSetupScreen */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-blanquito w-1.5 h-8 rounded-full inline-block" />
            <h1 className="text-white text-2xl font-bold tracking-tight">CityFixer</h1>
          </div>
          <p className="text-white/50 text-xs text-center">Tu ciudad, tu voz</p>
        </div>

        <div className="bg-white rounded-3xl p-6 flex flex-col gap-6 shadow-xl">

          {/* Indicador de pasos */}
          <div className="flex items-center justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Slide activo */}
          <div key={step} className="flex flex-col items-center text-center gap-4 animate-in fade-in duration-300">

            {slide.type === "component" ? (
              <CtaCardPreview />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon size={28} className="text-primary" strokeWidth={1.75} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <h2 className="text-azul-oscuro font-bold text-lg">{slide.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{slide.text}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2.5">
            {!isFirst && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center justify-center px-4 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors shrink-0"
              >
                Volver
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-2xl bg-azul-oscuro text-white text-sm font-semibold hover:bg-azul transition-colors"
            >
              {isLast ? "¡Empezar!" : "Siguiente"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}