import { getMisIncidentes } from "@/services/api";
import { useFetch } from "./useFetch";

export function useIncidents() {
  const { data: incidents, ...rest } = useFetch(getMisIncidentes, "incidents");
  return { incidents, ...rest };
}
