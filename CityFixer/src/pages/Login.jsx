import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";


function Login() {
   const { isSignedIn, getToken } = useAuth();
   useEffect(() => {
    const enviarToken = async () => {
      if (isSignedIn) {
        try {
          // Extraemos el string del token
          const token = await getToken();

          // Enviamos el token al backend
          const response = await axios.post("http://localhost:3000/auth/login", {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          console.log("Respuesta del back:", response.data);
          // Aquí podrías redirigir al usuario: window.location.href = "/dashboard";
          
        } catch (error) {
          console.error("Error enviando el token al backend:", error);
        }
      }
    };

    enviarToken();
  }, [isSignedIn, getToken]);
    
  return (
    <div>
        <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
    </div>
    
  );
}

export default Login;