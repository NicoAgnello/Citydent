// Panel de acciones administrativas para un incidente.
// Permite al admin cambiar el estado (con diálogo de confirmación) y la categoría.
// La lista de estados disponibles viene de useStatuses y filtra los inválidos según
// el estado actual (por ejemplo, no se puede pasar de "resuelto" a "pendiente").
// Si el incidente está archivado (isReadOnly), muestra un aviso y bloquea los cambios.
//
// Props:
//   incident  → objeto de incidente (para obtener estado actual, id, etc.)
//   onUpdated → función sin argumentos, recarga el incidente tras cambiar estado/categoría
//
// Se usa dentro de IncidentDetailSheet cuando se monta en el contexto admin
// (AdminIncidentCard y AdminIncidentRow pasan isAdmin=true a IncidentDetailSheet).
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStatuses } from "@/hooks/useStatuses";
import { getCategorias, updateIncidentStatus, updateIncidentCategory } from "@/services/api";
import { STATUS_LABELS, capitalize, getStatusStyle } from "@/lib/incidents";

function StatusConfirmDialog({ targetStatus, open, onOpenChange, onConfirm, loading }) {
  if (!targetStatus) return null;
  const style = getStatusStyle(targetStatus.name);
  const label = STATUS_LABELS[targetStatus.name] ?? capitalize(targetStatus.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-brand-dark">Confirmar cambio de estado</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mt-1">
          ¿Cambiar el estado a{" "}
          <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${style.bg} ${style.text}`}>
            {label}
          </span>
          ?
        </p>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-brand-dark hover:bg-brand text-white rounded-xl"
          >
            {loading && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TRANSITIONS = {
  pendiente:  ["aceptado", "rechazado"],
  aceptado:   ["en_proceso", "rechazado"],
  en_proceso: ["resuelto", "rechazado"],
  resuelto:   [],
  rechazado:  [],
  cancelado:  [],
};

export default function IncidentAdminActions({ incident, onUpdated }) {
  const { statuses } = useStatuses();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(incident.category?._id ?? "");
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);

  const currentStatus = incident.status?.name;
  const allowed = TRANSITIONS[currentStatus] ?? [];
  const isFinal = allowed.length === 0;
  const isDubious = incident.representativeId?.is_dubious ?? false;
  const visibleStatuses = statuses.filter((s) => allowed.includes(s.name));

  useEffect(() => {
    getCategorias()
      .then(({ data }) => setCategories(data.categories ?? []))
      .catch(() => {});
  }, []);

  const handleStatusConfirm = async () => {
    if (!confirmStatus) return;
    setLoadingStatus(true);
    try {
      await updateIncidentStatus(incident._id, confirmStatus._id);
      onUpdated?.();
      setConfirmStatus(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.error("El grupo ya se encuentra en un estado final y no puede modificarse.");
        setConfirmStatus(null);
        onUpdated?.();
      } else {
        toast.error(err.response?.data?.error ?? "Error al cambiar el estado.");
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleCategoryChange = async () => {
    if (!selectedCategory || selectedCategory === incident.category?._id) return;
    setLoadingCategory(true);
    try {
      await updateIncidentCategory(incident._id, selectedCategory);
      onUpdated?.();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        toast.error("El grupo ya se encuentra en un estado final y no puede modificarse.");
        onUpdated?.();
      } else {
        toast.error(err.response?.data?.error ?? "Error al cambiar la categoría.");
      }
    } finally {
      setLoadingCategory(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">

        {/* Banner dudoso */}
        {isDubious && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200">
            <AlertTriangle size={14} className="shrink-0 text-orange-500 mt-0.5" />
            <p className="text-xs text-orange-700 leading-snug">
              La IA marcó este incidente como <span className="font-semibold">dudoso</span>. Revisá el contenido antes de aceptarlo.
            </p>
          </div>
        )}

        {/* Estado */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</p>
          {isFinal ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <Lock size={13} className="shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-600">
                  {STATUS_LABELS[currentStatus] ?? capitalize(currentStatus)} — estado final
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Este grupo ya no puede cambiar de estado.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {visibleStatuses.map((s) => {
                const isCurrent = s.name === currentStatus;
                const st = getStatusStyle(s.name);
                return (
                  <button
                    key={s._id}
                    disabled={isCurrent}
                    onClick={() => setConfirmStatus(s)}
                    className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                      isCurrent
                        ? `${st.bg} ${st.text} ring-1 ring-current cursor-default`
                        : `${st.bg} ${st.text} opacity-40 hover:opacity-100 cursor-pointer`
                    }`}
                  >
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
                    {STATUS_LABELS[s.name] ?? capitalize(s.name)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divisor */}
        <div className="w-full h-px bg-gray-100" />

        {/* Categoría */}
        <div className="flex flex-col gap-2 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</p>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1 min-w-0 text-sm rounded-xl border-gray-200 bg-gray-50 text-gray-700 focus:ring-brand-mid">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{capitalize(c.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleCategoryChange}
              disabled={loadingCategory || selectedCategory === incident.category?._id}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-dark text-white text-xs font-semibold disabled:opacity-40 hover:bg-brand transition-colors"
            >
              {loadingCategory && <Loader2 size={12} className="animate-spin" />}
              Aplicar
            </button>
          </div>
        </div>

      </div>

      <StatusConfirmDialog
        targetStatus={confirmStatus}
        open={!!confirmStatus}
        onOpenChange={(v) => !v && setConfirmStatus(null)}
        onConfirm={handleStatusConfirm}
        loading={loadingStatus}
      />
    </>
  );
}
