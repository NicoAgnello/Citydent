import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  // envulve al /home y a /admin
  //¿Clerk cargó? No → "Cargando..."
  //¿Estás logueado? No → mandarte a /login
  //¿Se requiere un rol? Sí → ¿lo tenés? No → mandarte a /unauthorized
  //Si todo está bien → mostrar children (Home o AdminDashboard)
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) return <div>Cargando...</div>;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const userRole = user?.publicMetadata?.role;
    if (userRole !== requiredRole) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;