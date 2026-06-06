import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STATUS_KEYS, capitalize } from "@/lib/incidents";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Legend,
} from "recharts";
import AdminHeatmapView from "./AdminHeatmapView";

// ── Paleta de colores de marca para los gráficos ──
const BRAND_COLORS = ["#5C3F99", "#7C5CBF", "#9B7DD4", "#6B4FA8", "#4C3080", "#A889CC", "#C4B8E0", "#8B6FC0"];

// ── KPI Card ──
function KpiCard({ label, value, accent = "text-slate-900", loading }) {
  if (loading) {
    return (
      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="h-3 w-20 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Tooltip personalizado para BarChart ──
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-bold text-slate-900">{payload[0].value} reporte{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Tooltip personalizado para PieChart ──
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-900">{payload[0].name}</p>
      <p className="text-slate-500">{payload[0].value} reporte{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

export default function AdminEstadisticasTab({ incidents, loading }) {
  // ── Métricas KPI (lógica original intacta) ──
  const total      = incidents.length;
  const resueltos  = incidents.filter((i) => i.status?.name === STATUS_KEYS.RESOLVED).length;
  const enProceso  = incidents.filter((i) => i.status?.name === STATUS_KEYS.IN_PROCESS).length;
  const rechazados = incidents.filter((i) => i.status?.name === STATUS_KEYS.REJECTED).length;
  const eficiencia = total > 0 ? Math.round((resueltos / total) * 100) : 0;

  // ── Distribución por categoría (lógica original intacta) ──
  const byCategory = useMemo(() => (
    incidents.reduce((acc, inc) => {
      const name = capitalize(inc.category?.name ?? "Sin categoría");
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {})
  ), [incidents]);

  // ── Tendencia: últimos 8 días ──
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label   = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      const count   = incidents.filter((inc) => new Date(inc.createdAt).toDateString() === dateStr).length;
      days.push({ dia: label, reportes: count });
    }
    return days;
  }, [incidents]);

  // ── Top categorías para PieChart ──
  const categoryData = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value], i) => ({ name, value, fill: BRAND_COLORS[i % BRAND_COLORS.length] }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-5">
        Panel de Estadísticas Municipales
      </h1>

      <Tabs defaultValue="metricas">

        <TabsList className="mb-6">
          <TabsTrigger value="metricas">Métricas Generales</TabsTrigger>
          <TabsTrigger value="mapa">Mapa de Calor Urbano</TabsTrigger>
        </TabsList>

        {/* ══ Tab 1: Métricas Generales ══ */}
        <TabsContent value="metricas">

          {/* ── Fila KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard label="Total Reportes"  value={total}              accent="text-slate-900"   loading={loading} />
            <KpiCard label="En Proceso"      value={enProceso}          accent="text-celestito"   loading={loading} />
            <KpiCard label="Resueltos"       value={resueltos}          accent="text-emerald-600" loading={loading} />
            <KpiCard label="Eficiencia"      value={`${eficiencia}%`}   accent="text-primary"     loading={loading} />
          </div>

          {/* ── Grilla de gráficos ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Gráfico 1: Tendencia últimos 8 días ── */}
            <Card className="border-slate-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Actividad reciente</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reportes ingresados por día</p>
                </div>
                <div className="h-72">
                  {loading ? (
                    <div className="h-full bg-slate-50 rounded-xl animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="dia"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc" }} />
                        <Bar dataKey="reportes" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Gráfico 2: Distribución por categoría ── */}
            <Card className="border-slate-200/80 shadow-sm">
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Distribución por categoría</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tipos de incidentes más frecuentes</p>
                </div>
                <div className="h-72">
                  {loading || categoryData.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-slate-400">
                        {loading ? "Cargando..." : "Sin datos suficientes"}
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="42%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        />
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>
                          )}
                          wrapperStyle={{ paddingTop: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── Estado general (si hay rechazados) ── */}
          {!loading && rechazados > 0 && (
            <Card className="border-slate-200/80 shadow-sm mt-6">
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-slate-900 mb-1">Estado general</p>
                <p className="text-xs text-slate-400 mb-4">Distribución completa de estados activos</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Pendientes",  value: incidents.filter(i => i.status?.name === STATUS_KEYS.PENDING).length,    color: "bg-amber-50 text-amber-700 border-amber-200"          },
                    { label: "En proceso",  value: enProceso,                                                                color: "bg-blanquito/20 text-azul-oscuro border-blanquito/50"  },
                    { label: "Resueltos",   value: resueltos,                                                                color: "bg-emerald-50 text-emerald-700 border-emerald-200"     },
                    { label: "Rechazados",  value: rechazados,                                                               color: "bg-rose-50 text-rose-700 border-rose-200"              },
                    { label: "Cancelados",  value: incidents.filter(i => i.status?.name === STATUS_KEYS.CANCELLED).length,  color: "bg-gray-50 text-gray-500 border-gray-200"              },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${color}`}>
                      <span className="font-bold text-base">{value}</span>
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* ══ Tab 2: Mapa de Calor Urbano ══ */}
        <TabsContent value="mapa">
          <AdminHeatmapView incidents={incidents} loading={loading} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
