import { useMemo } from "react";

// Estados que se consideran "cerrados": no generan alertas aunque sean emergencias.
const CLOSED = new Set(["resuelto", "rechazado", "cancelado"]);

// Filtra los incidentes recibidos y devuelve solo las emergencias activas
// (no archivadas, marcadas como emergencia, y con estado abierto).
// Devuelve { emergencias, total }.
// Se usa en AdminTopbar para mostrar el contador y lista de alertas urgentes.
export function useNotifications(incidents) {
  return useMemo(() => {
    const emergencias = incidents.filter(
      (i) => !i.isArchived && i.is_emergency && !CLOSED.has(i.status?.name)
    );
    return { emergencias, total: emergencias.length };
  }, [incidents]);
}
