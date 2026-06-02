import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminIncidentRow from "./AdminIncidentRow";
import AdminIncidentCard from "./AdminIncidentCard";
import IncidentSkeleton from "@/components/home/IncidentSkeleton";
import { EmptyState } from "@/components/home/IncidentCard";

export default function AdminIncidentList({ incidents, loading, onUpdated }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => <IncidentSkeleton key={i} />)}
      </div>
    );
  }

  if (!incidents.length) {
    return <EmptyState message="No hay incidentes para mostrar." />;
  }

  return (
    <>
      {/* ── DESKTOP: Data Table ── */}
      <div className="hidden md:block rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-slate-50/60 border-b border-gray-100">
              <TableHead className="pl-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Incidente
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Categoría
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Prioridad
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Estado
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Fecha
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((inc) => (
              <AdminIncidentRow key={inc._id} incident={inc} onUpdated={onUpdated} />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── MOBILE: Cards simplificadas ── */}
      <div className="md:hidden flex flex-col gap-2.5">
        {incidents.map((inc) => (
          <AdminIncidentCard key={inc._id} incident={inc} onUpdated={onUpdated} />
        ))}
      </div>
    </>
  );
}
