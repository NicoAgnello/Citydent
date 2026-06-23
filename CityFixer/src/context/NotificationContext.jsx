// ─── NotificationContext ──────────────────────────────────────────────────────
//
// Un "Context" en React es una forma de compartir datos entre muchos componentes
// sin tener que pasarlos manualmente de padre a hijo uno por uno.
//
// Este context maneja todo lo relacionado a notificaciones del usuario logueado:
//   - Carga el historial de notificaciones al iniciar sesión (desde la API).
//   - Mantiene una conexión en tiempo real con el servidor via WebSocket (Socket.IO),
//     de modo que si llega una nueva notificación mientras el usuario está en la app,
//     aparece automáticamente sin necesidad de recargar la página.
//   - Expone funciones para marcar notificaciones como leídas.
//
// Cómo se usa:
//   1. <NotificationProvider> envuelve la pantalla de Home en AppRouter.jsx.
//   2. Cualquier componente dentro de Home puede acceder a las notificaciones con:
//        const { notifications, unreadCount, markAllRead } = useNotificationContext();
//
// Componentes que lo consumen: AppHeader (campanita), IncidentDetailSheet.

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationsByIncident,
} from "@/services/api";
import { STATUS_LABELS_PUBLIC } from "@/lib/incidents";

// Traduce los nombres internos de estado dentro del mensaje de notificación
// al texto que ve el usuario. Por ejemplo, convierte "dudoso" → "Pendiente"
// para que el ciudadano no vea el estado interno de moderación.
function toFriendlyMessage(msg) {
  const match = /"([^"]+)"/.exec(msg);
  const raw = match?.[1];
  if (!raw || !STATUS_LABELS_PUBLIC[raw]) return msg;
  return msg.replace(`"${raw}"`, `"${STATUS_LABELS_PUBLIC[raw]}"`);
}

const NotificationContext = createContext(null);

// Componente que envuelve la app y hace disponibles las notificaciones.
// Solo debe usarse una vez, en AppRouter.jsx alrededor de <Home />.
export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Al montar, trae el historial de notificaciones desde la API y las fusiona
    // con las que ya llegaron por socket (si el socket conectó antes que la API).
    // Se usa Set para evitar duplicados por _id.
    getNotifications()
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        setNotifications((prev) => {
          const ids = new Set(prev.map((n) => n._id));
          return [...prev, ...data.filter((n) => !ids.has(n._id))];
        });
      })
      .catch(() => {});

    // Abre la conexión WebSocket con el servidor.
    // withCredentials: true envía la cookie de sesión para que el servidor
    // sepa qué usuario es y solo le mande sus propias notificaciones.
    const socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect",            ()    => console.log("[socket] conectado:", socket.id));
    socket.on("connect_error",      (err) => console.warn("[socket] error de conexión:", err.message));
    socket.on("disconnect",         ()    => console.log("[socket] desconectado"));

    // Cuando llega una notificación nueva en tiempo real:
    // la agrega al principio de la lista y muestra un toast por 5 segundos.
    socket.on("notification", (noti) => {
      setNotifications((prev) => [noti, ...prev]);
      toast.info(toFriendlyMessage(noti.message), { duration: 5000 });
    });

    // Cuando el componente se desmonta (el usuario cierra sesión o sale de Home),
    // se desconecta el socket para no dejar conexiones abiertas.
    return () => socket.disconnect();
  }, []);

  // Cantidad de notificaciones no leídas. Se usa para el badge rojo en la campanita.
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Marca todas las notificaciones como leídas en la API y actualiza el estado local.
  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  // Marca como leídas las notificaciones de un incidente específico.
  // Se llama cuando el usuario abre el detalle de un incidente.
  const markByIncident = async (incidentId) => {
    try {
      await markNotificationsByIncident(incidentId);
      setNotifications((prev) =>
        prev.map((n) =>
          String(n.incidentId) === String(incidentId) ? { ...n, isRead: true } : n
        )
      );
    } catch {}
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markByIncident }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook para consumir el context desde cualquier componente dentro de <NotificationProvider>.
// Lanza error si se usa fuera del provider.
// Uso: const { notifications, unreadCount, markAllRead, markByIncident } = useNotificationContext();
export function useNotificationContext() {
  return useContext(NotificationContext);
}
