import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useAuth, useUser, useClerk } from "@clerk/clerk-react";
import AppRouter from "./routes/AppRouter";
import ProfileSetupScreen from "./components/auth/ProfileSetupScreen";
import api from "./services/api";

function App() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSynced, setIsSynced]             = useState(false);
  const [dbRole, setDbRole]                 = useState(null);
  const [needsProfile, setNeedsProfile]     = useState(false);

  const sincronizar = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/auth/login",
        {
          email:     user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName:  user.lastName,
          imageUrl:  user.imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDbRole(data.user?.role?.name ?? "user");
      if (!data.user?.profileComplete) {
        setNeedsProfile(true);
      }
    } catch (error) {
      console.error("Error sincronizando usuario:", error);
    } finally {
      setIsSynced(true);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setIsSynced(true); return; }
    sincronizar();
  }, [isLoaded, isSignedIn]);

  const handleProfileComplete = () => setNeedsProfile(false);

  if (!isLoaded) return null;

  if (isSignedIn && isSynced && needsProfile) {
    return <ProfileSetupScreen onComplete={handleProfileComplete} onSignOut={() => signOut()} />;
  }

  if (!isSynced) return null;

  return (
    <BrowserRouter>
      <AppRouter dbRole={dbRole} />
    </BrowserRouter>
  );
}

export default App;
