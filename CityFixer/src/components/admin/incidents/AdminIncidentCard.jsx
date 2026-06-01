import { useState } from "react";
import { MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_STYLES, STATUS_LABELS, capitalize } from "@/lib/incidents";

const PRIORITY_STYLES = {
  1: { bg: "bg-gray-100",   text: "text-gray-500"   },
  2: { bg: "bg-blue-100",   text: "text-blue-600"   },
  3: { bg: "bg-amber-100",  text: "text-amber-700"  },
  4: { bg: "bg-orange-100", text: "text-orange-600" },
  5: { bg: "bg-red-100",    text: "text-red-600"    },
};
import { formatDate } from "@/components/home/IncidentCard";
import IncidentDetailSheet from "@/components/home/IncidentDetailSheet";
import IncidentAdminActions from "./IncidentAdminActions";

export default function AdminIncidentCard({ incident, onUpdated }) {
  const [open, setOpen] = useState(false);

  const statusKey     = incident.status?.name;
  const style         = STATUS_STYLES[statusKey] ?? STATUS_STYLES.pendiente;
  const label         = STATUS_LABELS[statusKey] ?? capitalize(statusKey);
  const userName      = [incident.user?.firstName, incident.user?.lastName].filter(Boolean).join(" ") || "Usuario desconocido";
  const priority      = incident.priority ?? 1;
  const priorityStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES[1];

  return (
    <>
      <Card
        className="rounded-2xl border-none shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setOpen(true)}
      >
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-azul-oscuro text-sm leading-tight flex-1">{incident.title}</p>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${style.bg} ${style.text}`}>
              {label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User size={11} className="shrink-0 text-gray-400" />
            <span className="font-medium">{userName}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{incident.location?.address ?? "—"}</span>
            <span className="mx-1 shrink-0">·</span>
            <span className="shrink-0">{formatDate(incident.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] bg-blanquito/50 text-azul px-2 py-0.5 rounded-full font-medium">
              {capitalize(incident.category?.name)}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
              Prioridad: {priority}
            </span>
          </div>
        </CardContent>
      </Card>

      <IncidentDetailSheet
        incident={incident}
        open={open}
        onOpenChange={setOpen}
        isAdmin
        onUpdated={onUpdated}
        actions={
          <IncidentAdminActions
            incident={incident}
            onUpdated={() => { onUpdated?.(); setOpen(false); }}
          />
        }
      />
    </>
  );
}
