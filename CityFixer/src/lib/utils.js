import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

// Combina clases de Tailwind sin que se pisen entre sí.
// Por ejemplo: cn("p-2", condicional && "bg-brand", "p-4") → "bg-brand p-4"
// Se usa en casi todos los componentes UI de /components/ui/.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
