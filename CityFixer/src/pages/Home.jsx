
import { useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

function Home() {

  const { signOut } = useClerk();

  return (
    <div>
      <h1>Dashboard ciudadano</h1>
      <Button variant="outline" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
    </div>
  );

}
export default Home;
