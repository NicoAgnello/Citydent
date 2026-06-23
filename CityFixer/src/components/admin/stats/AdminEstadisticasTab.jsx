// Tab de estadísticas del panel admin.
// Contiene:
//   - 4 tarjetas KPI: total de reportes, activos, resueltos, tasa de resolución
//   - Gráfico de barras de reportes por categoría (Recharts)
//   - Gráfico de barras de reportes por estado (Recharts)
//   - Vista de mapa de calor (AdminHeatmapView) accesible por tab
//   - Botón "Exportar a Power BI" con flujo OTP (envía código por email, tiene cooldown de 5 min)
//
// No recibe los incidentes por prop — los deriva de la lista completa que viene de AdminDashboard
// a través de useAllIncidents, pasados como prop.
//
// Props:
//   incidents    → array de todos los incidentes
//   onTabChange  → función que recibe un tab id, para que el heatmap pueda navegar a incidentes
//   onFocusIncident → función que recibe un id de incidente, para focalizarlo desde el heatmap
//
// Se usa en AdminDashboard.jsx como contenido del tab "estadisticas".
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STATUS_KEYS, capitalize } from "@/lib/incidents";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import AdminHeatmapView from "./AdminHeatmapView";
import { requestPowerBiOtp } from "@/services/api";
import { Zap, Loader2, CheckCircle2, Clock, FileText, AlertTriangle, Activity } from "lucide-react";

const FINAL = new Set([STATUS_KEYS.RESOLVED, STATUS_KEYS.REJECTED, STATUS_KEYS.CANCELLED]);
const COOLDOWN_MS  = 5 * 60 * 1000;

// ── Tooltips ──────────────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-bold text-slate-900">{payload[0].value} reporte{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

function CategoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="text-slate-500 mb-0.5">{label}</p>
      <p className="font-bold text-slate-900">{payload[0].value} grupo{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent = "text-slate-900", loading, icon: Icon, sub }) {
  if (loading) {
    return (
      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="h-10 w-16 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-9 w-9 bg-slate-100 rounded-xl animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-2.5 w-32 bg-slate-50 rounded-full animate-pulse" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between mb-2">
          <p className={`text-4xl font-bold tracking-tight leading-none ${accent}`}>{value ?? "—"}</p>
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-slate-400" />
            </div>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminEstadisticasTab({ incidents, loading, dbRole, onTabChange, onFocusIncident }) {

  // ── Power BI OTP ──────────────────────────────────────────────────────────
  const [otpLoading,    setOtpLoading]    = useState(false);
  const [otpSent,       setOtpSent]       = useState(false);
  const [otpError,      setOtpError]      = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [remaining,     setRemaining]     = useState(0);

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (secs <= 0) { setCooldownUntil(null); setRemaining(0); clearInterval(interval); }
      else setRemaining(secs);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleRequestOtp = async () => {
    setOtpLoading(true); setOtpError(null); setOtpSent(false);
    try {
      await requestPowerBiOtp();
      setOtpSent(true);
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setRemaining(300);
    } catch (err) {
      setOtpError(err.response?.data?.error ?? "No se pudo generar el código.");
    } finally {
      setOtpLoading(false);
    }
  };

  const isCoolingDown = cooldownUntil && Date.now() < cooldownUntil;
  const cooldownLabel = isCoolingDown
    ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
    : null;

  // ── KPI: reportes activos (suma de incidents.length en grupos no finalizados) ──
  const reportesActivos = useMemo(
    () => incidents
      .filter(g => !g.isArchived && !FINAL.has(g.status?.name))
      .reduce((s, g) => s + (g.incidents?.length ?? 1), 0),
    [incidents],
  );

  // ── KPI: incidentes críticos (grupos activos con prioridad 7-10) ──────────
  const incidentesCriticos = useMemo(
    () => incidents.filter(g => !g.isArchived && !FINAL.has(g.status?.name) && g.priority >= 7).length,
    [incidents],
  );

  // ── KPI: pendientes sin atender (grupos activos que nadie tocó todavía) ───
  const pendientesSinAtender = useMemo(
    () => incidents.filter(g => !g.isArchived && g.status?.name === STATUS_KEYS.PENDING).length,
    [incidents],
  );

  // ── KPI: grupos activos (no archivados, no finalizados) ───────────────────
  const gruposActivos = useMemo(
    () => incidents.filter(g => !g.isArchived && !FINAL.has(g.status?.name)).length,
    [incidents],
  );

  // ── Tendencia: reportes ciudadanos por día (últimos 8 días) ───────────────
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label   = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      const grupos  = incidents.filter(g => new Date(g.createdAt).toDateString() === dateStr);
      const reportes = grupos.reduce((sum, g) => sum + (g.incidents?.length ?? 1), 0);
      days.push({ dia: label, reportes });
    }
    return days;
  }, [incidents]);

  // ── Distribución por prioridad (grupos activos, barras horizontales) ──────
  const priorityBuckets = useMemo(() => [
    { label: "Muy baja", min: 1,  max: 2,  bar: "bg-green-400",  text: "text-green-700"  },
    { label: "Baja",     min: 3,  max: 4,  bar: "bg-lime-400",   text: "text-lime-700"   },
    { label: "Media",    min: 5,  max: 6,  bar: "bg-amber-400",  text: "text-amber-700"  },
    { label: "Alta",     min: 7,  max: 8,  bar: "bg-orange-500", text: "text-orange-700" },
    { label: "Crítica",  min: 9,  max: 10, bar: "bg-red-500",    text: "text-red-700"    },
  ].map(b => ({
    ...b,
    count: incidents.filter(g =>
      !FINAL.has(g.status?.name) && g.priority >= b.min && g.priority <= b.max
    ).length,
  })), [incidents]);

  const maxPriCount = Math.max(...priorityBuckets.map(b => b.count), 1);

  // ── Pipeline de estados ───────────────────────────────────────────────────
  const pipeline = useMemo(() => {
    const active = incidents.filter(g => !g.isArchived);
    return [
      { label: "Pendiente",  key: STATUS_KEYS.PENDING,    color: "text-amber-600",   bar: "bg-amber-400"   },
      { label: "Aceptado",   key: STATUS_KEYS.ACCEPTED,   color: "text-teal-600",    bar: "bg-teal-400"    },
      { label: "En proceso", key: STATUS_KEYS.IN_PROCESS, color: "text-indigo-600",  bar: "bg-indigo-400"  },
      { label: "Resuelto",   key: STATUS_KEYS.RESOLVED,   color: "text-emerald-600", bar: "bg-emerald-400", all: true },
    ].map(s => ({
      ...s,
      count: (s.all ? incidents : active).filter(g => g.status?.name === s.key).length,
    }));
  }, [incidents]);

  const pipelineTotal = useMemo(() => pipeline.reduce((sum, s) => sum + s.count, 0), [pipeline]);

  // ── Ranking de barrios por grupos activos ────────────────────────────────
  const barrioData = useMemo(() => {
    const map = {};
    for (const g of incidents) {
      if (g.isArchived || FINAL.has(g.status?.name)) continue;
      const name = g.neighborhood?.name ?? "Sin barrio";
      map[name] = (map[name] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  const maxBarrioCount = Math.max(...barrioData.map(([, v]) => v), 1);

  // ── Distribución por categoría ────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map = incidents.reduce((acc, g) => {
      const name = capitalize(g.category?.name ?? "Sin categoría");
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [incidents]);

  // ─────────────────────────────────────────────────────────────────────────
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

        {/* ══ Tab 1: Métricas Generales ══════════════════════════════════════ */}
        <TabsContent value="metricas">

          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start">
            <KpiCard
              label="Reportes activos"
              value={reportesActivos}
              accent="text-slate-900"
              icon={FileText}
              sub="en grupos no finalizados"
              loading={loading}
            />
            <KpiCard
              label="Incidentes críticos"
              value={incidentesCriticos}
              accent={incidentesCriticos > 0 ? "text-orange-600" : "text-slate-900"}
              icon={AlertTriangle}
              sub="prioridad alta o crítica"
              loading={loading}
            />
            <KpiCard
              label="Pendientes sin atender"
              value={pendientesSinAtender}
              accent={pendientesSinAtender > 0 ? "text-amber-600" : "text-slate-900"}
              icon={Clock}
              sub="sin primera respuesta aún"
              loading={loading}
            />
            <KpiCard
              label="Grupos activos"
              value={gruposActivos}
              accent="text-primary"
              icon={Activity}
              sub="sin resolver ni archivar"
              loading={loading}
            />
          </div>

          {/* ── Row 1: Tendencia + Prioridad ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">

            <Card className="border-slate-200/80 shadow-sm py-0 ">
              <CardContent className="p-5 ">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Actividad ciudadana reciente</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reportes individuales ingresados por día</p>
                </div>
                <div className="h-52">
                  {loading ? (
                    <div className="h-full bg-slate-50 rounded-xl animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={trendData} barSize={24} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc" }} />
                        <Bar dataKey="reportes" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm py-0" >
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Distribución por prioridad</p>
                  <p className="text-xs text-slate-400 mt-0.5">Grupos activos sin finalizar</p>
                </div>
                {loading ? (
                  <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
                ) : (
                  <div className="flex flex-col gap-3.5 mt-3">
                    {priorityBuckets.map(b => (
                      <div key={b.label} className="flex items-center gap-3">
                        <span className={`text-[11px] font-semibold w-14 shrink-0 ${b.text}`}>{b.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${b.bar}`}
                            style={{ width: `${(b.count / maxPriCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-6 text-right shrink-0">{b.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── Row 2: Barrios + Pipeline ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            <Card className="border-slate-200/80 shadow-sm py-0">
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Problemas por barrio</p>
                  <p className="text-xs text-slate-400 mt-0.5">Grupos activos sin finalizar por barrio</p>
                </div>
                {loading ? (
                  <div className="flex flex-col gap-3">
                    {[0,1,2,3,4].map(i => <div key={i} className="h-6 bg-slate-50 rounded-lg animate-pulse" />)}
                  </div>
                ) : barrioData.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No hay grupos activos</p>
                ) : (
                  <div className="flex flex-col gap-3.5 mt-1">
                    {barrioData.map(([name, count], i) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0">#{i + 1}</span>
                        <span className="text-[11px] font-semibold text-slate-700 w-28 shrink-0 truncate">{name}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(count / maxBarrioCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-5 text-right shrink-0">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-sm py-0">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">Pipeline de estados</p>
                  <p className="text-xs text-slate-400 mt-0.5">Flujo actual de grupos activos</p>
                </div>
                {loading ? (
                  <div className="flex-1 bg-slate-50 rounded-xl animate-pulse" />
                ) : (
                  <>
                    <div className="flex-1 flex flex-col justify-center gap-5">
                      <div className="h-9 w-full rounded-full overflow-hidden flex bg-slate-100">
                        {pipelineTotal > 0 && pipeline.map(s => s.count > 0 && (
                          <div
                            key={s.key}
                            className={`h-full ${s.bar}`}
                            style={{ width: `${(s.count / pipelineTotal) * 100}%` }}
                            title={`${s.label}: ${s.count}`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {pipeline.map(s => (
                          <div key={s.key} className="flex items-center gap-2 min-w-0">
                            <span className={`size-2.5 rounded-full shrink-0 ${s.bar}`} />
                            <span className="text-[11px] text-slate-500 truncate">{s.label}</span>
                            <span className={`text-[11px] font-bold ml-auto ${s.color}`}>{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Total: <span className="font-semibold text-slate-700">{incidents.length}</span></span>
                      <span>Archivados: <span className="font-semibold text-slate-700">{incidents.filter(g => g.isArchived).length}</span></span>
                      <span>Rechazados: <span className="font-semibold text-slate-700">{incidents.filter(g => g.status?.name === STATUS_KEYS.REJECTED).length}</span></span>
                      <span>Cancelados: <span className="font-semibold text-slate-700">{incidents.filter(g => g.status?.name === STATUS_KEYS.CANCELLED).length}</span></span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ── Row 3: Distribución por categoría ── */}
          <Card className="border-slate-200/80 shadow-sm mb-6 py-0">
            <CardContent className="p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Distribución por categoría</p>
                <p className="text-xs text-slate-400 mt-0.5">Tipos de problemas más frecuentes</p>
              </div>
              <div style={{ height: loading || categoryData.length === 0 ? 256 : Math.max(220, categoryData.length * 40) }}>
                {loading || categoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-slate-400">{loading ? "Cargando..." : "Sin datos suficientes"}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      barSize={16}
                      margin={{ top: 2, right: 16, left: 4, bottom: 2 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CategoryTooltip />} cursor={{ fill: "#f8fafc" }} />
                      <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Power BI — solo superAdmin ── */}
          {dbRole === "superAdmin" && (
            <Card className="border-slate-200/80 shadow-sm py-0">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Zap size={14} className="text-violet-500" />
                      Acceso externo — Power BI
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Generá un código OTP para conectar Power BI a los datos de CityFixer.
                      Ingresalo en el header{" "}
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-600">
                        x-otp-code
                      </code>{" "}
                      de tu reporte. Expira en 5 minutos.
                    </p>
                  </div>
                  <button
                    onClick={handleRequestOtp}
                    disabled={otpLoading || isCoolingDown}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {otpLoading
                      ? <><Loader2 size={14} className="animate-spin" /> Generando...</>
                      : isCoolingDown
                        ? `Reenviar en ${cooldownLabel}`
                        : <><Zap size={14} /> Generar acceso</>
                    }
                  </button>
                </div>
                {otpSent && (
                  <div className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                    <p className="text-xs text-emerald-700 leading-snug">
                      Código enviado a tu correo. Ingresalo en el header{" "}
                      <code className="font-mono font-semibold">x-otp-code</code>{" "}
                      de Power BI. Expira en 5 minutos.
                    </p>
                  </div>
                )}
                {otpError && (
                  <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                    {otpError}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* ══ Tab 2: Mapa de Calor Urbano ════════════════════════════════════ */}
        <TabsContent value="mapa">
          <AdminHeatmapView
            incidents={incidents}
            loading={loading}
            onTabChange={onTabChange}
            onFocusIncident={onFocusIncident}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}
