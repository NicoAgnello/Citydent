import { useState } from "react";
import { useAllIncidents } from "@/hooks/useAllIncidents";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminIncidentesTab from "@/components/admin/incidents/AdminIncidentesTab";
import AdminEstadisticasTab from "@/components/admin/stats/AdminEstadisticasTab";
import AdminCategoriasTab from "@/components/admin/categories/AdminCategoriasTab";
import IncidentModal from "@/components/map/IncidentModal";
import AdminUsuariosTab from "@/components/admin/usuarios/AdminUsuariosTab";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AdminDashboard({ dbRole }) {
  const [activeTab, setActiveTab] = useState("incidentes");
  const [reportOpen, setReportOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { incidents, loading, refresh } = useAllIncidents();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Sidebar desktop (oculto en mobile) ── */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} dbRole={dbRole} />
      </div>

      {/* ── Sidebar mobile via Sheet (slide desde izquierda) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 w-64 bg-sidebar border-0"
        >
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            dbRole={dbRole}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Columna derecha ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        <AdminTopbar dbRole={dbRole} onMobileMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="max-w-6xl mx-auto px-6 py-6">

            {/* Visible para admin y superAdmin */}
            {activeTab === "incidentes" && (
              <AdminIncidentesTab
                incidents={incidents}
                loading={loading}
                onUpdated={refresh}
                onNuevoReporte={() => setReportOpen(true)}
              />
            )}

            {/* Visible para admin y superAdmin */}
            {activeTab === "estadisticas" && (
              <AdminEstadisticasTab incidents={incidents} loading={loading} />
            )}

            {/* EXCLUSIVO SUPERADMIN */}
            {activeTab === "categorias" && dbRole === "superAdmin" && (
              <AdminCategoriasTab dbRole={dbRole} />
            )}

            {/* EXCLUSIVO SUPERADMIN */}
            {activeTab === "usuarios" && dbRole === "superAdmin" && (
              <AdminUsuariosTab />
            )}

          </div>
        </main>
      </div>

      <IncidentModal open={reportOpen} onOpenChange={setReportOpen} onCreated={refresh} />
    </div>
  );
}
