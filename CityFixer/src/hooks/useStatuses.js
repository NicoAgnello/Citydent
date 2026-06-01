import { useState, useEffect } from "react";
import { getStatuses } from "@/services/api";

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
