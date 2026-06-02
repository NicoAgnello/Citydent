import { useState, useEffect } from "react";
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
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const handler = () => setIsBanned(true);
    window.addEventListener('cityfixer:banned', handler);
    return () => window.removeEventListener('cityfixer:banned', handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <AppHeader
        user={user}
        isBanned={isBanned}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className={`flex-1 overflow-y-auto pb-20 md:pb-0 [&::-webkit-scrollbar]:hidden relative ${isBanned ? "pointer-events-none select-none" : ""}`}>
        {isBanned && <div className="absolute inset-0 bg-white/60 z-10" />}

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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} disabled={isBanned} />
    </div>
  );
}
