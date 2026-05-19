import axios from "axios";

// Cliente base — manda la cookie de sesión automáticamente en cada request
const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// ─── Categorías ───────────────────────────────────────────────────────────────

// Trae todas las categorías disponibles para clasificar un incidente
export const getCategorias = () => api.get("/api/categories");

// ─── Incidentes ───────────────────────────────────────────────────────────────

// (próximamente — endpoints de carga y consulta de incidentes)

export default api;
