import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Tag,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  Edit3,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  getCategorias,
  createCategory,
  toggleCategory,
  updateCategory,
} from "@/services/api";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { capitalize } from "@/lib/incidents";

const INPUT_CLS =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

function ToggleCell({ category, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const isActive = category.isActive ?? true;

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleCategory(category._id);
      onUpdated?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-gray-50 text-gray-400 border border-gray-200"
      }`}
    >
      {loading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : isActive ? (
        <ToggleRight size={13} />
      ) : (
        <ToggleLeft size={13} />
      )}
      {isActive ? "Activa" : "Inactiva"}
    </button>
  );
}

export default function AdminCategoriasTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Sheet creación ──
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldError, setFieldError] = useState(false);

  // ── Sheet edición ──
  const [selectedId, setSelectedId] = useState(null);
  const selectedCategory = categories.find((c) => c._id === selectedId) ?? null;

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Resetear edición al cambiar de categoría
  useEffect(() => {
    setEditing(false);
    setEditError(null);
    setEditSuccess(false);
  }, [selectedId]);

  // ── Crear ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFieldError(true);
      return;
    }
    setSubmitting(true);
    try {
      await createCategory({
        name: name.trim(),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      setCreateOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.error ?? "Error al crear la categoría.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Editar ──
  const openEdit = () => {
    setEditForm({
      name: selectedCategory.name ?? "",
      description: selectedCategory.description ?? "",
    });
    setEditError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditError(null);
  };

  const submitEdit = async () => {
    if (!editForm.name.trim()) {
      setEditError("El nombre es obligatorio.");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await updateCategory(selectedId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      await fetchCategories();
      setEditing(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      setEditError(
        err.response?.data?.error ?? "Error al guardar los cambios.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Gestión de Categorías
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading
              ? "Cargando..."
              : `${categories.length} categorías en total`}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="shrink-0 rounded-xl bg-primary hover:bg-celestito text-white font-semibold gap-1.5"
        >
          <Plus size={15} />
          <span className="sm:hidden">Nueva</span>
          <span className="hidden sm:inline">Nueva Categoría</span>
        </Button>
      </div>

      {/* ── Lista ── */}
      <Card className="border-slate-100 shadow-none overflow-hidden py-0 gap-0">
        {/* Header — solo desktop */}
        <div className="hidden sm:grid sm:grid-cols-[44px_1fr_128px_24px] px-5 py-2.5 bg-slate-50/60 border-b border-slate-100">
          <span />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Categoría
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Estado
          </span>
          <span />
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-slate-300" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <Tag size={24} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Sin categorías aún</p>
            </div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedId(cat._id)}
                className="w-full grid grid-cols-[44px_1fr_128px_24px] items-center px-5 py-3.5 hover:bg-slate-50/80 transition-colors text-left"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.isActive ? "bg-blanquito/30" : "bg-gray-100"}`}
                >
                  <Tag
                    size={14}
                    className={cat.isActive ? "text-azul" : "text-gray-400"}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {capitalize(cat.name)}
                  </p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleCell category={cat} onUpdated={fetchCategories} />
                </div>
                <ChevronRight
                  size={14}
                  className="text-slate-300 justify-self-end"
                />
              </button>
            ))
          )}
        </div>
      </Card>

      {/* ── Sheet edición ── */}
      <Sheet
        open={!!selectedCategory}
        onOpenChange={(v) => !v && setSelectedId(null)}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-md p-0 flex flex-col bg-white"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Categoría
            </SheetTitle>
            <button
              onClick={() => setSelectedId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {selectedCategory && (
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden">
              {/* Info card */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedCategory.isActive ? "bg-blanquito/30" : "bg-gray-100"}`}
                >
                  <Tag
                    size={18}
                    className={
                      selectedCategory.isActive ? "text-azul" : "text-gray-400"
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">
                    {capitalize(selectedCategory.name)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      selectedCategory.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}
                  >
                    {selectedCategory.isActive ? (
                      <ToggleRight size={11} />
                    ) : (
                      <ToggleLeft size={11} />
                    )}
                    {selectedCategory.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </div>

              {/* Datos / Edición */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Datos</p>
                  <div className="flex items-center gap-2">
                    {editSuccess && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <Check size={12} /> Guardado
                      </span>
                    )}
                    {!editing ? (
                      <button
                        onClick={openEdit}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-celestito transition-colors"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEdit}
                          disabled={editLoading}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={submitEdit}
                          disabled={editLoading}
                          className="flex items-center gap-1 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-celestito transition-colors disabled:opacity-60"
                        >
                          {editLoading ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Check size={11} />
                          )}
                          {editLoading ? "Guardando..." : "Guardar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!editing ? (
                  <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                    {[
                      {
                        label: "Nombre",
                        value: capitalize(selectedCategory.name),
                      },
                      {
                        label: "Descripción",
                        value: selectedCategory.description,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start justify-between px-3 py-2.5"
                      >
                        <span className="text-xs text-slate-400 shrink-0">
                          {label}
                        </span>
                        <span className="text-xs font-medium text-slate-700 ml-3 text-right">
                          {value || (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {editError && (
                      <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                        {editError}
                      </p>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Nombre
                      </label>
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Ej: Alumbrado Público"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Descripción{" "}
                        <span className="text-slate-300 font-normal normal-case">
                          (opcional)
                        </span>
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Ej: Reportes relacionados con luminarias..."
                        rows={3}
                        className={`${INPUT_CLS} resize-none`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle estado */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-slate-700">Estado</p>
                <div
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    selectedCategory.isActive
                      ? "bg-emerald-50/50 border-emerald-100"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedCategory.isActive
                        ? "Categoría activa"
                        : "Categoría inactiva"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedCategory.isActive
                        ? "Visible para los ciudadanos al reportar."
                        : "Oculta para los ciudadanos."}
                    </p>
                  </div>
                  <ToggleCell
                    category={selectedCategory}
                    onUpdated={fetchCategories}
                  />
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Sheet creación ── */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full sm:max-w-md p-0 flex flex-col bg-white"
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">
              Nueva Categoría
            </SheetTitle>
            <button
              onClick={() => setCreateOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Nombre
                </Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldError(false);
                  }}
                  placeholder="Ej: Alumbrado Público"
                  className={`rounded-xl border-slate-200 focus-visible:ring-primary/30 ${fieldError ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                />
                {fieldError && (
                  <p className="text-xs text-red-500">
                    El nombre es obligatorio.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Descripción{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Reportes relacionados con luminarias quemadas o dañadas..."
                  className="rounded-xl border-slate-200 focus-visible:ring-primary/30 min-h-[100px] resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100">
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary hover:bg-celestito text-white font-semibold mt-2"
              >
                {submitting && (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                )}
                Crear categoría
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
