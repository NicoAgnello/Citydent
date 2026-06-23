// ─── AppRouter ────────────────────────────────────────────────────────────────
//
// Define todas las rutas (páginas) de la aplicación y quién puede acceder a cada una.
//
// Mapa de rutas:
//   /           → RootRedirect: redirige según si el usuario está logueado y su rol
//   /login      → Pantalla de login (solo accesible si NO está logueado)
//   /home       → Pantalla principal del ciudadano (requiere rol "user")
//   /admin      → Panel de administración (requiere rol "admin" o "superAdmin")
//   /unauthorized → Pantalla de acceso denegado
//   *           → Cualquier ruta desconocida redirige a /
//
// Componentes auxiliares definidos acá:
//   RootRedirect → Decide a dónde ir cuando el usuario entra a "/"
//   PublicRoute  → Envuelve rutas que solo deben verse si NO hay sesión activa
//
// El <NotificationProvider> envuelve solo la ruta /home porque las notificaciones
// en tiempo real solo son necesarias para el usuario ciudadano, no para el admin.

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Home from "../pages/Home";
import AdminDashboard from "../pages/AdminDashboard";
import { NotificationProvider } from "@/context/NotificationContext";

// Redirige al usuario según su estado de sesión y rol.
// Si no está logueado → /login
// Si es admin/superAdmin → /admin
// Si es usuario común → /home
function RootRedirect({ dbRole }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div>Cargando...</div>;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (dbRole === "admin" || dbRole === "superAdmin") return <Navigate to="/admin" replace />;
  return <Navigate to="/home" replace />;
}

// Envuelve rutas que solo deben mostrarse si el usuario NO está autenticado.
// Si ya tiene sesión activa, lo redirige a / para que RootRedirect lo lleve a su pantalla.
function PublicRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div>Cargando...</div>;
  if (isSignedIn) return <Navigate to="/" replace />;

  return children;
}

function AppRouter({ dbRole }) {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect dbRole={dbRole} />} />
      <Route
        path="/login/*"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute dbRole={dbRole} requiredRole="user">
            <NotificationProvider>
              <Home />
            </NotificationProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute dbRole={dbRole} requiredRole="admin">
            <AdminDashboard dbRole={dbRole} />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<div>Sin permisos</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
