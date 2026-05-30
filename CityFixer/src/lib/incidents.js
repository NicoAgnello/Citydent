export const STATUS_KEYS = {
  PENDING:    'pendiente',
  IN_PROCESS: 'en_proceso',
  RESOLVED:   'resuelto',
  REJECTED:   'rechazado',
  DUBIOUS:    'dudoso',
};

export const STATUS_LABELS = {
  pendiente:  'Pendiente',
  en_proceso: 'En proceso',
  resuelto:   'Resuelto',
  rechazado:  'Rechazado',
  dudoso:     'Dudoso',
};

// Etiquetas para el usuario común — oculta el estado interno "dudoso"
export const STATUS_LABELS_PUBLIC = {
  ...STATUS_LABELS,
  dudoso: 'Pendiente',
};

export const STATUS_STYLES = {
  pendiente:  { bg: 'bg-amber-100',  text: 'text-amber-700' },
  en_proceso: { bg: 'bg-[#D3D6FF]',  text: 'text-[#2F347A]' },
  resuelto:   { bg: 'bg-green-100',  text: 'text-green-700' },
  rechazado:  { bg: 'bg-red-100',    text: 'text-red-600'   },
  dudoso:     { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';
