import { useMemo } from "react";

// Estados que indican que el incidente ya fue atendido/cerrado
const CLOSED = new Set(["resuelto", "rechazado", "cancelado"]);

/**
 * Option A: notificaciones derivadas del array incidents ya cargado.
 *
 * Para escalar a Option B (backend real), reemplazar la firma por:
 *   export function useNotifications() { ... fetch /api/notifications ... }
 * y devolver la misma forma { emergencias, criticos, nuevosHoy, total }
 * sin tocar ningún componente que consuma este hook.
 */
export function useNotifications(incidents) {
  return useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const emergencias = incidents.filter(
      (i) => i.is_emergency && !CLOSED.has(i.status?.name)
    );

    const criticos = incidents.filter(
      (i) => i.priority >= 4 && i.status?.name === "pendiente" && !i.is_emergency
    );

    const nuevosHoy = incidents.filter(
      (i) =>
        new Date(i.createdAt) >= todayStart &&
        i.status?.name === "pendiente" &&
        !i.is_emergency &&
        i.priority < 4
    );

    const total = emergencias.length + criticos.length + nuevosHoy.length;

    return { emergencias, criticos, nuevosHoy, total };
  }, [incidents]);
}
