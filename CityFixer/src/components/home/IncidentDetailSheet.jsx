import { X, Loader2, User } from "lucide-react";
import { useState } from "react";
import { cancelIncident } from "@/services/api";
import StatusHistory from "@/components/admin/incidents/StatusHistory";
import AIInsights from "@/components/admin/incidents/AIInsights";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { STATUS_LABELS, capitalize } from "@/lib/incidents";

function formatExactDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-AR", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}
import PhotoGallery from "./PhotoGallery";
import LocationPanel from "./LocationPanel";

const CANCELABLE_STATUSES = ["pendiente", "dudoso"];

const STATUS_BADGE_STYLES = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-blanquito/20 text-azul-oscuro border border-blanquito/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

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
  const statusCls = STATUS_BADGE_STYLES[statusKey] ?? "bg-gray-50 text-gray-500 border border-gray-200";
  const location  = incident.location;

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
              {incident.title}
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
            <span className="text-xs text-slate-400">{formatExactDate(incident.createdAt)}</span>
            {incident.user?.firstName && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <User size={11} className="shrink-0" />
                {incident.user.firstName} {incident.user.lastName}
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
                {incident.description || "Sin descripción."}
              </p>
            </div>

            {/* Fotos */}
            <div className="px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Fotos
              </p>
              <PhotoGallery photos={incident.photos} compact />
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
                  <StatusHistory incidentId={incident._id} />
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
