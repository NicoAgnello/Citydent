import { useState } from "react";
import { useAllIncidents } from "@/hooks/useAllIncidents";
import AdminHeader from "@/Components/admin/AdminHeader";
import AdminTabBar from "@/Components/admin/AdminTabBar";
import AdminIncidentesTab from "@/Components/admin/incidents/AdminIncidentesTab";
import AdminEstadisticasTab from "@/Components/admin/stats/AdminEstadisticasTab";
import AdminCategoriasTab from "@/Components/admin/categories/AdminCategoriasTab";
import IncidentModal from "@/Components/map/IncidentModal";

export default function AdminDashboard({ dbRole }) {
  const [activeTab, setActiveTab] = useState("incidentes");
  const [reportOpen, setReportOpen] = useState(false);
  const { incidents, loading, refresh } = useAllIncidents();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AdminHeader />
      <AdminTabBar activeTab={activeTab} onTabChange={setActiveTab} dbRole={dbRole} />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
        <div className="max-w-6xl mx-auto px-4 py-5">
          {activeTab === "incidentes" && (
            <AdminIncidentesTab
              incidents={incidents}
              loading={loading}
              onUpdated={refresh}
              onNuevoReporte={() => setReportOpen(true)}
            />
          )}
          {activeTab === "estadisticas" && (
            <AdminEstadisticasTab incidents={incidents} loading={loading} />
          )}
          {activeTab === "categorias" && (
            <AdminCategoriasTab dbRole={dbRole} />
          )}
        </div>
      </main>

      <IncidentModal open={reportOpen} onOpenChange={setReportOpen} onCreated={refresh} />
    </div>
  );
}
