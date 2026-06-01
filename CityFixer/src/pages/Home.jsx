import { useState } from "react";
import { useUser } from "@clerk/clerk-react";

import AppHeader from "@/components/home/AppHeader";
import BottomNav from "@/components/home/BottomNav";
import InicioTab from "@/components/home/InicioTab";
import ReportesTab from "@/components/home/ReportesTab";
import PerfilTab from "@/components/home/PerfilTab";
import IncidentModal from "@/components/map/IncidentModal";
import { useIncidents } from "@/hooks/useIncidents";

export default function Home() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("inicio");
  const [reportOpen, setReportOpen] = useState(false);
  const { incidents, loading, refresh } = useIncidents();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AppHeader user={user} />

      <main className="flex-1 overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {activeTab === "inicio" && (
          <InicioTab
            user={user}
            incidents={incidents}
            loading={loading}
            onVerTodos={() => setActiveTab("reportes")}
            onNuevoReporte={() => setReportOpen(true)}
            onUpdated={refresh}
          />
        )}
        {activeTab === "reportes" && <ReportesTab incidents={incidents} loading={loading} onUpdated={refresh} />}
        {activeTab === "perfil"   && <PerfilTab incidents={incidents} loading={loading} />}
      </main>

      <IncidentModal open={reportOpen} onOpenChange={setReportOpen} onCreated={refresh} />

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
