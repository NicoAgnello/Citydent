// Sidebar de navegación del panel admin (visible en desktop).
// Muestra las secciones: Incidentes, Estadísticas, Categorías y Usuarios.
// Las dos últimas solo se muestran si el rol es "superAdmin" (se ocultan para admin común).
// También tiene un botón de "Soporte" que abre un Dialog con los datos de contacto,
// y un botón de "Cerrar sesión" conectado a Clerk.
//
// Props:
//   activeTab   → tab actualmente seleccionado
//   onTabChange → función que recibe el id del tab al hacer clic en una sección
//   dbRole      → rol del usuario desde la base de datos ("admin" | "superAdmin")
//   onClose     → función sin argumentos, cierra el sidebar en mobile (Sheet mode)
//
// Se usa en AdminDashboard.jsx — en desktop como sidebar fijo, en mobile dentro de un Sheet.
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { LayoutList, BarChart2, Tag, Users, LogOut, HelpCircle, Mail, Phone, MessageCircle, Clock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const NAV_ITEMS = [
  { id: "incidentes",   label: "Incidentes",   icon: LayoutList },
  { id: "estadisticas", label: "Estadísticas",  icon: BarChart2  },
  { id: "categorias",   label: "Categorías",    icon: Tag,        superAdminOnly: true },
  { id: "usuarios",     label: "Usuarios",      icon: Users,      superAdminOnly: true },
];

export default function AdminSidebar({ activeTab, onTabChange, dbRole, onClose }) {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(item => !item.superAdminOnly || dbRole === "superAdmin");

  return (
    <aside className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">

      {/* Logo */}
      <div className="flex items-center gap-3 pt-7 px-6 pb-6 border-b border-sidebar-border shrink-0">
        <img src="/logoCityFixer.svg" alt="CityFixer" className="h-10 w-10 object-contain shrink-0" />
        <span className="text-xl font-bold tracking-tight text-white">CityFixer</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { onTabChange(id); onClose?.(); }}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-sidebar-primary" />
              )}
              <Icon size={17} className="shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5 shrink-0">
        <Dialog>
          <DialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150">
              <HelpCircle size={17} className="shrink-0" />
              Ayuda y soporte
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-xs p-0 overflow-hidden">

            {/* Cabecera del modal */}
            <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                  <HelpCircle size={16} className="text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-semibold text-slate-900">
                    Ayuda y soporte
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-0.5">CityFixer — Panel Administrativo</p>
                </div>
              </div>
            </DialogHeader>

            {/* Canales de contacto */}
            <div className="px-5 py-4 space-y-3">
              <a
                href="mailto:soporte@cityfixer.com"
                className="flex items-center gap-3 group"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Mail size={13} className="text-slate-500 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-xs font-medium text-slate-700 group-hover:text-primary transition-colors">
                    soporte@cityfixer.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+5493515551234"
                className="flex items-center gap-3 group"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Phone size={13} className="text-slate-500 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Teléfono</p>
                  <p className="text-xs font-medium text-slate-700 group-hover:text-primary transition-colors">
                    +54 9 351 555-1234
                  </p>
                </div>
              </a>

              <a
                href="https://wa.me/5493515555678"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 group"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 shrink-0 group-hover:bg-emerald-50 transition-colors">
                  <MessageCircle size={13} className="text-slate-500 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">WhatsApp</p>
                  <p className="text-xs font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">
                    +54 9 351 555-5678
                  </p>
                </div>
              </a>
            </div>

            {/* Horario */}
            <div className="mx-5 mb-4 flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
              <Clock size={13} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                  Horario de atención
                </p>
                <p className="text-xs text-slate-600 font-medium">Lunes a Viernes</p>
                <p className="text-xs text-slate-500">08:00 a 18:00 hs</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">© 2026 CityFixer</span>
              <span className="text-[10px] text-slate-400">Versión 1.0.0</span>
            </div>

          </DialogContent>
        </Dialog>
        <button
          onClick={() => signOut(() => navigate("/login"))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-red-400 transition-all duration-150"
        >
          <LogOut size={17} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
