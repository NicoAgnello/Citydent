import { MapPin, Tag, Calendar, FileText, X, Loader2, User } from "lucide-react";
import { useState } from "react";
import { cancelIncident } from "@/services/api";
import StatusHistory from "@/components/admin/incidents/StatusHistory";
import AIInsights from "@/components/admin/incidents/AIInsights";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { STATUS_STYLES, STATUS_LABELS, capitalize } from "@/lib/incidents";
import { formatDate } from "./IncidentCard";
import PhotoGallery from "./PhotoGallery";
import LocationPanel from "./LocationPanel";
import SectionLabel from "@/components/ui/SectionLabel";

const CANCELABLE_STATUSES = ["pendiente", "dudoso"];

export default function IncidentDetailSheet({
  incident,
  open,
  onOpenChange,
  actions,
  isAdmin,
  onUpdated,
}) {
  const [cancelling, setCancelling] = useState(false);
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
  const style = STATUS_STYLES[statusKey] ?? STATUS_STYLES.pendiente;
  const label = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const location = incident.location;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-3xl max-h-[92vh] p-0 flex flex-col [&::-webkit-scrollbar]:hidden"
      >
        {/* Header oscuro */}
        <SheetHeader className="bg-azul-oscuro px-5 pt-3 pb-5 text-left rounded-t-3xl shrink-0">
          <div className="flex justify-center pb-2 md:hidden">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>
          <div className="flex items-start gap-3">
            <SheetTitle className="text-lg font-bold text-white leading-snug flex-1">
              {incident.title}
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="shrink-0 mt-0.5 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
            >
              {label}
            </span>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Tag size={12} className="shrink-0" />
              <span>{capitalize(incident.category?.name)}</span>
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Calendar size={12} className="shrink-0" />
              <span>{formatDate(incident.createdAt)}</span>
            </div>
            {incident.user?.firstName && (
              <>
                <span className="text-white/20">·</span>
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <User size={12} className="shrink-0" />
                  <span>{incident.user.firstName} {incident.user.lastName}</span>
                </div>
              </>
            )}
          </div>
        </SheetHeader>

        {/* Body scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 [&::-webkit-scrollbar]:hidden flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-[400px_auto_1fr] gap-0">
            {/* Mapa — solo desktop */}
            <div className="hidden md:flex flex-col gap-3 pr-6">
              <SectionLabel
                icon={<MapPin size={13} className="text-gray-400" />}
                label="Ubicación"
              />
              <LocationPanel location={location} />
            </div>

            {/* Divider vertical */}
            <div className="hidden md:block bg-gray-100 w-px" />

            {/* Descripción + fotos + mapa mobile */}
            <div className="flex flex-col gap-5 md:pl-6">
              <section>
                <SectionLabel
                  icon={<FileText size={13} className="text-gray-400" />}
                  label="Descripción"
                />
                <p className="text-sm text-gray-600 leading-relaxed mt-2">
                  {incident.description || "Sin descripción."}
                </p>
              </section>

              <section>
                <SectionLabel label="Fotos" />
                <div className="mt-2">
                  <PhotoGallery photos={incident.photos} />
                </div>
              </section>

              <section className="md:hidden">
                <SectionLabel
                  icon={<MapPin size={13} className="text-gray-400" />}
                  label="Ubicación"
                />
                <div className="mt-2">
                  <LocationPanel
                    location={location}
                    mapClassName="w-full h-48 rounded-2xl z-0"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Info IA + Historial — solo admin */}
          {isAdmin && (
            <>
              <AIInsights incident={incident} onUpdated={onUpdated} />
              <div className="border-t border-gray-100 pt-4">
                <StatusHistory incidentId={incident._id} />
              </div>
            </>
          )}
        </div>

        {/* Panel de acciones sticky — admin o usuario con opción de cancelar */}
        {(actions || canCancel) && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            {actions}
            {canCancel && (
              <>
                {cancelError && (
                  <p className="text-xs text-red-500 text-center">{cancelError}</p>
                )}
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full h-11 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling && <Loader2 size={14} className="animate-spin" />}
                  {cancelling ? "Cancelando..." : "Cancelar reporte"}
                </button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
