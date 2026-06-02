import { useState, useEffect, useCallback } from "react";
import { Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { getCategorias, createCategory, toggleCategory } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { capitalize } from "@/lib/incidents";

// ── Toggle activa/inactiva (lógica original intacta) ──
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
  // ── Estado de datos (lógica original intacta) ──
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  // ── Estado del formulario de creación ──
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState(null);
  const [fieldError, setFieldError]   = useState(false);

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

  // ── Crear categoría (lógica original intacta) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFieldError(true); return; }
    setFieldError(false);
    setSubmitting(true);
    try {
      await createCategory({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      fetchCategories();
    } catch (err) {
      setFormError(err.response?.data?.error ?? "Error al crear la categoría.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = categories.filter((c) => c.isActive ?? true).length;

  return (
    <div className="min-h-screen">
      {/* ── Cabecera ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Gestión de Categorías</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {loading
            ? "Cargando..."
            : `${activeCount} activa${activeCount !== 1 ? "s" : ""} · ${categories.length} en total`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Listado de categorías (2/3) ── */}
        <div className="lg:col-span-2">

          {/* MOBILE: filas compactas */}
          <div className="md:hidden flex flex-col gap-2.5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3.5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg shrink-0" />
                    <div className="h-4 w-28 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-full" />
                </div>
              ))
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No hay categorías todavía.</p>
            ) : (
              categories.map((cat) => {
                const isActive = cat.isActive ?? true;
                return (
                  <div key={cat._id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-blanquito/30" : "bg-gray-100"}`}>
                        <Tag size={13} className={isActive ? "text-azul" : "text-gray-400"} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                          {capitalize(cat.name)}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-slate-400 truncate">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 ml-3">
                      <ToggleCell category={cat} onUpdated={fetchCategories} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP: tabla */}
          <Card className="hidden md:block border-slate-100 shadow-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                  <TableHead className="pl-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Categoría
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-slate-100 rounded-lg animate-pulse shrink-0" />
                          <div className="h-4 w-32 bg-slate-100 rounded-full animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-12 text-sm text-slate-400">
                      No hay categorías creadas todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => {
                    const isActive = cat.isActive ?? true;
                    return (
                      <TableRow key={cat._id} className="hover:bg-slate-50/80">
                        <TableCell className="pl-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-blanquito/30" : "bg-gray-100"}`}>
                              <Tag size={13} className={isActive ? "text-azul" : "text-gray-400"} />
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-400"}`}>
                                {capitalize(cat.name)}
                              </p>
                              {cat.description && (
                                <p className="text-xs text-slate-400 truncate max-w-xs">{cat.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <ToggleCell category={cat} onUpdated={fetchCategories} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* ── Formulario de creación (1/3) ── */}
        <div className="lg:col-span-1">
          <Card className="border-slate-100 shadow-none sticky top-6">
            <CardContent className="p-5">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-900">Nueva Categoría</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Completá los datos para agregar una categoría
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Nombre</Label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFieldError(false); }}
                    placeholder="Ej: Alumbrado, Baches..."
                    className={`rounded-xl border-slate-200 focus-visible:ring-primary ${
                      fieldError ? "border-red-400 focus-visible:ring-red-400" : ""
                    }`}
                  />
                  {fieldError && (
                    <p className="text-xs text-red-500 mt-1">El nombre es obligatorio.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Descripción
                    <span className="text-slate-400 font-normal ml-1">(opcional)</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descripción de la categoría..."
                    className="rounded-xl border-slate-200 focus-visible:ring-primary min-h-[80px] resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-primary hover:bg-celestito text-white font-semibold"
                >
                  {submitting && <Loader2 size={14} className="mr-1.5 animate-spin" />}
                  Crear categoría
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
