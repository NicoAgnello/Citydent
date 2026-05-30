import { MapPin, Tag, Calendar, FileText, X } from "lucide-react";
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

export default function IncidentDetailSheet({
  incident,
  open,
  onOpenChange,
  actions,
}) {
  if (!incident) return null;

  const statusKey = incident.status?.name;
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
          </div>
        </SheetHeader>

        {/* Body scrolleable */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 [&::-webkit-scrollbar]:hidden">
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
        </div>

        {/* Panel de acciones sticky — solo cuando hay actions (admin) */}
        {actions && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
            {actions}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
