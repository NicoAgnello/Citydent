export const STATUS_KEYS = {
  PENDING:    'pendiente',
  DUBIOUS:    'dudoso',
  ACCEPTED:   'aceptado',
  IN_PROCESS: 'en_proceso',
  RESOLVED:   'resuelto',
  REJECTED:   'rechazado',
  CANCELLED:  'cancelado',
};

export const STATUS_LABELS = {
  pendiente:  'Pendiente',
  dudoso:     'Dudoso',
  aceptado:   'Aceptado',
  en_proceso: 'En proceso',
  resuelto:   'Resuelto',
  rechazado:  'Rechazado',
  cancelado:  'Cancelado',
};

// Etiquetas para el usuario común — oculta el estado interno "dudoso"
export const STATUS_LABELS_PUBLIC = {
  ...STATUS_LABELS,
  dudoso: 'Pendiente',
};

export const STATUS_STYLES = {
  pendiente:  { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  dudoso:     { bg: 'bg-orange-100', text: 'text-orange-700' },
  aceptado:   { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  en_proceso: { bg: 'bg-[#D3D6FF]',  text: 'text-[#2F347A]'  },
  resuelto:   { bg: 'bg-green-100',  text: 'text-green-700'  },
  rechazado:  { bg: 'bg-red-100',    text: 'text-red-600'    },
  cancelado:  { bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

// Paleta de fallback para estados no definidos en STATUS_STYLES (ej: estados custom de la DB)
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

export function getStatusStyle(name) {
  if (STATUS_STYLES[name]) return STATUS_STYLES[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return STATUS_PALETTE[hash % STATUS_PALETTE.length];
}
