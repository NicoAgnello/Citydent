// Modal con números de emergencia y asistencia de Argentina.
// Cada número es un enlace tel: que permite llamar directamente desde el celular.
// La lista está hardcodeada (no viene del servidor) ya que son números nacionales fijos.
//
// Grupos mostrados:
//   Emergencias → 911 (Policía), 100 (Bomberos), 107 (SAME), 103 (Defensa Civil)
//   Asistencia  → 144 (Violencia de género), 102 (Niñez), 135 (Crisis)
//
// Props:
//   open         → booleano que controla si el modal está abierto
//   onOpenChange → función que recibe true/false al abrir o cerrar
//
// Se usa en AppHeader y en Home.jsx al presionar el botón de sirena (Siren).
import { Phone, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const EMERGENCIAS = [
  { numero: "911", nombre: "Policía / Emergencias", descripcion: "Emergencias generales", color: "bg-red-50 border-red-200 text-red-600" },
  { numero: "100", nombre: "Bomberos",              descripcion: "Incendios y rescates",  color: "bg-orange-50 border-orange-200 text-orange-600" },
  { numero: "107", nombre: "SAME",                  descripcion: "Ambulancias",            color: "bg-blue-50 border-blue-200 text-blue-600" },
  { numero: "103", nombre: "Defensa Civil",          descripcion: "Desastres y catástrofes", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
];

const ASISTENCIA = [
  { numero: "144", nombre: "Violencia de género",        descripcion: "Línea nacional, 24hs",      color: "bg-purple-50 border-purple-200 text-purple-600" },
  { numero: "102", nombre: "Niñez y adolescencia",       descripcion: "Protección de menores",     color: "bg-green-50 border-green-200 text-green-600" },
  { numero: "135", nombre: "Asistencia al suicida",      descripcion: "Centro de crisis, 24hs",    color: "bg-indigo-50 border-indigo-200 text-indigo-600" },
];

function EmergencyCard({ numero, nombre, descripcion, color }) {
  return (
    <a
      href={`tel:${numero}`}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-opacity active:opacity-70 ${color}`}
    >
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-bold text-base leading-tight">{numero}</span>
        <span className="text-[13px] font-semibold leading-snug">{nombre}</span>
        <span className="text-[11px] opacity-70">{descripcion}</span>
      </div>
      <div className="shrink-0 w-9 h-9 rounded-full bg-white/60 flex items-center justify-center">
        <Phone size={16} />
      </div>
    </a>
  );
}

export default function UrgenciasModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden rounded-3xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="bg-brand-dark px-5 pt-5 pb-6 text-left">
          <DialogTitle className="text-white text-lg font-bold">Números de emergencia</DialogTitle>
          <p className="text-white/60 text-xs mt-1">Tocá cualquier número para llamar directamente.</p>
        </DialogHeader>

        <div className="px-5 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <TriangleAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">CityFixer no es una plataforma de emergencias.</span> Esta app está diseñada para reportar incidentes urbanos. Ante una urgencia real, llamá directamente a los números de abajo.
            </p>
          </div>
          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Emergencias</p>
            {EMERGENCIAS.map((e) => <EmergencyCard key={e.numero} {...e} />)}
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Asistencia</p>
            {ASISTENCIA.map((e) => <EmergencyCard key={e.numero} {...e} />)}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
