// Tab de estadísticas del panel admin.
// Todo en una sola pantalla, de arriba hacia abajo:
//   - 4 tarjetas KPI: reportes recibidos y resueltos (con tendencia contra los 30 días
//     anteriores), críticos abiertos y pendientes sin atender (estado actual)
//   - Mapa de calor (AdminHeatmapView) en un panel grande
//   - Actividad reciente, prioridad, barrios, pipeline de estados y categorías
//   - Botón "Acceso externo — Power BI" con flujo OTP (envía código por email, tiene cooldown de 5 min)
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
import { STATUS_KEYS, capitalize } from "@/lib/incidents";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import AdminHeatmapView from "./AdminHeatmapView";
import { requestPowerBiOtp } from "@/services/api";
import { Zap, Loader2, CheckCircle2, Clock, Inbox, CheckCheck, Flame, ChevronLeft, ChevronRight, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";

const FINAL = new Set([STATUS_KEYS.RESOLVED, STATUS_KEYS.REJECTED, STATUS_KEYS.CANCELLED]);
const COOLDOWN_MS  = 5 * 60 * 1000;
const TREND_WINDOW_DAYS = 8; // cantidad de días que muestra el gráfico de actividad reciente
const KPI_PERIOD_DAYS   = 30; // período de las tarjetas con tendencia (se compara con los 30 anteriores)
const DAY_MS = 24 * 60 * 60 * 1000;

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
// `delta` es opcional: { current, previous, goodWhenUp } compara dos períodos.
// goodWhenUp = true pinta de verde la suba (ej. resueltos); false la deja neutra
// (ej. reportes recibidos: que suban no es ni bueno ni malo por sí solo).
function Delta({ current, previous, goodWhenUp }) {
  if (current === 0 && previous === 0) {
    return <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Minus size={12} /> Sin actividad</span>;
  }
  if (previous === 0) {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600"><TrendingUp size={12} /> Nuevo en este período</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Minus size={12} /> Igual que antes</span>;
  }
  const up = pct > 0;
  const tone = up ? (goodWhenUp ? "text-emerald-600" : "text-slate-600") : (goodWhenUp ? "text-rose-500" : "text-slate-600");
  const Arrow = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <Arrow size={12} /> {up ? "+" : ""}{pct}%
    </span>
  );
}

