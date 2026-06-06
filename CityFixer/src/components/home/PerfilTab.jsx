import { useUser } from "@clerk/clerk-react";
import { Mail, Phone, MessageCircle, Clock } from "lucide-react";
import { STATUS_KEYS } from "@/lib/incidents";

export default function PerfilTab({ incidents, loading }) {
  const { user } = useUser();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long" })
    : null;

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean).map((n) => n[0].toUpperCase()).join("").slice(0, 2) || "?";

  const stats = [
    { label: "Reportados", value: incidents.length },
    { label: "Resueltos",  value: incidents.filter((i) => i.status?.name === STATUS_KEYS.RESOLVED).length },
    { label: "En proceso", value: incidents.filter((i) => i.status?.name === STATUS_KEYS.IN_PROCESS).length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3">

        {/* ── Columna izquierda: Perfil ── */}
        <div className="bg-slate-50/70 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100">

          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="avatar"
              className="h-24 w-24 rounded-full border-2 border-white shadow-sm object-cover mb-4"
            />
          ) : (
            <div className="h-24 w-24 rounded-full border-2 border-white shadow-sm bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
          )}

          <h2 className="font-bold text-slate-900 text-lg leading-tight">
            {user?.fullName ?? "Ciudadano"}
          </h2>

          {joinedDate && (
            <p className="text-xs text-slate-400 mt-2">
              Desde {joinedDate}
            </p>
          )}
        </div>

        {/* ── Columna derecha: Datos y Métricas ── */}
        <div className="md:col-span-2 p-6 flex flex-col justify-between">

          {/* Datos de la cuenta */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Datos de la cuenta
            </p>
            <p className="mt-2 bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-sm border border-slate-100 w-full">
              {user?.primaryEmailAddress?.emailAddress ?? "—"}
            </p>
          </div>

          {/* Actividad */}
          <div className="border-t border-slate-100 pt-4 mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Actividad
            </p>

            {loading ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-2 py-1">
                    <div className="h-7 w-8 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="h-2.5 w-14 rounded-full bg-slate-100 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    {/* ── Ayuda y soporte ── */}
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mt-4">

      <div className="px-5 py-3.5 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Ayuda y soporte
        </p>
      </div>

      <div className="divide-y divide-slate-50">

        <a href="mailto:soporte@cityfixer.com" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
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

        <a href="tel:+5493515551234" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
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

        <a href="https://wa.me/5493515555678" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group">
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

      <div className="mx-5 my-3 flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
        <Clock size={13} className="text-slate-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Horario de atención
          </p>
          <p className="text-xs text-slate-600 font-medium">Lunes a Viernes</p>
          <p className="text-xs text-slate-500">08:00 a 18:00 hs</p>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">© 2026 CityFixer</span>
        <span className="text-[10px] text-slate-400">Versión 1.0.0</span>
      </div>

    </div>

    </div>
  );
}
