// Pantalla que se muestra cuando el backend detecta una emergencia en el texto del reporte.
// Le dice a la persona que llame a emergencias y ofrece abrir la lista de teléfonos.
//
// Props:
//   message   → texto que devuelve el backend explicando por qué se detectó la emergencia
//   onDismiss → función sin argumentos, se llama al confirmar y cierra el modal
import { useState } from "react";
import { Siren, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import UrgenciasModal from "@/components/home/UrgenciasModal";

export default function EmergencyScreen({ message, onDismiss }) {
  const [phonesOpen, setPhonesOpen] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <Siren size={30} className="text-red-600" />
      </div>
      <div>
        <p className="text-xl font-bold text-red-600">Esto parece una emergencia</p>
        <p className="mt-1 text-sm text-slate-500">Llamá ahora a los servicios de emergencia.</p>
      </div>
      <p className="max-w-sm rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-slate-700">
        {message}
      </p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <Button
          type="button"
          onClick={() => setPhonesOpen(true)}
          className="h-11 w-full gap-2 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
        >
          <Phone size={16} />
          Ver teléfonos de emergencia
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="h-10 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          Entendido
        </button>
      </div>
      <UrgenciasModal open={phonesOpen} onOpenChange={setPhonesOpen} />
    </div>
  );
}