function KpiCard({ label, value, loading, icon: Icon, tone, sub, delta }) {
  if (loading) {
    return (
      <Card className="border-slate-200/80 shadow-sm">
        <CardContent className="p-5 flex flex-col gap-3">
          <div className="h-9 w-9 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded-full animate-pulse" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-slate-200/80 shadow-sm py-0">
      <CardContent className="p-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon size={18} />
        </div>
        <p className="mt-4 text-4xl font-bold tracking-tight leading-none text-slate-900">{value ?? "—"}</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{label}</p>
        <div className="mt-1 flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
          {delta && <Delta {...delta} />}
          <span>{sub}</span>
        </div>
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

  // ── KPIs de período: recibidos y resueltos, 30 días contra los 30 anteriores ──
  // El período termina en el último dato disponible (igual que el gráfico de actividad),
  // no en "hoy", para que no queden en cero si los datos no llegan hasta la fecha actual.
  const periodEnd = useMemo(() => {
    const maxTs = incidents.reduce((max, g) => {
      const t = new Date(g.createdAt).getTime();
      return Number.isFinite(t) && t > max ? t : max;
    }, 0);
    return maxTs > 0 ? maxTs : Date.now();
  }, [incidents]);

  const periods = useMemo(() => {
    const span = KPI_PERIOD_DAYS * DAY_MS;
    const inCurrent  = (t) => t > periodEnd - span && t <= periodEnd;
    const inPrevious = (t) => t > periodEnd - 2 * span && t <= periodEnd - span;
    // Fecha en que se resolvió un grupo: finalizedAt, o el último cambio de estado.
    const resolvedAt = (g) => new Date(g.finalizedAt ?? g.statusHistory?.[g.statusHistory.length - 1]?.changedAt ?? NaN).getTime();

    const received = { current: 0, previous: 0 };
    const resolved = { current: 0, previous: 0 };
    for (const g of incidents) {
      const created = new Date(g.createdAt).getTime();
      const n = g.incidents?.length ?? 1;
      if (inCurrent(created))  received.current  += n;
      if (inPrevious(created)) received.previous += n;
      if (g.status?.name === STATUS_KEYS.RESOLVED) {
        const r = resolvedAt(g);
        if (inCurrent(r))  resolved.current++;
        if (inPrevious(r)) resolved.previous++;
      }
    }
    return { received, resolved };
  }, [incidents, periodEnd]);

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

  // ── Grupos activos (no archivados, no finalizados): va en el pie del pipeline ──
  const gruposActivos = useMemo(
    () => incidents.filter(g => !g.isArchived && !FINAL.has(g.status?.name)).length,
    [incidents],
  );

  // ── Tendencia: reportes ciudadanos por día (ventana de 8 días navegable) ──
  // Por defecto la ventana termina en la fecha del incidente más reciente
  // (no necesariamente "hoy"), para no mostrar un gráfico vacío cuando los
  // datos no llegan hasta la fecha actual. `trendEndOverride` !== null cuando
  // el usuario navegó manualmente con las flechas o el botón "Hoy".
  const [trendEndOverride, setTrendEndOverride] = useState(null);

  const trendLatestDataDate = useMemo(() => {
    if (!incidents.length) return new Date();
    const maxTs = incidents.reduce((max, g) => {
      const t = new Date(g.createdAt).getTime();
      return Number.isFinite(t) && t > max ? t : max;
    }, 0);
    return maxTs > 0 ? new Date(maxTs) : new Date();
  }, [incidents]);

  const trendEnd   = trendEndOverride ?? trendLatestDataDate;
  const isAutoTrendWindow = trendEndOverride === null;

  const shiftTrendWindow = (deltaWindows) => {
    setTrendEndOverride(prev => {
      const base = new Date(prev ?? trendLatestDataDate);
      base.setDate(base.getDate() + deltaWindows * TREND_WINDOW_DAYS);
      return base;
    });
  };

  const trendData = useMemo(() => {
    const days = [];
    for (let i = TREND_WINDOW_DAYS - 1; i >= 0; i--) {
      const d = new Date(trendEnd);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label   = d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      const grupos  = incidents.filter(g => new Date(g.createdAt).toDateString() === dateStr);
      const reportes = grupos.reduce((sum, g) => sum + (g.incidents?.length ?? 1), 0);
      days.push({ dia: label, reportes });
    }
    return days;
  }, [incidents, trendEnd]);

  const trendStart = useMemo(() => {
    const d = new Date(trendEnd);
    d.setDate(d.getDate() - (TREND_WINDOW_DAYS - 1));
    return d;
  }, [trendEnd]);

  const trendRangeLabel = useMemo(() => {
    const opts = { day: "numeric", month: "short" };
    const sameYear = trendStart.getFullYear() === trendEnd.getFullYear();
    const startLabel = trendStart.toLocaleDateString("es-AR", sameYear ? opts : { ...opts, year: "numeric" });
    const endLabel   = trendEnd.toLocaleDateString("es-AR", { ...opts, year: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }, [trendStart, trendEnd]);

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
      { label: "En proceso", key: STATUS_KEYS.IN_PROCESS, color: "text-brand-mid",   bar: "bg-brand-mid"   },
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

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Reportes recibidos"
          value={periods.received.current}
          icon={Inbox}
          tone="bg-brand-light/30 text-brand"
          sub={`vs. ${KPI_PERIOD_DAYS} días previos`}
          delta={{ ...periods.received, goodWhenUp: false }}
          loading={loading}
        />
        <KpiCard
          label="Grupos resueltos"
          value={periods.resolved.current}
          icon={CheckCheck}
          tone="bg-emerald-50 text-emerald-600"
          sub={`vs. ${KPI_PERIOD_DAYS} días previos`}
          delta={{ ...periods.resolved, goodWhenUp: true }}
          loading={loading}
        />
        <KpiCard
          label="Críticos abiertos"
          value={incidentesCriticos}
          icon={Flame}
          tone="bg-red-50 text-red-600"
          sub="prioridad 7 o más, sin finalizar"
          loading={loading}
        />
        <KpiCard
          label="Pendientes sin atender"
          value={pendientesSinAtender}
          icon={Clock}
          tone="bg-amber-50 text-amber-600"
          sub="sin primera respuesta"
          loading={loading}
        />
      </div>
      <p className="-mt-3 mb-6 text-[11px] text-slate-400">
        Recibidos y resueltos cuentan los {KPI_PERIOD_DAYS} días hasta el último dato disponible
        ({new Date(periodEnd).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}).
      </p>

      {/* ── Mapa de calor: panel grande, siempre a la vista ── */}
      <div className="mb-6">
        <AdminHeatmapView
          incidents={incidents}
          loading={loading}
          onTabChange={onTabChange}
          onFocusIncident={onFocusIncident}
          heightClass="h-[420px] lg:h-[580px]"
        />
      </div>

          {/* ── Row 1: Tendencia + Prioridad ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">

            <Card className="border-slate-200/80 shadow-sm py-0 ">
              <CardContent className="p-5 ">
                <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Actividad ciudadana reciente</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reportes individuales por día · <span className="font-semibold text-slate-500">{trendRangeLabel}</span>
                      {isAutoTrendWindow && <span className="text-slate-300"> (últimos con datos)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isAutoTrendWindow && (
                      <button
                        type="button"
                        onClick={() => setTrendEndOverride(null)}
                        title="Volver a los últimos días con datos"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => shiftTrendWindow(-1)}
                      title="Período anterior"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftTrendWindow(1)}
                      title="Período siguiente"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
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
                  <div className="flex flex-col gap-3.5 mt-1 max-h-44 overflow-y-auto pr-1">
                    {barrioData.map(([name, count], i) => (
                      <div key={name} className="flex items-center gap-3 shrink-0">
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
                      <span>Activos: <span className="font-semibold text-slate-700">{gruposActivos}</span></span>
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
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {/* La categoría más frecuente resalta con el violeta de marca; el resto va más suave */}
                        {categoryData.map((c, i) => (
                          <Cell key={c.name} fill={i === 0 ? "var(--color-brand)" : "#A895DD"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Power BI — admin y superAdmin ── */}
          {(dbRole === "admin" || dbRole === "superAdmin") && (
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

    </div>
  );
}
