// Placeholder animado que imita la forma de un IncidentCard mientras carga.
// No tiene props — siempre muestra el mismo esqueleto gris pulsante.
// Se usa en InicioTab para mostrar 3 skeletons mientras se obtienen los incidentes.
import { Card, CardContent } from "@/components/ui/card";

export default function IncidentSkeleton() {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 bg-gray-200 rounded-full animate-pulse flex-1" />
          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse shrink-0" />
        </div>
        <div className="h-3 w-40 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
      </CardContent>
    </Card>
  );
}
