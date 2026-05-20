import axios from "axios";

// Cliente base — manda la cookie de sesión automáticamente en cada request
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});


// ─── Categorías ───────────────────────────────────────────────────────────────

// Trae todas las categorías disponibles para clasificar un incidente
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

export default api;
