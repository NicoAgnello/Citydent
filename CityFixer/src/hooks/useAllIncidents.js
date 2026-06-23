import { getAllIncidents } from "@/services/api";
import { useFetch } from "./useFetch";

// Trae todos los incidentes (agrupados) desde la API. Solo para admins.
// Devuelve { groups, loading, error, refresh }.
// Se usa en el panel de administración (AdminIncidentesTab).
export function useAllIncidents() {
  const { data: groups, ...rest } = useFetch(getAllIncidents, "groups");
  return { groups, ...rest };
}
