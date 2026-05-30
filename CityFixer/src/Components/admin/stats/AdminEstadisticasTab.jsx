import { Card, CardContent } from "@/components/ui/card";
import { STATUS_STYLES, STATUS_LABELS, STATUS_KEYS, capitalize } from "@/lib/incidents";

function KpiCard({ label, value, loading, style }) {
  if (loading) {
    return (
      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="h-8 w-12 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-gray-100 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4">
        <p className={`text-2xl font-bold ${style?.text ?? "text-azul-oscuro"}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminEstadisticasTab({ incidents, loading }) {
  const total = incidents.length;

  const byStatus = [
    STATUS_KEYS.PENDING,
    STATUS_KEYS.IN_PROCESS,
    STATUS_KEYS.RESOLVED,
    STATUS_KEYS.REJECTED,
  ].map((key) => ({
    key,
    label: STATUS_LABELS[key],
    value: incidents.filter((i) => i.status?.name === key).length,
    style: STATUS_STYLES[key],
  }));

  const byCategory = incidents.reduce((acc, inc) => {
    const name = capitalize(inc.category?.name ?? "Sin categoría");
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">General</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <KpiCard label="Total" value={total} loading={loading} />
          {byStatus.map(({ key, label, value, style }) => (
            <KpiCard key={key} label={label} value={value} loading={loading} style={style} />
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Por categoría</p>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => <KpiCard key={i} loading />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(byCategory).map(([name, count]) => (
              <KpiCard key={name} label={name} value={count} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
