import axios from "axios";

// Cliente base — manda la cookie de sesión automáticamente en cada request
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});


// ─── Categorías ───────────────────────────────────────────────────────────────

// Solo categorías activas — para usuarios al crear un incidente
export const getCategoriasActivas = () => api.get("/api/categories/active");

// Todas las categorías (activas + inactivas) — solo admin/superAdmin
export const getCategorias = () => api.get("/api/categories");

// ─── Incidentes ───────────────────────────────────────────────────────────────

// Crea un nuevo incidente — recibe FormData (multipart) con archivos de fotos.
// El middleware de Cloudinary en el back intercepta los archivos, los sube y
// agrega las URLs a req.body.photos antes de llegar al controller.
// Nota: location se envía como JSON string — el back debe parsearlo.
export const postIncidente = (formData) =>
  api.post("/api/incidents", formData);

// Trae los incidentes del usuario autenticado
export const getMisIncidentes = () => api.get("/api/incidents/my-incidents");

// Cancela un incidente propio (solo si está en estado cancelable)
export const cancelIncident = (id) => api.patch(`/api/incidents/${id}/cancel`);

// ─── Admin — Incidentes ───────────────────────────────────────────────────────

// Trae todos los incidentes (solo admin/superAdmin)
export const getAllIncidents = () => api.get("/api/incidents");

// Cambia el estado de un incidente
export const updateIncidentStatus = (id, statusId) =>
  api.patch(`/api/incidents/${id}/status`, { statusId });

// Cambia la categoría de un incidente
export const updateIncidentCategory = (id, categoryId) =>
  api.patch(`/api/incidents/${id}/category`, { categoryId });

export const updateIncidentPriority = (id, priority) =>
  api.patch(`/api/incidents/${id}/priority`, { priority });

// Trae el historial de estados de un incidente (solo admin/superAdmin)
export const getIncidentHistory = (id) => api.get(`/api/incidents/${id}/history`);

// ─── Admin — Categorías ───────────────────────────────────────────────────────

// Crea una nueva categoría (solo superAdmin)
export const createCategory = (body) => api.post("/api/categories", body);

// Activa o desactiva una categoría (solo superAdmin)
export const toggleCategory = (id) => api.patch(`/api/categories/${id}/toggle`);

// ─── Estados ─────────────────────────────────────────────────────────────────

// Trae todos los estados disponibles
export const getStatuses = () => api.get("/api/statuses");

// ─── Usuarios (solo superAdmin) ───────────────────────────────────────────────

export const getUsers = () => api.get("/api/users");
export const getRoles = () => api.get("/api/users/roles");
export const updateUserRole = (id, roleId) => api.patch(`/api/users/${id}/role`, { role: roleId });
export const updateUserBan = (id, isBanned) => api.patch(`/api/users/${id}/ban`, { isBanned });

export default api;
