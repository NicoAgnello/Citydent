import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Home from "../pages/Home";
import AdminDashboard from "../pages/AdminDashboard";

function RootRedirect() {
  // envulve a toda la app --> cada vez que se entra a la pagina empieza por aca
  //¿Clerk cargó? No → "Cargando..."
  //¿Estás logueado? No → mandarte a /login
  //¿Sos admin? Sí → mandarte a /admin
  //Si no → mandarte a /home

  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return <div>Cargando...</div>;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  const role = user?.publicMetadata?.role;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/home" replace />;
}

function PublicRoute({ children }) {
  // envulve al /login
  //¿Clerk cargó? No → "Cargando..."
  //¿Ya estás logueado? Sí → mandarte a / (no necesitás ver el login)
  //Si no → mostrar children (la pantalla de login)

  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div>Cargando...</div>;
  if (isSignedIn) return <Navigate to="/" replace />;

  return children;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<div>Sin permisos</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
