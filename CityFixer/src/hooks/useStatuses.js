import { useState, useEffect } from "react";
import { getStatuses } from "@/services/api";

// Trae la lista de estados posibles para un incidente desde la API.
// Devuelve { statuses, error }.
// Se usa en los formularios del admin donde se puede cambiar el estado
// de un incidente (IncidentAdminActions).
export function useStatuses() {
  const [statuses, setStatuses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStatuses()
      .then(({ data }) => setStatuses(data.statuses ?? []))
      .catch((err) => setError(err));
  }, []);

  return { statuses, error };
}
