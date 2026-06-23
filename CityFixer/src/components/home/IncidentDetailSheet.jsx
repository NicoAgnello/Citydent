// Panel deslizante (Sheet) con el detalle completo de un incidente del usuario.
// Se abre al hacer clic en un IncidentCard o IncidentGridCard.
//
// Contenido mostrado:
//   - Badge de estado y título
//   - Opción de cancelar (si el estado es "pendiente" o "aceptado")
//   - Galería de fotos/videos (PhotoGallery)
//   - Mapa de ubicación (LocationPanel)
//   - Historial de cambios de estado (StatusHistory, componente de /admin reutilizado)
//   - Insights de IA sobre el incidente (AIInsights, componente de /admin reutilizado)
//
// Props:
//   incident  → objeto de incidente completo
//   open      → booleano que controla si el panel está abierto
//   onClose   → función sin argumentos, cierra el panel
//   onUpdated → función sin argumentos, recarga la lista padre tras cancelar
//
// Se usa en IncidentCard e IncidentGridCard.
import { X, Loader2, User, AlertTriangle, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { cancelIncident } from "@/services/api";
import { useNotificationContext } from "@/context/NotificationContext";
import StatusHistory from "@/components/admin/incidents/StatusHistory";
import AIInsights from "@/components/admin/incidents/AIInsights";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { STATUS_LABELS, STATUS_BADGE, capitalize } from "@/lib/incidents";
import PhotoGallery from "./PhotoGallery";
import LocationPanel from "./LocationPanel";

const CANCELABLE_STATUSES = ["pendiente", "aceptado"];


export default function IncidentDetailSheet({
  incident,
  open,
  onOpenChange,
  actions,
  isAdmin,
  onUpdated,
}) {
  const [cancelling, setCancelling]   = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const notiCtx = useNotificationContext();

  // Marcar notificaciones como leídas cuando el sheet se abre (solo ciudadano)
  useEffect(() => {
    if (!isAdmin && open && incident?._id && notiCtx) {
      notiCtx.markByIncident(incident._id);
    }
  }, [open, incident?._id, isAdmin]);

  if (!incident) return null;

  const statusKey = incident.status?.name;
  const canCancel = !isAdmin && CANCELABLE_STATUSES.includes(statusKey);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelIncident(incident._id);
      onUpdated?.();
      onOpenChange(false);
    } catch (err) {
      setCancelError(err.response?.data?.error ?? "No se pudo cancelar el reporte.");
      setCancelling(false);
    }
  };

  const label     = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const statusCls = STATUS_BADGE[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";

  // En contexto admin, `incident` es un grupo — los datos de display viven en representativeId
  const display = isAdmin ? (incident.representativeId ?? {}) : incident;
  const location = display.location;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-xl lg:max-w-2xl p-0 flex flex-col bg-white [&::-webkit-scrollbar]:hidden"
      >

        {/* ── Header ── */}
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-lg font-bold text-slate-900 leading-snug flex-1">
              {display.title}
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar"
            >
              <X size={17} />
            </button>
          </div>

          {/* Metadata compacta */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>
              {label}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {capitalize(incident.category?.name)}
            </span>
            <span className="text-xs text-slate-400">{formatExactDate(display.createdAt)}</span>
            {display.user?.firstName && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <User size={11} className="shrink-0" />
                {display.user.firstName} {display.user.lastName}
              </span>
            )}
            {isAdmin && incident.incidents?.length > 1 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                <Users size={10} />
                {incident.incidents.length} reportes
              </span>
            )}
            {isAdmin && incident.representativeId?.is_dubious && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                <AlertTriangle size={10} />
                Dudoso
              </span>
            )}
          </div>
        </div>

        {/* ── Body con scroll propio ── */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col divide-y divide-slate-100">

            {/* Mapa */}
            <div className="px-5 py-4">
              <LocationPanel
                location={location}
                mapClassName="w-full h-40 rounded-lg z-0 border border-slate-200"
              />
            </div>

            {/* Descripción */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Descripción
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {display.description || "Sin descripción."}
              </p>
            </div>

            {/* Fotos */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Fotos/Videos
              </p>
              <PhotoGallery photos={display.photos} compact />
            </div>

            {/* ── Secciones admin ── */}
            {isAdmin && (
              <>
                {/* Gestión */}
                {actions && (
                  <div className="px-5 py-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Gestión
                    </p>
                    {actions}
                  </div>
                )}

                {/* Análisis IA */}
                <div className="px-5 py-4">
                  <AIInsights incident={incident} onUpdated={onUpdated} />
                </div>

                {/* Historial */}
                <div className="px-5 py-4">
                  <StatusHistory groupId={incident._id} />
                </div>
              </>
            )}

            {/* Cancelar reporte (ciudadano) */}
            {canCancel && (
              <div className="px-5 py-4">
                {cancelError && (
                  <p className="text-xs text-red-500 text-center mb-2">{cancelError}</p>
                )}
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full h-10 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling && <Loader2 size={14} className="animate-spin" />}
                  {cancelling ? "Cancelando..." : "Cancelar reporte"}
                </button>
              </div>
            )}

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
