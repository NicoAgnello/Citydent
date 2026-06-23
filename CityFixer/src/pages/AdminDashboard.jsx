// ─── AdminDashboard ───────────────────────────────────────────────────────────
//
// Panel de administración. Accesible para roles "admin" y "superAdmin".
// Se monta en la ruta /admin.
//
// Layout:
//   ┌──────────┬──────────────────────────────────────┐
//   │          │           AdminTopbar                 │
//   │ Sidebar  ├──────────────────────────────────────┤
//   │ (desktop)│                                      │
//   │          │     Contenido del tab activo         │
//   │          │                                      │
//   └──────────┴──────────────────────────────────────┘
//   En mobile el sidebar se oculta y se abre con un botón (Sheet lateral).
//
// Tabs disponibles:
//   "incidentes"  → lista y gestión de todos los incidentes (admin + superAdmin)
//   "estadisticas"→ gráficos y mapa de calor + acceso a Power BI (admin + superAdmin)
//   "categorias"  → gestión de categorías de incidentes (SOLO superAdmin)
//   "usuarios"    → gestión de usuarios y roles (SOLO superAdmin)
//
// focusedIncidentId:
//   Permite que el buscador del Topbar haga foco en un incidente específico
//   dentro de la tabla. Cuando el admin selecciona un resultado de búsqueda,
//   se guarda su ID acá y AdminIncidentesTab lo usa para resaltarlo y scrollear.

import { useState } from "react";
import { useAllIncidents } from "@/hooks/useAllIncidents";
import { useNotifications } from "@/hooks/useNotifications";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminIncidentesTab from "@/components/admin/incidents/AdminIncidentesTab";
import AdminEstadisticasTab from "@/components/admin/stats/AdminEstadisticasTab";
import AdminCategoriasTab from "@/components/admin/categories/AdminCategoriasTab";
import IncidentModal from "@/components/map/IncidentModal";
import AdminUsuariosTab from "@/components/admin/usuarios/AdminUsuariosTab";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AdminDashboard({ dbRole }) {
  const [activeTab, setActiveTab]               = useState("incidentes");
  const [reportOpen, setReportOpen]             = useState(false);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [focusedIncidentId, setFocusedIncidentId] = useState(null);
  const { groups, loading, refresh } = useAllIncidents();

  // Filtra las emergencias activas para mostrar alertas en el Topbar.
  const notifications = useNotifications(groups);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* Sidebar fijo, visible solo en pantallas grandes (lg+) */}
      <div className="hidden lg:flex h-full w-64 shrink-0">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} dbRole={dbRole} />
      </div>

      {/* Sidebar mobile: se desliza desde la izquierda al tocar el botón de menú */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 !w-64 bg-sidebar border-0"
        >
          <AdminSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            dbRole={dbRole}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Columna derecha: topbar + contenido del tab */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        <AdminTopbar
          dbRole={dbRole}
          onMobileMenuOpen={() => setMobileOpen(true)}
          incidents={groups}
          notifications={notifications}
          onTabChange={setActiveTab}
          onFocusIncident={setFocusedIncidentId}
        />

        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <div className="max-w-6xl mx-auto px-6 py-6">

            {/* Visible para admin y superAdmin */}
            {activeTab === "incidentes" && (
              <AdminIncidentesTab
                incidents={groups}
                loading={loading}
                onUpdated={refresh}
                onNuevoReporte={() => setReportOpen(true)}
                focusedIncidentId={focusedIncidentId}
                onClearFocus={() => setFocusedIncidentId(null)}
              />
            )}

            {/* Visible para admin y superAdmin */}
            {activeTab === "estadisticas" && (
              <AdminEstadisticasTab
                incidents={groups}
                loading={loading}
                dbRole={dbRole}
                onTabChange={setActiveTab}
                onFocusIncident={setFocusedIncidentId}
              />
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

      {/* Modal para crear un incidente desde el panel admin */}
      <IncidentModal open={reportOpen} onOpenChange={setReportOpen} onCreated={refresh} />
    </div>
  );
}
