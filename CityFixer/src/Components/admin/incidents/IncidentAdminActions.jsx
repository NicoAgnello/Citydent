import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatuses } from "@/hooks/useStatuses";
import { getCategorias, updateIncidentStatus, updateIncidentCategory } from "@/services/api";
import { STATUS_STYLES, STATUS_LABELS, capitalize } from "@/lib/incidents";

const STATUS_PALETTE = [
  { bg: "bg-sky-100",     text: "text-sky-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-pink-100",    text: "text-pink-700"    },
  { bg: "bg-lime-100",    text: "text-lime-700"    },
  { bg: "bg-cyan-100",    text: "text-cyan-700"    },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
];

function getStatusStyle(name) {
  if (STATUS_STYLES[name]) return STATUS_STYLES[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return STATUS_PALETTE[hash % STATUS_PALETTE.length];
}

function StatusConfirmDialog({ targetStatus, open, onOpenChange, onConfirm, loading }) {
  if (!targetStatus) return null;
  const style = getStatusStyle(targetStatus.name);
  const label = STATUS_LABELS[targetStatus.name] ?? capitalize(targetStatus.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-[#292D60]">Confirmar cambio de estado</DialogTitle>
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
            className="bg-[#292D60] hover:bg-[#2F347A] text-white rounded-xl"
          >
            {loading && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function IncidentAdminActions({ incident, onUpdated }) {
  const { statuses } = useStatuses();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(incident.category?._id ?? "");
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);

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
    } finally {
      setLoadingCategory(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">

        {/* Estado */}
        <div className="flex flex-col gap-2 sm:shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</p>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => {
              const isCurrent = s.name === incident.status?.name;
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
        </div>

        {/* Divisor vertical (solo desktop) */}
        <div className="hidden sm:block w-px bg-gray-100 self-stretch" />

        {/* Categoría */}
        <div className="flex flex-col gap-2 sm:flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</p>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 min-w-0 text-sm rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B418F]"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{capitalize(c.name)}</option>
              ))}
            </select>
            <button
              onClick={handleCategoryChange}
              disabled={loadingCategory || selectedCategory === incident.category?._id}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#292D60] text-white text-xs font-semibold disabled:opacity-40 hover:bg-[#2F347A] transition-colors"
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
