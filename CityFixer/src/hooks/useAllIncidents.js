import { getAllIncidents } from "@/services/api";
import { useFetch } from "./useFetch";

export function useAllIncidents() {
  const { data: incidents, ...rest } = useFetch(getAllIncidents, "incidents");
  return { incidents, ...rest };
}
