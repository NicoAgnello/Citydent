import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import AppRouter from "./routes/AppRouter";
import api from "./services/api";

function App() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const sincronizar = async () => {
      try {
        const token = await getToken();
        await api.post(
          "/auth/login",
          {
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        console.log("Usuario sincronizado", user);
      } catch (error) {
        console.error("Error sincronizando usuario:", error);
      }
    };

    sincronizar();
  }, [isLoaded, isSignedIn]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
