import { getMisIncidentes } from "@/services/api";
import { useFetch } from "./useFetch";

// Trae los incidentes del usuario logueado desde la API.
// Devuelve { incidents, loading, error, refresh }.
// Se usa en la pantalla principal del usuario (Home).
export function useIncidents() {
  const { data: incidents, ...rest } = useFetch(getMisIncidentes, "incidents");
  return { incidents, ...rest };
}
