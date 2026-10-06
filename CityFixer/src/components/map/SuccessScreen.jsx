// Pantalla de confirmación que se muestra al terminar de enviar un incidente correctamente.
// El modal no se cierra solo: la persona elige qué hacer a continuación.
//
// Props:
//   onViewReports → (opcional) función sin argumentos. Si viene, el botón principal es
//                   "Ver mis reportes"; si no (ej. el admin), es "Cerrar".
//   onClose       → función sin argumentos, cierra el modal
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessScreen({ onViewReports, onClose }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <Check size={32} strokeWidth={2.5} className="text-emerald-500 motion-safe:animate-[pop_0.4s_ease-out]" />
      </div>
      <p className="text-xl font-bold text-slate-900">Reporte enviado</p>
      <p className="max-w-xs text-sm text-slate-500">
        Lo recibimos. Vas a ver cómo avanza y te avisamos cada vez que cambie de estado.
      </p>
      <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <Button
          type="button"
          onClick={onViewReports ?? onClose}
          className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-brand-mid"
        >
          {onViewReports ? "Ver mis reportes" : "Cerrar"}
        </Button>
        {onViewReports && (
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
