import { useUser } from "@clerk/clerk-react";
import { User, Mail, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_KEYS } from "@/lib/incidents";

export default function PerfilTab({ incidents, loading }) {
  const { user } = useUser();

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long" })
    : null;

  const stats = [
    { label: "Reportados", value: incidents.length },
    { label: "Resueltos",  value: incidents.filter((i) => i.status?.name === STATUS_KEYS.RESOLVED).length },
    { label: "En proceso", value: incidents.filter((i) => i.status?.name === STATUS_KEYS.IN_PROCESS).length },
  ];

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <div className="bg-azul-oscuro h-20" />
        <CardContent className="px-5 pb-5">
          <div className="-mt-10 mb-4">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="avatar" className="w-20 h-20 rounded-full border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-blanquito/50 flex items-center justify-center">
                <User size={32} className="text-azul-oscuro" />
              </div>
            )}
          </div>
          <h2 className="font-bold text-azul-oscuro text-xl leading-tight">
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

      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          [0, 1, 2].map((i) => (
            <Card key={i} className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className="h-7 w-8 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-2.5 w-14 rounded-full bg-gray-100 animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-azul-oscuro">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
