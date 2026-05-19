import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Plus } from "lucide-react";

import AppHeader from "@/Components/home/AppHeader";
import BottomNav from "@/Components/home/BottomNav";
import InicioTab from "@/Components/home/InicioTab";
import ReportesTab from "@/Components/home/ReportesTab";
import PerfilTab from "@/Components/home/PerfilTab";
import IncidentModal from "@/Components/map/IncidentModal";

// Reemplazar con fetch a la API cuando esté disponible
const MOCK_INCIDENTS = [
  { id: 1, titulo: "Bache profundo en Av. Costanera", categoria: "Vialidad",      fecha: "2026-05-16", estado: "En revisión", direccion: "Av. Costanera 1200"       },
  { id: 2, titulo: "Luminaria rota frente a plaza",   categoria: "Iluminación",   fecha: "2026-05-14", estado: "Pendiente",   direccion: "25 de Mayo 450"           },
  { id: 3, titulo: "Árbol caído bloqueando vereda",   categoria: "Espacio verde", fecha: "2026-05-10", estado: "Resuelto",    direccion: "Belgrano 890"             },
  { id: 4, titulo: "Semáforo sin funcionar",          categoria: "Tránsito",      fecha: "2026-05-08", estado: "Rechazado",   direccion: "Independencia y San Martín"},
  { id: 5, titulo: "Contenedor desbordado",           categoria: "Higiene",       fecha: "2026-05-05", estado: "Resuelto",    direccion: "Las Heras 340"            },
];

export default function Home() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("inicio");
  const [reportOpen, setReportOpen] = useState(false);

  const incidents = MOCK_INCIDENTS;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AppHeader user={user} />

      <main className="flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activeTab === "inicio" && (
          <InicioTab user={user} incidents={incidents} onVerTodos={() => setActiveTab("reportes")} />
        )}
        {activeTab === "reportes" && <ReportesTab incidents={incidents} />}
        {activeTab === "perfil"   && <PerfilTab incidents={incidents} />}
      </main>

      {activeTab !== "perfil" && (
        <button
          onClick={() => setReportOpen(true)}
          className="fixed bottom-20 right-5 w-14 h-14 rounded-full bg-[#292D60] hover:bg-[#3B418F] text-white shadow-xl flex items-center justify-center transition-all active:scale-95 z-40"
        >
          <Plus size={26} />
        </button>
      )}

      <IncidentModal open={reportOpen} onOpenChange={setReportOpen} />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
