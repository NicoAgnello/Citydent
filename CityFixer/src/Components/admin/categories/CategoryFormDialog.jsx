import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createCategory } from "@/services/api";

export default function CategoryFormDialog({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createCategory({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.error ?? "Error al crear la categoría.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-azul-oscuro">Nueva categoría</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Alumbrado, Baches..."
              className="rounded-xl border-none bg-blanquito/50 focus-visible:ring-2 focus-visible:ring-celestito"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-700 font-semibold">Descripción <span className="text-gray-400 font-normal">(opcional)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de la categoría..."
              className="rounded-xl border-none bg-blanquito/50 min-h-[80px] focus-visible:ring-2 focus-visible:ring-celestito"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-azul-oscuro hover:bg-azul text-white rounded-xl"
            >
              {loading && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              Crear categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
