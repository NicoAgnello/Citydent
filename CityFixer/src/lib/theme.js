// Tema claro/oscuro de la app del ciudadano.
//
// La preferencia puede ser "light", "dark" o "system" (sigue al sistema operativo)
// y se guarda en localStorage. El tema oscuro se activa poniendo la clase "dark"
// en <html>; los estilos viven en index.css.
//
// useApplyTheme() se llama una sola vez, en Home, y es quien pone y saca la clase.
// Como la clase se quita al desmontar Home, el login y el panel de admin siempre
// se ven en claro.
//
//   useThemePref() → [preferencia, setThemePref]  para el selector de tema
//   useDark()      → true si el tema efectivo es oscuro (para elegir estilos de mapa)
//   useApplyTheme()→ aplica la clase "dark" en <html> según la preferencia
import { useLayoutEffect, useSyncExternalStore } from "react";

const KEY = "cityfixer-theme";
const VALID = ["light", "dark", "system"];

const listeners = new Set();
const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function readPref() {
  try {
    const saved = localStorage.getItem(KEY);
    return VALID.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

let pref = readPref();

// Solo hay tema oscuro mientras Home lo tiene aplicado. Sin esto, el login y el admin
// (siempre claros) mostrarían mapas oscuros si la preferencia guardada es "dark".
let applied = false;

const resolveDark = () => applied && (pref === "dark" || (pref === "system" && !!media?.matches));

function subscribe(listener) {
  listeners.add(listener);
  media?.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", listener);
  };
}

export function setThemePref(next) {
  pref = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Sin localStorage (modo privado, etc.): el tema vale solo para esta sesión.
  }
  listeners.forEach((l) => l());
}

export function useThemePref() {
  const current = useSyncExternalStore(subscribe, () => pref);
  return [current, setThemePref];
}

export function useDark() {
  return useSyncExternalStore(subscribe, resolveDark);
}

export function useApplyTheme() {
  // Se marca durante el render (no en un efecto) para que los hijos, que se
  // renderizan después, ya lean el tema correcto en su primer render.
  applied = true;
  const dark = useDark();
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useLayoutEffect(
    () => () => {
      applied = false;
      document.documentElement.classList.remove("dark");
      listeners.forEach((l) => l());
    },
    []
  );
}
