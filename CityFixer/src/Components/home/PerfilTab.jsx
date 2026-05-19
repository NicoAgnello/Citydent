import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PerfilTab({ incidents }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
      })
    : null;

  const stats = [
    { label: "Reportados",  value: incidents.length },
    { label: "Resueltos",   value: incidents.filter((i) => i.estado === "Resuelto").length },
    { label: "En revisión", value: incidents.filter((i) => i.estado === "En revisión").length },
  ];

  const handleSignOut = () => {
    signOut(() => navigate("/login"));
  };

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      {/* Profile card con banner */}
      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <div className="bg-[#292D60] h-20" />
        <CardContent className="px-5 pb-5">
          <div className="-mt-10 mb-4">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="avatar"
                className="w-20 h-20 rounded-full border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-[#D3D6FF]/50 flex items-center justify-center">
                <User size={32} className="text-[#292D60]" />
              </div>
            )}
          </div>
          <h2 className="font-bold text-[#292D60] text-xl leading-tight">
            {user?.fullName ?? "Ciudadano"}
          </h2>

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <span>{user?.primaryEmailAddress?.emailAddress ?? "—"}</span>
            </div>
            {joinedDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <span>Ciudadano desde {joinedDate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#292D60]">{stat.value}</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}
