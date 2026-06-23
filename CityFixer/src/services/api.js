import axios from "axios";

// ─── Cliente HTTP ─────────────────────────────────────────────────────────────
//
// Este archivo es el punto central de comunicación entre el frontend y el backend.
// Todas las llamadas a la API pasan por acá.
//
// Cómo funciona:
//   - Se crea una instancia de Axios con la URL base del backend (VITE_API_URL).
//   - `withCredentials: true` hace que el navegador envíe automáticamente la
//     cookie de sesión en cada request, sin necesidad de manejarla a mano.
//   - Hay un interceptor global que detecta si el backend responde con un error
//     de cuenta suspendida (HTTP 403) y lanza un evento para que la app reaccione.
//
// Cómo usar una función desde un componente:
//   import { getMisIncidentes } from "@/services/api";
//   const { data } = await getMisIncidentes();
//   console.log(data.incidents); // array de incidentes

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Interceptor global de errores.
// Si el backend responde 403 con el mensaje de cuenta suspendida, dispara el
// evento "cityfixer:banned" que escucha App.jsx para mostrar el aviso y cerrar sesión.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === 'Tu cuenta ha sido suspendida.'
    ) {
      window.dispatchEvent(new CustomEvent('cityfixer:banned'));
    }
    return Promise.reject(error);
  }
);


// ─── Categorías ───────────────────────────────────────────────────────────────

// Solo las categorías activas. Se usa en el formulario de nuevo incidente
// (IncidentForm) para que el usuario elija una categoría al reportar.
export const getCategoriasActivas = () => api.get("/api/categories/active");

// Todas las categorías, incluyendo las inactivas. Solo para el panel admin
// (AdminCategoriasTab) donde se pueden activar, desactivar o editar.
export const getCategorias = () => api.get("/api/categories");


// ─── Incidentes ───────────────────────────────────────────────────────────────

// Crea un nuevo incidente. Recibe un FormData con fotos y datos del formulario.
// El backend sube las fotos a Cloudinary y guarda las URLs resultantes.
// La ubicación (location) se envía como JSON string dentro del FormData porque
// FormData no soporta objetos anidados directamente.
// Se usa en IncidentForm cuando el usuario envía el reporte.
export const postIncidente = (formData) =>
  api.post("/api/incidents", formData);

// Trae los incidentes del usuario logueado. Se usa en useIncidents (Home).
export const getMisIncidentes = () => api.get("/api/incidents/my-incidents");

// Cancela un incidente propio. Solo funciona si el incidente está en un estado
// cancelable (pendiente o aceptado). Se usa en IncidentDetailSheet.
export const cancelIncident = (id) => api.patch(`/api/incidents/${id}/cancel`);


// ─── Admin — Incidentes ───────────────────────────────────────────────────────

// Trae todos los incidentes del sistema, agrupados. Solo admin/superAdmin.
// Se usa en useAllIncidents → AdminIncidentesTab.
export const getAllIncidents = () => api.get("/api/incidents");

// Cambia el estado de un incidente (ej: de "pendiente" a "en proceso").
// Se usa en IncidentAdminActions.
export const updateIncidentStatus = (id, statusId) =>
  api.patch(`/api/incidents/${id}/status`, { statusId });

// Reasigna la categoría de un incidente. Se usa en IncidentAdminActions.
export const updateIncidentCategory = (id, categoryId) =>
  api.patch(`/api/incidents/${id}/category`, { categoryId });

// Cambia la prioridad numérica de un incidente (1 = baja, 5 = alta).
// Se usa en IncidentAdminActions.
export const updateIncidentPriority = (id, priority) =>
  api.patch(`/api/incidents/${id}/priority`, { priority });

// Trae el historial de cambios de estado de un incidente individual.
// Se usa en StatusHistory dentro del detalle de incidente.
export const getIncidentHistory = (id) => api.get(`/api/incidents/${id}/history`);

// Trae el historial de cambios de estado de un grupo de incidentes agrupados.
// Se usa en StatusHistory cuando el incidente es parte de un grupo.
export const getGroupHistory = (groupId) => api.get(`/api/incidents/${groupId}/group-history`);


// ─── Admin — Sincronización con IA ───────────────────────────────────────────

// Lanza la sincronización de incidentes con la IA (agrupamiento automático).
// Puede tardar varios segundos. Se usa en AdminIncidentesTab.
export const syncIncidentsWithAI = () => api.post("/api/incidents/sync-ai");

