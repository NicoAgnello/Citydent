import { SignIn } from "@clerk/clerk-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/Components/ui/card";
import api from "../services/api";

function Login() {
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const sincronizar = async () => {
      try {
        const token = await getToken();
        const response = await api.post(
          "/auth/login",
          {
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        console.log("Usuario sincronizado:", response.data);
      } catch (error) {
        console.error("Error sincronizando usuario:", error);
      }
    };

    sincronizar();
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
            🏙️
          </div>
          <CardTitle className="text-xl">CityFixer</CardTitle>
          <CardDescription>Ingresá a tu cuenta para continuar</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            fallbackRedirectUrl="/"
            // appearance={{
            //   variables: {
            //     colorPrimary: "#18181b", // botón principal — negro neutro
            //     colorBackground: "#ffffff",
            //     colorText: "#18181b",
            //     colorTextSecondary: "#71717a",
            //     colorInputBackground: "#ffffff",
            //     colorInputText: "#18181b",
            //     borderRadius: "8px",
            //   },
            //   elements: {
            //     rootBox: "w-full",
            //     card: "shadow-none border-0 p-0 w-full",
            //     headerTitle: "hidden",
            //     headerSubtitle: "hidden",
            //     socialButtonsBlockButton:
            //       "border border-zinc-200 hover:bg-zinc-50 text-zinc-900",
            //     formButtonPrimary: "bg-zinc-900 hover:bg-zinc-700 text-white",
            //     footerActionLink: "text-zinc-900 font-medium",
            //     identityPreviewEditButton: "text-zinc-900",
            //   },
            // }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
