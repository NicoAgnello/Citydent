// Bloque de contacto de soporte de CityFixer (email, teléfono, WhatsApp).
// Es estático — los datos están hardcodeados, no vienen del servidor.
// Cada opción es un enlace (mailto:, tel:, wa.me) que el navegador maneja nativamente.
// También muestra el horario de atención.
//
// No tiene props. Se usa en AppHeader (dentro del menú desplegable) y en PerfilTab.
import { Mail, Phone, MessageCircle, Clock } from "lucide-react";

const CONTACTS = [
  { href: "mailto:soporte@cityfixer.com", icon: Mail,          label: "Email",    value: "soporte@cityfixer.com",  hover: "group-hover:text-primary" },
  { href: "tel:+5493515551234",           icon: Phone,         label: "Teléfono", value: "+54 9 351 555-1234",     hover: "group-hover:text-primary" },
  { href: "https://wa.me/5493515555678",  icon: MessageCircle, label: "WhatsApp", value: "+54 9 351 555-5678",     hover: "group-hover:text-emerald-600" },
];

export default function SupportInfo() {
  return (
    <>
      <div className="divide-y divide-slate-50">
        {CONTACTS.map(({ href, icon: Icon, label, value, hover }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 shrink-0 group-hover:bg-primary/10 transition-colors">
              <Icon size={13} className={`text-slate-500 transition-colors ${hover}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-xs font-medium text-slate-700 transition-colors ${hover}`}>{value}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="mx-5 my-3 flex items-start gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
        <Clock size={13} className="text-slate-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Horario de atención</p>
          <p className="text-xs text-slate-600 font-medium">Lunes a Viernes</p>
          <p className="text-xs text-slate-500">08:00 a 18:00 hs</p>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">© 2026 CityFixer</span>
        <span className="text-[10px] text-slate-400">Versión 1.0.0</span>
      </div>
    </>
  );
}
