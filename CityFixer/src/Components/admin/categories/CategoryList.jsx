import { useState } from "react";
import { Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toggleCategory } from "@/services/api";
import { capitalize } from "@/lib/incidents";

function CategorySkeleton() {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 w-32 rounded-full bg-gray-100 animate-pulse" />
          <div className="h-3 w-48 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      </CardContent>
    </Card>
  );
}

function ToggleButton({ category, onUpdated }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleCategory(category._id);
      onUpdated?.();
    } finally {
      setLoading(false);
    }
  };

  const isActive = category.isActive ?? true;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-green-50 text-green-600 hover:bg-green-100"
          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
      }`}
      aria-label={isActive ? "Desactivar categoría" : "Activar categoría"}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : isActive ? (
        <ToggleRight size={15} />
      ) : (
        <ToggleLeft size={15} />
      )}
      {isActive ? "Activa" : "Inactiva"}
    </button>
  );
}

export default function CategoryList({ categories, loading, onUpdated }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => <CategorySkeleton key={i} />)}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-12">
        No hay categorías creadas todavía.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat) => (
        <Card key={cat._id} className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                (cat.isActive ?? true) ? "bg-blanquito/60" : "bg-gray-100"
              }`}>
                <Tag size={14} className={(cat.isActive ?? true) ? "text-azul" : "text-gray-400"} />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm truncate ${
                  (cat.isActive ?? true) ? "text-azul-oscuro" : "text-gray-400"
                }`}>
                  {capitalize(cat.name)}
                </p>
                {cat.description && (
                  <p className="text-xs text-gray-400 truncate">{cat.description}</p>
                )}
              </div>
            </div>
            <ToggleButton category={cat} onUpdated={onUpdated} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
