// Muestra la fecha de forma relativa: "Hoy", "Ayer", o "3 ago".
// Se usa en las tarjetas de incidentes (IncidentCard, IncidentGridCard,
// AdminIncidentCard, AdminIncidentRow).
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "—";
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart  = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays   = Math.round((todayStart - dateStart) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// Muestra fecha y hora completa. Ej: "03 ago 2024, 14:30".
// Se usa en el detalle de incidente (IncidentDetailSheet) y en el
// historial de cambios de estado (StatusHistory).
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-AR", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

// Muestra solo la fecha, sin hora. Ej: "3 ago 2024".
// Se usa para fechas de registro de usuarios en el panel admin.
export function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric",
  });
}
