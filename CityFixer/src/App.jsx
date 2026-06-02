import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import AppRouter from "./routes/AppRouter";
import DniSetupScreen from "./components/auth/DniSetupScreen";
import api from "./services/api";

const DNI_KEY = "cityfixer_dni";

function App() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const [dbRole, setDbRole] = useState(null);
  const [needsDni, setNeedsDni] = useState(false);
  const [dniLoading, setDniLoading] = useState(false);

  const sincronizar = async (dni) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/auth/login",
        {
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          dni,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      localStorage.setItem(DNI_KEY, dni);
      setDbRole(data.user?.role?.name ?? "user");
    } catch (error) {
      console.error("Error sincronizando usuario:", error);
    } finally {
      setIsSynced(true);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setIsSynced(true);
      return;
    }

    const dni = localStorage.getItem(DNI_KEY);
    if (dni) {
      sincronizar(dni);
    } else {
      setNeedsDni(true);
    }
  }, [isLoaded, isSignedIn]);

  const handleDniSubmit = async (dni) => {
    setDniLoading(true);
    await sincronizar(dni);
    setNeedsDni(false);
    setDniLoading(false);
  };

  if (!isLoaded) return null;

  if (isSignedIn && needsDni) {
    return <DniSetupScreen onSubmit={handleDniSubmit} loading={dniLoading} />;
  }

  if (!isSynced) return null;

  return (
    <BrowserRouter>
      <AppRouter dbRole={dbRole} />
    </BrowserRouter>
  );
}

export default App;
