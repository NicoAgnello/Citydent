import { ClipboardList, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_KEYS } from "@/lib/incidents";

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4">
        <Icon size={18} className={`mb-2 ${color}`} />
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-8 w-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-3 w-16 bg-gray-200 rounded-full animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function KpiSection({ incidents, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  const kpis = [
    { label: "Reportados",  value: incidents.length,                                                                    icon: ClipboardList, color: "text-azul-oscuro" },
    { label: "En proceso",  value: incidents.filter((i) => i.status?.name === STATUS_KEYS.IN_PROCESS).length,           icon: Clock,         color: "text-celestito" },
    { label: "Resueltos",   value: incidents.filter((i) => i.status?.name === STATUS_KEYS.RESOLVED).length,             icon: CheckCircle2,  color: "text-green-600" },
    { label: "Rechazados",  value: incidents.filter((i) => i.status?.name === STATUS_KEYS.REJECTED).length,             icon: XCircle,       color: "text-red-500"   },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
    </div>
  );
}
