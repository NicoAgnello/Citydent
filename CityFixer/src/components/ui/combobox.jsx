// Dropdown con búsqueda de texto (componente propio, no shadcn estándar).
// A diferencia de <Select>, permite filtrar las opciones escribiendo en un input.
// El ancho del panel se ajusta automáticamente al ancho del botón que lo abre.
//
// Props:
//   options      → array de { value, label } con las opciones disponibles
//   value        → valor seleccionado actualmente (string)
//   onChange     → función que recibe el value cuando el usuario elige una opción
//   placeholder  → texto que aparece cuando no hay nada seleccionado
//   loading      → booleano, muestra un spinner mientras se cargan las opciones
//   disabled     → booleano, deshabilita el componente
//
// Se usa en ProfileSetupScreen para seleccionar provincia y municipio (carga desde Georef API).
import { useState, useEffect, useRef } from "react";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function Combobox({
  value,
  onSelect,
  options = [],
  placeholder = "Seleccioná...",
  emptyText = "Sin resultados.",
  disabled,
  loading,
  className,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (open && triggerRef.current) setWidth(triggerRef.current.offsetWidth);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between text-left w-full",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <span className={cn("truncate", !value && "opacity-40")}>{value || placeholder}</span>
          {loading
            ? <Loader2 size={14} className="shrink-0 opacity-40 animate-spin" />
            : <ChevronsUpDown size={14} className="shrink-0 opacity-40" />
          }
        </button>
      </PopoverTrigger>
      <PopoverContent style={{ width }} align="start" className="p-0 rounded-2xl overflow-hidden">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => { onSelect(opt); setOpen(false); }}
                >
                  <Check
                    size={14}
                    className={cn("shrink-0", value === opt.label ? "opacity-100" : "opacity-0")}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
