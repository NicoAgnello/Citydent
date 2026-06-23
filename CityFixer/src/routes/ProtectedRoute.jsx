// ─── ProtectedRoute ───────────────────────────────────────────────────────────
//
// Componente que protege una ruta: si el usuario no cumple los requisitos,
// lo redirige automáticamente en vez de mostrar la página.
//
// Hace tres verificaciones en orden:
//   1. ¿Clerk terminó de cargar? Si no, muestra "Cargando..." para evitar
//      redirigir al usuario antes de saber si está autenticado.
//   2. ¿El usuario está autenticado? Si no, lo manda al login.
//   3. ¿El usuario tiene el rol requerido? Si no, lo manda a /unauthorized.
//
// Props:
//   children      → el componente de la página a mostrar si pasa los controles
//   requiredRole  → "user" o "admin" (ver lógica de roles abajo)
//   dbRole        → rol del usuario según la base de datos (viene de App.jsx)
//
// Lógica de roles:
//   - requiredRole="user"  → solo el rol "user" puede acceder
//   - requiredRole="admin" → tanto "admin" como "superAdmin" pueden acceder,
//     porque superAdmin tiene todos los permisos de admin y más.
//
// Se usa en AppRouter.jsx para envolver las rutas /home y /admin.

import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole, dbRole }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div>Cargando...</div>;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (requiredRole) {
    // "admin" y "superAdmin" pueden acceder a rutas de admin
    const allowed =
      requiredRole === "admin"
        ? dbRole === "admin" || dbRole === "superAdmin"
        : dbRole === requiredRole;

    if (!allowed) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
