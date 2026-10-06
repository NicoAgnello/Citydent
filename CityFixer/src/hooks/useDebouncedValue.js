import { useState, useEffect } from "react";

// Devuelve `value` con un retraso (debounce): solo se actualiza cuando pasaron
// `delay` ms sin que `value` vuelva a cambiar. Se usa para no disparar un
// fetch al backend en cada tecla que escribe el usuario en un buscador.
//
// Ejemplo de uso:
//   const debouncedSearch = useDebouncedValue(searchTerm, 300);
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
