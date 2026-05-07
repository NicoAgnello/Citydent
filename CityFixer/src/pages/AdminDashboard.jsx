import { useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

function AdminDashboard() {
  const { signOut } = useClerk();

  return (
    <div>
      <h1>Panel Admin</h1>
      <Button variant="outline" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
    </div>
  );
}
export default AdminDashboard;