// Devuelve cuántos incidentes están pendientes de sincronizar con la IA.
// Se usa en AdminIncidentesTab para mostrar el contador antes de sincronizar.
export const countIncidentsPendingAI = () => api.get("/api/incidents/sync-ai/count");


// ─── Perfil de usuario ────────────────────────────────────────────────────────

// Trae el perfil completo del usuario logueado (DNI, teléfono, dirección, etc.).
// Se usa en PerfilTab y en App.jsx para saber si el perfil está completo.
export const getMyProfile = () => api.get("/api/users/me");

// Envía un código OTP al mail del usuario para verificar identidad.
// Se usa en ProfileSetupScreen durante el onboarding inicial.
export const sendVerificationCode = () => api.post("/api/users/me/send-verification");

// Guarda cambios en el perfil del usuario logueado (dirección, teléfono, etc.).
// Se usa en PerfilTab y en ProfileSetupScreen.
export const patchProfile = (body) => api.patch("/api/users/me", body);


// ─── Barrios ──────────────────────────────────────────────────────────────────

// Trae la lista de barrios de Villa María.
// Se usa en ProfileSetupScreen, PerfilTab y AdminUsuariosTab para el selector de barrio.
export const getNeighborhoods = () => api.get("/api/neighborhoods");


// ─── Notificaciones de usuario ────────────────────────────────────────────────

// Trae las notificaciones del usuario logueado.
// Se usa en NotificationContext al iniciar la sesión.
export const getNotifications = () => api.get("/api/notifications");

// Marca todas las notificaciones del usuario como leídas.
// Se usa en NotificationContext cuando el usuario hace click en "marcar todo como leído".
export const markAllNotificationsRead = () => api.patch("/api/notifications/read-all");

// Marca como leídas las notificaciones vinculadas a un incidente específico.
// Se usa en NotificationContext cuando el usuario abre el detalle de un incidente.
export const markNotificationsByIncident = (id) =>
  api.patch(`/api/notifications/by-incident/${id}/read`);


// ─── Power BI ─────────────────────────────────────────────────────────────────

// Solicita un código OTP para acceder al dashboard de Power BI.
// El código se envía por mail y tiene validez de 5 minutos.
// Se usa en AdminEstadisticasTab.
export const requestPowerBiOtp = () => api.post("/api/external/request-otp");


// ─── Admin — Categorías ───────────────────────────────────────────────────────

// Crea una nueva categoría de incidente. Solo superAdmin.
// Se usa en AdminCategoriasTab.
export const createCategory = (body) => api.post("/api/categories", body);

// Activa o desactiva una categoría existente. Solo superAdmin.
// Una categoría inactiva no aparece al crear incidentes.
// Se usa en AdminCategoriasTab.
export const toggleCategory = (id) => api.patch(`/api/categories/${id}/toggle`);

// Edita el nombre y/o descripción de una categoría. Solo superAdmin.
// Se usa en AdminCategoriasTab.
export const updateCategory = (id, body) => api.patch(`/api/categories/${id}`, body);


// ─── Estados ─────────────────────────────────────────────────────────────────

// Trae todos los estados posibles de un incidente (pendiente, en proceso, etc.).
// Se usa en useStatuses → IncidentAdminActions para el selector de cambio de estado.
export const getStatuses = () => api.get("/api/statuses");


// ─── Admin — Usuarios ─────────────────────────────────────────────────────────
// Todas estas funciones son exclusivas del panel admin y se usan a través
// del hook useUsers → AdminUsuariosTab.

// Trae la lista completa de usuarios del sistema.
export const getUsers = () => api.get("/api/users");

// Trae los roles disponibles (user, admin, superAdmin).
export const getRoles = () => api.get("/api/users/roles");

// Crea un nuevo usuario manualmente desde el panel admin.
export const createUser = (body) => api.post("/api/users", body);

// Cambia el rol de un usuario (ej: de "user" a "admin").
export const updateUserRole = (id, roleId) =>
  api.patch(`/api/users/${id}/role`, { role: roleId });

// Edita los datos de perfil de un usuario (nombre, DNI, dirección, etc.).
export const updateUserProfile = (id, body) =>
  api.patch(`/api/users/${id}/profile`, body);

// Banea o desbanea un usuario. Un usuario baneado recibe 403 en cada request.
export const updateUserBan = (id, isBanned) =>
  api.patch(`/api/users/${id}/ban`, { isBanned });

export default api;
