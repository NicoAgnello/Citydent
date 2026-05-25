import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { getCategorias } from "@/services/api";
import CategoryList from "./CategoryList";
import CategoryFormDialog from "./CategoryFormDialog";

// eslint-disable-next-line no-unused-vars
export default function AdminCategoriasTab({ dbRole }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCategorias();
      setCategories(data.categories ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {loading ? "—" : `${categories.length} categoría${categories.length !== 1 ? "s" : ""}`}
        </p>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#292D60] text-white text-xs font-semibold hover:bg-[#2F347A] transition-colors"
        >
          <Plus size={13} />
          Nueva categoría
        </button>
      </div>

      <CategoryList
        categories={categories}
        loading={loading}
        onUpdated={fetchCategories}
      />

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={fetchCategories}
      />
    </div>
  );
}
