import { useState, useEffect, useCallback } from "react";
import { Loader2, Tag, ToggleLeft, ToggleRight, Plus, X } from "lucide-react";
import { getCategorias, createCategory, toggleCategory } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { capitalize } from "@/lib/incidents";

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
        isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-400 border border-gray-200"
      }`}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
      {isActive ? "Activa" : "Inactiva"}
    </button>
  );
}

export default function AdminCategoriasTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldError, setFieldError] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCategorias();
      setCategories(data.categories ?? []);
    } catch { setCategories([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setFieldError(true); return; }
    setSubmitting(true);
    try {
      await createCategory({ name: name.trim(), description: description.trim() });
      setName(""); setDescription(""); setCreateOpen(false); fetchCategories();
    } catch (err) { setFormError(err.response?.data?.error ?? "Error al crear la categoría."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Categorías</h1>
          <p className="text-sm text-slate-400 mt-0.5">{loading ? "Cargando..." : `${categories.length} categorías en total`}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 rounded-xl bg-primary hover:bg-celestito text-white font-semibold gap-1.5">
          <Plus size={15} /> Nueva Categoría
        </Button>
      </div>

      <Card className="border-slate-100 shadow-none overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
              <TableHead className="pl-5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Categoría</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat._id} className="hover:bg-slate-50/80">
                <TableCell className="pl-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.isActive ? "bg-blanquito/30" : "bg-gray-100"}`}>
                      <Tag size={13} className={cat.isActive ? "text-azul" : "text-gray-400"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{capitalize(cat.name)}</p>
                      {cat.description && <p className="text-xs text-slate-400 truncate max-w-xs">{cat.description}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3"><ToggleCell category={cat} onUpdated={fetchCategories} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* MODAL ESTILIZADO IGUAL AL DE USUARIOS */}
  <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-md p-0 flex flex-col bg-white">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <SheetTitle className="text-base font-semibold text-slate-900">Nueva Categoría</SheetTitle>
            <button onClick={() => setCreateOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Nombre</Label>
                <Input 
                  value={name} 
                  onChange={(e) => {setName(e.target.value); setFieldError(false);}} 
                  placeholder="Ej: Alumbrado Público"
                  className={`rounded-xl border-slate-200 focus-visible:ring-primary/30 ${fieldError ? "border-red-500 focus-visible:ring-red-300" : ""}`} 
                />
                {fieldError && <p className="text-xs text-red-500">El nombre es obligatorio.</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Descripción <span className="text-slate-400 font-normal">(opcional)</span>
                </Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Ej: Reportes relacionados con luminarias quemadas o dañadas..."
                  className="rounded-xl border-slate-200 focus-visible:ring-primary/30 min-h-[100px] resize-none" 
                />
              </div>

              {formError && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100">{formError}</p>}

              <Button type="submit" disabled={submitting} className="w-full rounded-xl bg-primary hover:bg-celestito text-white font-semibold mt-2">
                {submitting && <Loader2 size={14} className="mr-1.5 animate-spin" />} Crear categoría
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}