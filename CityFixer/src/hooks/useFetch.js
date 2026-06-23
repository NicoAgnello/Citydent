import { useState, useEffect, useCallback } from "react";

// Hook genérico para traer datos de la API.
// Recibe una función de la API (apiFn) y la clave del objeto que devuelve (key).
// Maneja automáticamente los estados de carga, error y refresco.
// Lo usan useIncidents, useAllIncidents como base.
//
// Ejemplo de uso:
//   const { data, loading, error, refresh } = useFetch(getMisIncidentes, "incidents");
export function useFetch(apiFn, key) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await apiFn();
      setData(res[key] ?? []);
    } catch (err) {
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refresh };
}
