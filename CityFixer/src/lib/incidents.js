// Claves internas de los estados tal como vienen de la base de datos.
// Usarlas en vez de strings sueltos evita errores de tipeo.
export const STATUS_KEYS = {
  PENDING:    'pendiente',
  DUBIOUS:    'dudoso',
  ACCEPTED:   'aceptado',
  IN_PROCESS: 'en_proceso',
  RESOLVED:   'resuelto',
  REJECTED:   'rechazado',
  CANCELLED:  'cancelado',
};

// Texto que se muestra al admin para cada estado.
// Se usa en tarjetas y tablas del panel de administración.
export const STATUS_LABELS = {
  pendiente:  'Pendiente',
  dudoso:     'Dudoso',
  aceptado:   'Aceptado',
  en_proceso: 'En proceso',
  resuelto:   'Resuelto',
  rechazado:  'Rechazado',
  cancelado:  'Cancelado',
};

// Igual que STATUS_LABELS pero para el usuario común.
// "Dudoso" se muestra como "Pendiente" para no exponer el estado interno
// de moderación al ciudadano que reportó el incidente.
export const STATUS_LABELS_PUBLIC = {
  ...STATUS_LABELS,
  dudoso: 'Pendiente',
};

// Clases de Tailwind para los badges de estado (pastilla de color con borde).
// Se usa en tarjetas de incidentes tanto en la vista de usuario como en el admin.
// Centralizado acá para que cambiar un color se refleje en toda la app.
export const STATUS_BADGE = {
  pendiente:  "bg-amber-50 text-amber-700 border border-amber-200",
  dudoso:     "bg-orange-50 text-orange-700 border border-orange-200",
  aceptado:   "bg-teal-50 text-teal-700 border border-teal-200",
  en_proceso: "bg-brand-light/20 text-brand-dark border border-brand-light/50",
  resuelto:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rechazado:  "bg-rose-50 text-rose-700 border border-rose-200",
  cancelado:  "bg-gray-50 text-gray-500 border border-gray-200",
};

// Colores de fondo y texto para cada estado, en formato objeto { bg, text }.
// Lo usa getStatusStyle() para pintar marcadores en el mapa y elementos del historial.
export const STATUS_STYLES = {
  pendiente:  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  dudoso:     { bg: 'bg-orange-100', text: 'text-orange-700' },
  aceptado:   { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  en_proceso: { bg: 'bg-brand-light', text: 'text-[#2F347A]'  },
  resuelto:   { bg: 'bg-green-100',  text: 'text-green-700'  },
  rechazado:  { bg: 'bg-red-100',    text: 'text-red-600'    },
  cancelado:  { bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

// Pone en mayúscula la primera letra de un string. Devuelve "—" si está vacío.
// Se usa para mostrar estados o categorías que vienen en minúscula desde la API.
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

// Colores de reserva para estados que no están definidos en STATUS_STYLES.
// Si la base de datos tiene un estado nuevo o custom, se le asigna un color
// de esta lista de forma determinista (basado en el nombre del estado).
export const STATUS_PALETTE = [
  { bg: 'bg-sky-100',     text: 'text-sky-700'     },
  { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  { bg: 'bg-teal-100',    text: 'text-teal-700'    },
  { bg: 'bg-pink-100',    text: 'text-pink-700'    },
  { bg: 'bg-lime-100',    text: 'text-lime-700'    },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
];

// Devuelve el color { bg, text } para un estado dado.
// Si el estado existe en STATUS_STYLES lo usa; si no, elige un color de
// STATUS_PALETTE de forma consistente (el mismo estado siempre da el mismo color).
// Se usa en marcadores del mapa y en el historial de estados.
export function getStatusStyle(name) {
  if (!name) return STATUS_PALETTE[0];
  if (STATUS_STYLES[name]) return STATUS_STYLES[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return STATUS_PALETTE[hash % STATUS_PALETTE.length];
}
