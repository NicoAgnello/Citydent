import { useState, useEffect, useCallback } from "react";
import { getAllIncidents } from "@/services/api";

// Trae UNA página de grupos de incidentes, ya filtrada y ordenada en el
// servidor (no el listado completo). Se usa exclusivamente en
// AdminIncidentesTab, que es la vista que se pagina de verdad; el resto del
// panel (Topbar, Estadísticas, notificaciones) sigue usando useAllIncidents.
//
// Params (todos primitivos, para que el useEffect pueda listarlos como deps):
//   page, limit, archived, search, statuses, categories, priorities
//   (estos tres, strings separadas por coma), isDubious, dateFrom, dateTo, sortBy
//
// Devuelve { groups, pagination, counts, loading, error, refresh }.
//   pagination → { page, limit, total, totalPages }
//   counts     → { active, archived } (conteos totales, sin aplicar filtros)
export function useIncidentsPage(params) {
  const {
    page, limit, archived, search,
    statuses, categories, priorities,
    isDubious, dateFrom, dateTo, sortBy,
  } = params;

  const [groups, setGroups]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [counts, setCounts]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllIncidents({
        page, limit, archived, search,
        statuses, categories, priorities,
        isDubious, dateFrom, dateTo, sortBy,
      });
      setGroups(data.groups ?? []);
      setPagination(data.pagination ?? null);
      setCounts(data.counts ?? null);
    } catch (err) {
      setError(err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, archived, search, statuses, categories, priorities, isDubious, dateFrom, dateTo, sortBy]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  return { groups, pagination, counts, loading, error, refresh: fetchPage };
}
