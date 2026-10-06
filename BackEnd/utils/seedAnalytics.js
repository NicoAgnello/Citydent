/**
 * SEED DE ANÁLISIS — datos históricos sintéticos para el TP de Probabilidad y Estadística.
 *
 * Genera ~1300 incidentes repartidos en ~680 grupos a lo largo de los últimos 365 días,
 * pensados para alimentar un tablero de Power BI a través de los endpoints externos
 * (`/api/external/:table` → groups, incidents, statuses, categories, users).
 *
 * PRINCIPIOS DE DISEÑO
 * --------------------
 * 1. La prioridad se calcula con el MISMO mecanismo que usa la app real
 *    (ver `createIncident` en services/incident.service.js): una base por gravedad de
 *    categoría, +1 por cada reporte duplicado del grupo, con tope en 10. Así el análisis
 *    de la Sección 5 del TP describe el comportamiento real del sistema y no una
 *    correlación inventada.
 * 2. Los incidentes de un mismo grupo caen dentro de ~20 m entre sí, que es el radio
 *    con el que la app agrupa reportes cercanos.
 * 3. Se inyectan problemas de calidad a propósito (nulos, duplicados, formatos
 *    inconsistentes) para practicar limpieza en Power Query. Ver bloque `SUCIEDAD`.
 * 4. TODO documento sintético lleva el marcador `_seed: SEED_TAG`, invisible para los
 *    endpoints externos. Los datos reales del equipo nunca se tocan.
 *
 * USO
 * ---
 *   node utils/seedAnalytics.js            → carga los datos
 *   node utils/seedAnalytics.js --rollback → borra TODO lo cargado por este script
 *   node utils/seedAnalytics.js --dry-run  → genera y reporta, sin escribir en Mongo
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });
const mongoose = require('mongoose');
const mongoConnect = require('../config/mongoConnet');

const Status = require('../models/status');
const Category = require('../models/category');
const Neighborhood = require('../models/neighborhood');
const Role = require('../models/role');
const User = require('../models/user');
const Incident = require('../models/incident');
const IncidentGroup = require('../models/incidentGroup');

// ==========================================
// CONFIGURACIÓN
// ==========================================

const SEED_TAG = 'analytics-2026';
const RANDOM_SEED = 20260819;

const TARGET_INCIDENTS = 1300;
const TARGET_USERS = 130;
const DIAS_HISTORIA = 365;

const DIA_MS = 24 * 60 * 60 * 1000;

/** Porcentajes de problemas de calidad inyectados (Etapas 1 y 2 del TP). */
const SUCIEDAD = {
  userSinTelefono:        0.12,
  userSinBarrio:          0.18,
  userSinDni:             0.08,  // el campo se omite (no null) por el índice unique+sparse
  userSinCiudad:          0.10,
  userCiudadInconsistente:0.45,  // "Villa María" / "villa maria" / "VILLA MARIA" / typos
  userNombreSucio:        0.15,  // mayúsculas raras, espacios de más
  userEmailMayusculas:    0.12,
  userDuplicadoLogico:    6,     // cantidad absoluta de personas duplicadas
  grupoFinalSinFecha:     0.05,  // estado final pero finalizedAt null → inconsistencia
  grupoPrioridadCero:     0.04,  // prioridad 0, fuera del rango válido 1-10
  incidenteSinCategoriaIA:0.06,
  incidenteDuplicado:     0.02,  // doble submit: fila exactamente repetida
  incidenteFueraDeCiudad: 0.005, // coordenada mal capturada → cae fuera de todo barrio
};

/**
 * Prioridad base por categoría (gravedad intrínseca, antes de sumar reportes).
 * Replica el criterio de la guía que recibe la IA en openai.service.js.
 */
const PRIORIDAD_BASE = {
  'Inundacion': [6, 9],
  'bache':      [3, 6],
  'alumbrado':  [2, 5],
  'vandalismo': [2, 5],
  'basura':     [1, 4],
  'otro':       [1, 4]
};

/** Frecuencia relativa de cada categoría. */
const PESO_CATEGORIA = {
  'bache':      0.30,
  'basura':     0.22,
  'alumbrado':  0.20,
  'vandalismo': 0.13,
  'otro':       0.10,
  'Inundacion': 0.05
};

/** Probabilidad de que un reporte de esa categoría sea marcado como emergencia. */
const PROB_EMERGENCIA = {
  'Inundacion': 0.25,
  'otro':       0.05,
  'bache':      0.03,
  'vandalismo': 0.02,
  'alumbrado':  0.01,
  'basura':     0.005
};

/** Distribución de cuántas veces se reporta un mismo incidente (cola larga). */
const DIST_REPORTES = [
  { n: 1,  p: 0.58 },
  { n: 2,  p: 0.18 },
  { n: 3,  p: 0.10 },
  { n: 4,  p: 0.05 },
  { n: 5,  p: 0.035 },
  { n: 6,  p: 0.02 },
  { n: 7,  p: 0.015 },
  { n: 8,  p: 0.01 },
  { n: 10, p: 0.007 },
  { n: 13, p: 0.003 }
];

/** Estacionalidad por mes (0=enero). Hemisferio sur: más reportes en otoño/invierno. */
const PESO_MES = [0.70, 0.70, 0.90, 1.10, 1.30, 1.50, 1.50, 1.30, 1.00, 0.90, 0.80, 0.80];

/**
 * Peso de cada hora LOCAL del día (0-23) para el momento del reporte.
 * Pico de media mañana y de tarde, caída en la siesta y muy poco de madrugada.
 */
const PESO_HORA_LOCAL = [1, 0.6, 0.4, 0.3, 0.3, 0.5, 1.5, 3, 7, 9, 10, 9, 7, 5, 5, 7, 9, 10, 9, 8, 6, 4, 3, 2];

/** Villa María está en UTC-3. */
const OFFSET_UTC = -3;

// ==========================================
// ALEATORIEDAD DETERMINISTA
// ==========================================

let _state = RANDOM_SEED;

/** PRNG mulberry32: reproducible entre corridas. */
const rand = () => {
  _state |= 0;
  _state = (_state + 0x6D2B79F5) | 0;
  let t = Math.imul(_state ^ (_state >>> 15), 1 | _state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;

/** Elige una clave de un objeto `{ clave: peso }`. */
const pickWeighted = (pesos) => {
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (const [k, p] of Object.entries(pesos)) {
    r -= p;
    if (r <= 0) return k;
  }
  return Object.keys(pesos)[0];
};

/** Normal por Box-Muller, recortada a [min, max]. */
const gauss = (mu, sigma, min = -Infinity, max = Infinity) => {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.min(max, Math.max(min, mu + z * sigma));
};

/**
 * Fija una hora del día realista sobre una fecha, conservando el día.
 *
 * Sin esto todos los registros heredan la hora en la que corrió el script (los
 * cálculos restan días enteros), y cualquier análisis por franja horaria queda
 * con un pico artificial imposible de explicar.
 *
 * @param {Date} fecha Fecha cuyo día se conserva.
 * @returns {Date} Misma fecha con hora, minutos y segundos verosímiles.
 */
const conHoraRealista = (fecha) => {
  const pesos = {};
  PESO_HORA_LOCAL.forEach((p, h) => { pesos[h] = p; });
  const horaLocal = Number(pickWeighted(pesos));
  const horaUtc = (horaLocal - OFFSET_UTC + 24) % 24;

  const d = new Date(fecha);
  d.setUTCHours(horaUtc, randInt(0, 59), randInt(0, 59), randInt(0, 999));
  return d;
};

// ==========================================
// GEOMETRÍA
// ==========================================

/** Ray casting sobre un anillo de coordenadas [lng, lat]. */
const pointInRing = (pt, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cruza = (yi > pt[1]) !== (yj > pt[1]) &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi;
    if (cruza) inside = !inside;
  }
  return inside;
};

/** `coords[0]` es el anillo exterior; los siguientes son huecos. */
const pointInPolygon = (pt, coords) => {
  if (!pointInRing(pt, coords[0])) return false;
  for (let i = 1; i < coords.length; i++) {
    if (pointInRing(pt, coords[i])) return false;
  }
  return true;
};

const bboxOf = (coords) => {
  let minX = 180, maxX = -180, minY = 90, maxY = -90;
  for (const [x, y] of coords[0]) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
};

/**
 * Punto aleatorio dentro del polígono del barrio. Reintenta porque el bounding box
 * de una forma cóncava incluye zonas fuera del polígono.
 *
 * @returns {{lat:number, lng:number}|null}
 */
const randomPointIn = (coords, bbox, intentos = 400) => {
  for (let i = 0; i < intentos; i++) {
    const x = bbox.minX + rand() * (bbox.maxX - bbox.minX);
    const y = bbox.minY + rand() * (bbox.maxY - bbox.minY);
    if (pointInPolygon([x, y], coords)) return { lat: y, lng: x };
  }
  return null;
};

// 20 m expresados en grados a la latitud de Villa María (-32.4).
const OFFSET_LAT = 0.00018;
const OFFSET_LNG = 0.00021;

// ==========================================
// TEXTOS
// ==========================================

const NOMBRES = ['Juan', 'María', 'Lucas', 'Sofía', 'Matías', 'Camila', 'Nicolás', 'Valentina', 'Facundo', 'Julieta',
  'Santiago', 'Martina', 'Tomás', 'Agustina', 'Franco', 'Rocío', 'Emiliano', 'Micaela', 'Gonzalo', 'Brenda',
  'Federico', 'Carla', 'Ramiro', 'Paula', 'Ignacio', 'Daniela', 'Leandro', 'Ana', 'Diego', 'Florencia',
  'Marcos', 'Luciana', 'Pablo', 'Antonella', 'Hernán', 'Belén', 'Sergio', 'Natalia', 'Gustavo', 'Verónica'];

const APELLIDOS = ['Gómez', 'Fernández', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'Sánchez', 'Romero', 'Sosa', 'Torres',
  'Álvarez', 'Ruiz', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina', 'Herrera', 'Aguirre', 'Rojas',
  'Molina', 'Castro', 'Ortiz', 'Silva', 'Núñez', 'Luna', 'Juárez', 'Cabrera', 'Ríos', 'Morales',
  'Peralta', 'Ledesma', 'Vega', 'Campos', 'Suárez', 'Ponce', 'Quiroga', 'Bustos', 'Vera', 'Maldonado'];

const CALLES = ['Bv. España', 'Bv. Sarmiento', 'Av. Perón', 'Lisandro de la Torre', 'Entre Ríos', 'Corrientes',
  'Mendoza', 'Tucumán', 'Catamarca', 'Salta', 'San Juan', 'Buenos Aires', 'Santa Fe', 'Chile', 'Bolívar',
  'Sabattini', 'Vélez Sarsfield', 'Rivadavia', 'Belgrano', 'San Martín', 'Mitre', 'Alvear', '25 de Mayo',
  '9 de Julio', 'Maipú', 'Larrabure', 'Carlos Pellegrini', 'Poeta Lugones', 'Almirante Brown'];

/** Plantillas de título y descripción por categoría. */
const PLANTILLAS = {
  'bache': {
    titulos: ['Bache en {calle}', 'Pozo profundo en {calle} al {nro}', 'Bache grande frente al {nro} de {calle}',
      'Rotura de asfalto en {calle}', 'Pozo sin señalizar en {calle}', 'Hundimiento del pavimento en {calle}'],
    descripciones: [
      'Hay un bache de aproximadamente medio metro en {calle} al {nro}. Ya se rompieron varias cubiertas, sobre todo de noche que no se ve.',
      'El pozo viene creciendo hace semanas y con la lluvia se llena de agua, no se alcanza a ver la profundidad. Pasan colectivos por esa cuadra.',
      'Se hundió el asfalto en la esquina y los autos tienen que esquivar hacia el carril contrario. Es peligroso en hora pico.',
      'Bache justo en la senda peatonal, la gente mayor tiene que bajar a la calle para esquivarlo.',
      'Rotura del pavimento a la altura del {nro}. Las motos zigzaguean para esquivarlo y ya hubo un par de sustos.'
    ]
  },
  'alumbrado': {
    titulos: ['Luminaria apagada en {calle}', 'Foco quemado en {calle} al {nro}', 'Sin luz en la cuadra de {calle}',
      'Poste de luz intermitente en {calle}', 'Alumbrado roto en la plaza de {barrio}'],
    descripciones: [
      'Hace más de dos semanas que la luminaria de {calle} al {nro} está apagada. La cuadra queda completamente a oscuras.',
      'El foco prende y se apaga toda la noche. Además hace un ruido raro, parece que está por quemarse del todo.',
      'Toda la cuadra quedó sin alumbrado. Los vecinos evitamos pasar caminando de noche por lo oscuro que está.',
      'La columna de alumbrado de la plaza está rota, quedaron los cables a la vista y los chicos juegan ahí.',
      'Se quemaron tres luminarias seguidas sobre {calle}. Es una zona muy transitada y ahora no se ve nada.'
    ]
  },
  'basura': {
    titulos: ['Basura acumulada en {calle}', 'Microbasural en {calle} y {calle2}', 'Contenedor desbordado en {calle}',
      'Residuos sin recolectar en {barrio}', 'Escombros tirados en {calle}'],
    descripciones: [
      'Se juntó mucha basura en la esquina de {calle} y {calle2}. Hace días que no pasa el recolector y ya hay olor.',
      'Se formó un microbasural en el baldío. Tiran escombros y restos de poda, ya hay ratas dando vueltas.',
      'El contenedor está desbordado hace una semana, la basura queda tirada en la vereda y los perros la desparraman.',
      'Tiraron muebles viejos y restos de obra en la vereda del {nro}. Ocupan todo el paso y no se puede caminar.',
      'Los residuos se acumulan sobre el cordón y cuando llueve tapan la boca de tormenta.'
    ]
  },
  'vandalismo': {
    titulos: ['Refugio de colectivo roto en {calle}', 'Juegos vandalizados en la plaza de {barrio}',
      'Pintadas en el frente municipal de {calle}', 'Banco destruido en la plaza de {barrio}',
      'Cartel de señalización arrancado en {calle}'],
    descripciones: [
      'Rompieron el vidrio del refugio de la parada de {calle}. Quedaron los restos en el piso, es peligroso para los que esperan el colectivo.',
      'Destrozaron dos juegos de la plaza. Quedó un hierro suelto a la altura de la cabeza de los chicos.',
      'Aparecieron pintadas en toda la pared del edificio. No es la primera vez que pasa este mes.',
      'Rompieron los bancos de cemento de la plaza y dejaron los escombros tirados alrededor.',
      'Arrancaron el cartel de "pare" de la esquina. Es un cruce complicado y ahora nadie frena.'
    ]
  },
  'Inundacion': {
    titulos: ['Anegamiento en {calle}', 'Boca de tormenta tapada en {calle} y {calle2}',
      'Calle inundada en {barrio}', 'Agua acumulada en {calle} al {nro}', 'Desborde de zanja en {barrio}'],
    descripciones: [
      'Con la tormenta de anoche se inundó toda la cuadra de {calle}. El agua entró a las casas del {nro}.',
      'La boca de tormenta está tapada con hojas y basura, el agua no drena y se junta hasta media rueda.',
      'La calle quedó intransitable, el agua no baja hace dos días y los autos no pueden salir de los garages.',
      'Se desbordó la zanja y el agua servida está pasando a la vereda. Hay olor y mosquitos.',
      'Cada vez que llueve fuerte se anega la esquina. Ya lo reportamos otras veces y sigue igual.'
    ]
  },
  'otro': {
    titulos: ['Árbol caído en {calle}', 'Rama peligrosa sobre {calle}', 'Semáforo descompuesto en {calle} y {calle2}',
      'Vereda rota en {calle} al {nro}', 'Cable colgando en {calle}', 'Perros sueltos en la plaza de {barrio}'],
    descripciones: [
      'Se cayó un árbol y está bloqueando media calzada de {calle}. No se puede pasar con auto.',
      'Hay una rama grande a punto de caerse justo arriba de la vereda. Con viento se mueve mucho.',
      'El semáforo de la esquina quedó en amarillo intermitente. Es un cruce muy transitado y ya hubo roces.',
      'La vereda está levantada por la raíz del árbol, es imposible pasar con cochecito o silla de ruedas.',
      'Quedó un cable colgando bajo, casi a la altura de la cabeza. No sabemos si tiene tensión.'
    ]
  }
};

/** Variantes sucias del nombre de ciudad, al estilo de las que ya existen en la base real. */
const CIUDADES_SUCIAS = ['Villa María', 'Villa Maria', 'villa maria', 'VILLA MARIA', ' Villa Maria', 'Villa María ',
  'Villa marai', 'Vila Maria', 'V. María'];
const CIUDADES_VECINAS = ['Villa Nueva', 'villa nueva', 'Tío Pujio', 'Tio Pujio', 'Arroyo Cabral'];
const PROVINCIAS_SUCIAS = ['Córdoba', 'Cordoba', 'cordoba', 'CBA', 'Cba.', 'Cordoa', 'CÓRDOBA'];

/** Distintos formatos de teléfono, para practicar normalización. */
const formatoTelefono = (n) => {
  const base = String(n).padStart(7, '0').slice(-7);
  const variantes = [
    `353${base}`,
    `353-${base.slice(0, 3)}-${base.slice(3)}`,
    `+54 353 ${base}`,
    `(353) ${base.slice(0, 3)}-${base.slice(3)}`,
    `0353 15${base}`,
    `353 ${base.slice(0, 3)} ${base.slice(3)}`
  ];
  return pick(variantes);
};

/** Variantes de la categoría sugerida por la IA (campo de texto libre en la app real). */
const categoriaIASucia = (nombre) => {
  const variantes = [nombre, nombre, nombre.toLowerCase(), nombre.toUpperCase(),
    nombre.charAt(0).toUpperCase() + nombre.slice(1), `${nombre} `, `${nombre}s`];
  return pick(variantes);
};

const ensuciarNombre = (nombre) => pick([
  nombre.toUpperCase(),
  nombre.toLowerCase(),
  ` ${nombre}`,
  `${nombre} `,
  `${nombre}  `
]);

// ==========================================
// GENERACIÓN
// ==========================================

/**
 * Construye los usuarios ciudadanos sintéticos.
 *
 * @param {ObjectId} rolUserId  ObjectId del rol "user".
 * @param {Array} barrios       Barrios disponibles (para asignar `barrio`).
 * @returns {Array<Object>} Documentos listos para insertar.
 */
const generarUsuarios = (rolUserId, barrios) => {
  const usuarios = [];
  const ahora = Date.now();

  for (let i = 0; i < TARGET_USERS; i++) {
    const nombre = pick(NOMBRES);
    const apellido = pick(APELLIDOS);
    const idx = String(i + 1).padStart(4, '0');

    // Los usuarios se dieron de alta a lo largo del año, antes de reportar.
    const createdAt = conHoraRealista(new Date(ahora - randInt(1, DIAS_HISTORIA + 30) * DIA_MS));

    let email = `seed+${idx}@cityfixer.local`;
    if (chance(SUCIEDAD.userEmailMayusculas)) {
      email = `Seed+${idx}@CityFixer.Local`;
    }

    const doc = {
      _id: new mongoose.Types.ObjectId(),
      clerkId: `seed_analytics_${idx}`,
      email,
      firstName: chance(SUCIEDAD.userNombreSucio) ? ensuciarNombre(nombre) : nombre,
      lastName: chance(SUCIEDAD.userNombreSucio) ? ensuciarNombre(apellido) : apellido,
      imageUrl: '',
      role: rolUserId,
      telefono: chance(SUCIEDAD.userSinTelefono) ? null : formatoTelefono(randInt(4000000, 4999999)),
      direccion: `${pick(CALLES)} ${randInt(100, 3500)}`,
      ciudad: null,
      barrio: chance(SUCIEDAD.userSinBarrio) ? null : pick(barrios)._id,
      provincia: pick(PROVINCIAS_SUCIAS),
      codigoPostal: chance(0.15) ? null : '5900',
      profileComplete: chance(0.85),
      verificationToken: null,
      verificationTokenExpires: null,
      isBanned: chance(0.03),
      createdAt,
      updatedAt: createdAt,
      __v: 0,
      _seed: SEED_TAG
    };

    // Ciudad: nulos, variantes inconsistentes de "Villa María" y algunas localidades vecinas.
    if (chance(SUCIEDAD.userSinCiudad)) {
      doc.ciudad = null;
    } else if (chance(0.12)) {
      doc.ciudad = pick(CIUDADES_VECINAS);
    } else if (chance(SUCIEDAD.userCiudadInconsistente)) {
      doc.ciudad = pick(CIUDADES_SUCIAS);
    } else {
      doc.ciudad = 'Villa María';
    }

    // El DNI se OMITE (no se pone en null) para no chocar con el índice unique+sparse.
    if (!chance(SUCIEDAD.userSinDni)) {
      doc.dni = String(20000000 + i * 137 + randInt(0, 100)).slice(0, 8);
    }

    usuarios.push(doc);
  }

  // Duplicados lógicos: misma persona (nombre, apellido, teléfono) con otro email y otro DNI.
  for (let d = 0; d < SUCIEDAD.userDuplicadoLogico; d++) {
    const original = usuarios[randInt(0, usuarios.length - 1)];
    const idx = String(TARGET_USERS + d + 1).padStart(4, '0');
    usuarios.push({
      ...original,
      _id: new mongoose.Types.ObjectId(),
      clerkId: `seed_analytics_${idx}`,
      email: `seed+${idx}@cityfixer.local`,
      dni: String(30000000 + d * 971 + randInt(0, 500)).slice(0, 8),
      createdAt: new Date(original.createdAt.getTime() + randInt(1, 60) * DIA_MS),
      updatedAt: new Date(original.createdAt.getTime() + randInt(1, 60) * DIA_MS)
    });
  }

  return usuarios;
};

/**
 * Elige una fecha de creación dentro del último año, ponderando estacionalidad
 * (más reportes en otoño/invierno) y adopción creciente de la plataforma.
 *
 * @returns {Date}
 */
const fechaPonderada = () => {
  for (let i = 0; i < 60; i++) {
    const diasAtras = randInt(0, DIAS_HISTORIA - 1);
    const fecha = new Date(Date.now() - diasAtras * DIA_MS);
    const pesoMes = PESO_MES[fecha.getMonth()];
    // Adopción: cuanto más reciente, más probable (de 0.55 a 1.0).
    const pesoAdopcion = 0.55 + 0.45 * (1 - diasAtras / DIAS_HISTORIA);
    if (rand() < (pesoMes / 1.5) * pesoAdopcion) return conHoraRealista(fecha);
  }
  return conHoraRealista(new Date(Date.now() - randInt(0, DIAS_HISTORIA - 1) * DIA_MS));
};

/** Cantidad de reportes de un grupo, según la distribución de cola larga. */
const cantidadReportes = () => {
  let r = rand();
  for (const { n, p } of DIST_REPORTES) {
    r -= p;
    if (r <= 0) return n;
  }
  return 1;
};

/** Probabilidad de que un grupo de esa antigüedad ya esté finalizado. */
const probFinalizado = (edadDias) => {
  if (edadDias > 270) return 0.90;
  if (edadDias > 180) return 0.85;
  if (edadDias > 90) return 0.72;
  if (edadDias > 30) return 0.50;
  if (edadDias > 7) return 0.25;
  return 0.05;
};

/**
 * Días hasta la resolución. Inversamente correlacionado con la prioridad:
 * lo urgente se atiende más rápido. Incluye una cola de casos extremos.
 */
const diasResolucion = (prioridad) => {
  const mu = Math.max(4, 46 - prioridad * 3.6);
  let dias = Math.round(gauss(mu, mu * 0.55, 1, 400));
  if (chance(0.03)) dias = Math.round(dias * randInt(3, 6)); // expedientes trabados
  return Math.max(1, dias);
};

/**
 * Genera los grupos y sus incidentes.
 *
 * @param {Object} refs Referencias resueltas de la base (estados, categorías, barrios, usuarios...).
 * @returns {{ grupos: Array, incidentes: Array, stats: Object }}
 */
const generarIncidentes = (refs) => {
  const { statusByName, categoryByName, barrios, usuarios, admins, aiUserId } = refs;

  const grupos = [];
  const incidentes = [];
  const ahora = Date.now();

  // Pesos de barrio desiguales: unos pocos barrios concentran la mayor parte de los reportes.
  const pesosBarrio = {};
  barrios.forEach((b, i) => { pesosBarrio[i] = 1 / Math.pow(i + 1, 0.65); });

  // Reparto desigual de reportes por usuario: hay vecinos que reportan muchísimo.
  const pesosUsuario = {};
  usuarios.forEach((u, i) => { pesosUsuario[i] = 1 / Math.pow(i + 1, 0.55); });

  // Tres tormentas: picos de reportes concentrados, con sesgo a inundación y baches.
  const tormentas = [40, 150, 265].map(d => new Date(ahora - d * DIA_MS));

  const stats = { porCategoria: {}, porEstado: {}, porPrioridad: {}, porCantReportes: {}, duplicados: 0, sinBarrio: 0 };

  while (incidentes.length < TARGET_INCIDENTS) {
    const esTormenta = chance(0.08);

    let categoriaNombre;
    let createdAt;

    if (esTormenta) {
      const t = pick(tormentas);
      createdAt = conHoraRealista(new Date(t.getTime() + randInt(0, 3) * DIA_MS));
      categoriaNombre = pickWeighted({ 'Inundacion': 0.45, 'bache': 0.25, 'otro': 0.20, 'basura': 0.10 });
    } else {
      createdAt = fechaPonderada();
      categoriaNombre = pickWeighted(PESO_CATEGORIA);
    }

    if (createdAt.getTime() > ahora) createdAt = new Date(ahora - randInt(1, 48) * 3600000);

    const categoria = categoryByName[categoriaNombre];
    if (!categoria) continue;

    // --- Ubicación: punto dentro del polígono real del barrio ---
    const barrioIdx = Number(pickWeighted(pesosBarrio));
    const barrio = barrios[barrioIdx];
    let punto = randomPointIn(barrio.geometry.coordinates, barrio._bbox);
    if (!punto) continue;

    let neighborhoodId = barrio._id;

    // Coordenada mal capturada: cae fuera de la ciudad y se queda sin barrio.
    if (chance(SUCIEDAD.incidenteFueraDeCiudad)) {
      punto = { lat: punto.lat + (chance(0.5) ? 1 : -1) * (0.4 + rand()), lng: punto.lng + (0.4 + rand()) };
      neighborhoodId = null;
      stats.sinBarrio++;
    }

    // --- Prioridad: base por gravedad + 1 por cada reporte extra, tope 10 ---
    const nReportes = cantidadReportes();
    const [pMin, pMax] = PRIORIDAD_BASE[categoriaNombre] || [1, 4];
    const base = randInt(pMin, pMax);
    let prioridad = Math.min(base + (nReportes - 1), 10);

    // Override manual del admin: rompe la correlación reportes↔prioridad a propósito.
    // Es lo que hace `updateGroupPriority` en la app real y genera los casos atípicos
    // que pide analizar la Sección 5 del TP.
    if (chance(0.08)) {
      prioridad = chance(0.5) ? randInt(8, 10) : randInt(1, 3);
    }

    const esEmergencia = chance(PROB_EMERGENCIA[categoriaNombre] ?? 0.02);
    if (esEmergencia) prioridad = Math.max(prioridad, 8);

    // --- Estado y fechas ---
    const edadDias = (ahora - createdAt.getTime()) / DIA_MS;
    const dias = diasResolucion(prioridad);
    const puedeFinalizar = dias < edadDias;
    const finalizado = puedeFinalizar && chance(probFinalizado(edadDias));

    let estadoFinalNombre;
    let finalizedAt = null;
    let historial;

    const t0 = createdAt;
    const admin = pick(admins);

    if (finalizado) {
      estadoFinalNombre = pickWeighted({ 'resuelto': 0.70, 'rechazado': 0.22, 'cancelado': 0.08 });
      finalizedAt = new Date(t0.getTime() + dias * DIA_MS);

      if (estadoFinalNombre === 'resuelto') {
        const t1 = new Date(t0.getTime() + dias * 0.15 * DIA_MS);
        const t2 = new Date(t0.getTime() + dias * 0.45 * DIA_MS);
        historial = [
          { status: statusByName['pendiente'], changedAt: t0, changedBy: aiUserId, source: 'ai' },
          { status: statusByName['aceptado'], changedAt: t1, changedBy: admin, source: 'admin' },
          { status: statusByName['en_proceso'], changedAt: t2, changedBy: admin, source: 'admin' },
          { status: statusByName['resuelto'], changedAt: finalizedAt, changedBy: admin, source: 'admin' }
        ];
      } else if (estadoFinalNombre === 'rechazado') {
        historial = [
          { status: statusByName['pendiente'], changedAt: t0, changedBy: aiUserId, source: 'ai' },
          { status: statusByName['rechazado'], changedAt: finalizedAt, changedBy: admin, source: 'admin' }
        ];
      } else {
        historial = [
          { status: statusByName['pendiente'], changedAt: t0, changedBy: aiUserId, source: 'ai' },
          { status: statusByName['cancelado'], changedAt: finalizedAt, changedBy: null, source: 'system' }
        ];
      }
    } else {
      estadoFinalNombre = pickWeighted({ 'pendiente': 0.50, 'aceptado': 0.28, 'en_proceso': 0.22 });
      historial = [{ status: statusByName['pendiente'], changedAt: t0, changedBy: aiUserId, source: 'ai' }];

      if (estadoFinalNombre !== 'pendiente') {
        const t1 = new Date(t0.getTime() + Math.min(edadDias * 0.3, 12) * DIA_MS);
        historial.push({ status: statusByName['aceptado'], changedAt: t1, changedBy: admin, source: 'admin' });
      }
      if (estadoFinalNombre === 'en_proceso') {
        const t2 = new Date(t0.getTime() + Math.min(edadDias * 0.6, 25) * DIA_MS);
        historial.push({ status: statusByName['en_proceso'], changedAt: t2, changedBy: admin, source: 'admin' });
      }
    }

    // Inconsistencia: estado final pero sin fecha de finalización cargada.
    if (finalizado && chance(SUCIEDAD.grupoFinalSinFecha)) finalizedAt = null;

    const estadoGrupoId = statusByName[estadoFinalNombre];
    const grupoId = new mongoose.Types.ObjectId();

    // --- Incidentes del grupo (todos dentro de ~20 m entre sí) ---
    const idsIncidentes = [];
    let mejorScore = -1;
    let representativeId = null;

    for (let r = 0; r < nReportes; r++) {
      const usuarioIdx = Number(pickWeighted(pesosUsuario));
      const usuario = usuarios[usuarioIdx];

      // Los reportes duplicados van llegando en los días siguientes al primero.
      const offsetHoras = r === 0 ? 0 : randInt(1, Math.max(2, Math.min(96, Math.floor(dias * 12))));
      const fechaReporte = new Date(t0.getTime() + offsetHoras * 3600000);

      const plantilla = PLANTILLAS[categoriaNombre] || PLANTILLAS['otro'];
      const calle = pick(CALLES);
      const calle2 = pick(CALLES.filter(c => c !== calle));
      const nro = randInt(100, 3500);
      const reemplazar = (s) => s
        .replace(/{calle}/g, calle)
        .replace(/{calle2}/g, calle2)
        .replace(/{nro}/g, nro)
        .replace(/{barrio}/g, barrio.name);

      const title = reemplazar(pick(plantilla.titulos)).slice(0, 100);
      const description = reemplazar(pick(plantilla.descripciones)).slice(0, 1000);

      const esCancelado = estadoFinalNombre === 'cancelado' || (nReportes > 1 && chance(0.04));
      const estadoIncidenteId = esCancelado ? statusByName['cancelado'] : estadoGrupoId;

      let aiCategoria = categoriaIASucia(categoriaNombre);
      if (chance(SUCIEDAD.incidenteSinCategoriaIA)) {
        aiCategoria = pick(['', 'No sugerida', null]);
      }

      const incidenteId = new mongoose.Types.ObjectId();
      const doc = {
        _id: incidenteId,
        title,
        description,
        status: estadoIncidenteId,
        statusHistory: historial.map(h => ({
          _id: new mongoose.Types.ObjectId(),
          status: h.status,
          changedAt: h.changedAt,
          changedBy: h.changedBy,
          source: h.source === 'system' ? 'user' : h.source // enum del incidente: user|admin|ai
        })),
        photos: [],
        location: {
          lat: Number((punto.lat + (rand() - 0.5) * OFFSET_LAT).toFixed(7)),
          lng: Number((punto.lng + (rand() - 0.5) * OFFSET_LNG).toFixed(7)),
          address: `${calle} ${nro}`
        },
        category: categoria._id,
        user: usuario._id,
        group: grupoId,
        ai_justification: `Reporte válido de infraestructura urbana (${categoriaNombre}). Prioridad sugerida ${base}.`,
        ai_suggested_category: aiCategoria,
        is_emergency: esEmergencia && r === 0,
        is_dubious: false,
        is_cancelled: esCancelado,
        createdAt: fechaReporte,
        updatedAt: finalizedAt || fechaReporte,
        __v: 0,
        _seed: SEED_TAG
      };

      incidentes.push(doc);
      idsIncidentes.push(incidenteId);

      // Mismo criterio de representante que `calcularScoreRepresentante` en el service.
      const score = title.trim().length * 0.4 + description.trim().length * 0.6;
      if (!esCancelado && score > mejorScore) {
        mejorScore = score;
        representativeId = incidenteId;
      }

      // Doble submit: la misma persona manda el reporte dos veces con segundos de diferencia.
      if (chance(SUCIEDAD.incidenteDuplicado)) {
        const dupId = new mongoose.Types.ObjectId();
        incidentes.push({
          ...doc,
          _id: dupId,
          statusHistory: doc.statusHistory.map(h => ({ ...h, _id: new mongoose.Types.ObjectId() })),
          createdAt: new Date(fechaReporte.getTime() + randInt(3, 40) * 1000)
        });
        idsIncidentes.push(dupId);
        stats.duplicados++;
      }
    }

    if (!representativeId) representativeId = idsIncidentes[0];

    // Inconsistencia: prioridad 0, fuera del rango válido 1-10 que exige la app.
    const prioridadFinal = chance(SUCIEDAD.grupoPrioridadCero) ? 0 : prioridad;

    grupos.push({
      _id: grupoId,
      status: estadoGrupoId,
      statusHistory: historial.map(h => ({
        _id: new mongoose.Types.ObjectId(),
        status: h.status,
        changedAt: h.changedAt,
        changedBy: h.changedBy,
        source: h.source // enum del grupo: admin|ai|system
      })),
      category: categoria._id,
      priority: prioridadFinal,
      representativeId,
      incidents: idsIncidentes,
      neighborhood: neighborhoodId,
      ai_suggestion: { confianza: null, razon: null, idGrupoCandidato: null, estado: null },
      is_emergency: esEmergencia,
      isArchived: finalizado && edadDias > 300 && chance(0.4),
      finalizedAt,
      createdAt: t0,
      updatedAt: finalizedAt || t0,
      __v: 0,
      _seed: SEED_TAG
    });

    stats.porCategoria[categoriaNombre] = (stats.porCategoria[categoriaNombre] || 0) + 1;
    stats.porEstado[estadoFinalNombre] = (stats.porEstado[estadoFinalNombre] || 0) + 1;
    stats.porPrioridad[prioridadFinal] = (stats.porPrioridad[prioridadFinal] || 0) + 1;
    stats.porCantReportes[idsIncidentes.length] = (stats.porCantReportes[idsIncidentes.length] || 0) + 1;
  }

  return { grupos, incidentes, stats };
};

// ==========================================
// EJECUCIÓN
// ==========================================

const rollback = async () => {
  const filtro = { _seed: SEED_TAG };
  const g = await IncidentGroup.collection.deleteMany(filtro);
  const i = await Incident.collection.deleteMany(filtro);
  const u = await User.collection.deleteMany(filtro);
  console.log(`🧹 Rollback: ${g.deletedCount} grupos, ${i.deletedCount} incidentes, ${u.deletedCount} usuarios eliminados.`);
};

const seed = async ({ dryRun }) => {
  // Referencias existentes en la base.
  const [statuses, categories, barriosRaw, rolUser, rolAi] = await Promise.all([
    Status.find(),
    Category.find(),
    Neighborhood.find(),
    Role.findOne({ name: 'user' }),
    Role.findOne({ name: 'ai' })
  ]);

  const statusByName = Object.fromEntries(statuses.map(s => [s.name, s._id]));
  const categoryByName = Object.fromEntries(categories.map(c => [c.name, c]));

  const requeridos = ['pendiente', 'aceptado', 'en_proceso', 'resuelto', 'rechazado', 'cancelado'];
  const faltantes = requeridos.filter(n => !statusByName[n]);
  if (faltantes.length) throw new Error(`Faltan estados en la base: ${faltantes.join(', ')}. Corré primero utils/seed.js`);
  if (!rolUser) throw new Error('Falta el rol "user". Corré primero utils/seed.js');
  if (!barriosRaw.length) throw new Error('No hay barrios cargados. Corré primero utils/seed.js');

  const barrios = barriosRaw
    .filter(b => b.geometry?.type === 'Polygon' && Array.isArray(b.geometry.coordinates))
    .map(b => ({ _id: b._id, name: b.name, geometry: b.geometry, _bbox: bboxOf(b.geometry.coordinates) }));

  const aiUser = await User.findOne({ clerkId: 'ai_system' }).select('_id');
  const rolesAdmin = await Role.find({ name: { $in: ['admin', 'superAdmin'] } });
  const admins = (await User.find({ role: { $in: rolesAdmin.map(r => r._id) } }).select('_id')).map(u => u._id);

  if (!admins.length) throw new Error('No hay usuarios admin para firmar los cambios de estado.');

  console.log(`📚 Referencias: ${statuses.length} estados, ${categories.length} categorías, ${barrios.length} barrios, ${admins.length} admins.`);

  // Generación.
  const usuarios = generarUsuarios(rolUser._id, barrios);
  const { grupos, incidentes, stats } = generarIncidentes({
    statusByName, categoryByName, barrios, usuarios, admins, aiUserId: aiUser?._id ?? null
  });

  // Reporte.
  console.log(`\n📊 GENERADO`);
  console.log(`   Usuarios:   ${usuarios.length} (incluye ${SUCIEDAD.userDuplicadoLogico} duplicados lógicos)`);
  console.log(`   Grupos:     ${grupos.length}`);
  console.log(`   Incidentes: ${incidentes.length} (${stats.duplicados} por doble submit)`);
  console.log(`   Sin barrio (coordenada mal capturada): ${stats.sinBarrio}`);
  console.log(`\n   Por categoría:`, stats.porCategoria);
  console.log(`   Por estado:   `, stats.porEstado);
  console.log(`   Por prioridad:`, Object.fromEntries(Object.entries(stats.porPrioridad).sort((a, b) => a[0] - b[0])));
  console.log(`   Reportes por grupo:`, Object.fromEntries(Object.entries(stats.porCantReportes).sort((a, b) => a[0] - b[0])));

  const fechas = grupos.map(g => g.createdAt).sort((a, b) => a - b);
  console.log(`   Rango temporal: ${fechas[0].toISOString().slice(0, 10)} → ${fechas[fechas.length - 1].toISOString().slice(0, 10)}`);

  const finalizados = grupos.filter(g => g.finalizedAt);
  const tiempos = finalizados.map(g => (g.finalizedAt - g.createdAt) / DIA_MS);
  const prom = tiempos.reduce((a, b) => a + b, 0) / (tiempos.length || 1);
  console.log(`   Grupos con finalizedAt: ${finalizados.length} | tiempo medio de resolución: ${prom.toFixed(1)} días`);

  if (dryRun) {
    console.log('\n🌵 --dry-run: no se escribió nada en Mongo.');
    return;
  }

  // Inserción con el driver crudo: nos deja fijar createdAt/updatedAt propios
  // (Mongoose los sobrescribiría) y omitir campos como `dni`.
  console.log('\n💾 Insertando...');
  await User.collection.insertMany(usuarios, { ordered: false });
  console.log(`   ✔ ${usuarios.length} usuarios`);

  for (let i = 0; i < incidentes.length; i += 500) {
    await Incident.collection.insertMany(incidentes.slice(i, i + 500), { ordered: false });
  }
  console.log(`   ✔ ${incidentes.length} incidentes`);

  for (let i = 0; i < grupos.length; i += 500) {
    await IncidentGroup.collection.insertMany(grupos.slice(i, i + 500), { ordered: false });
  }
  console.log(`   ✔ ${grupos.length} grupos`);

  console.log(`\n🎉 Listo. Para revertir: node utils/seedAnalytics.js --rollback`);
};

const main = async () => {
  const args = process.argv.slice(2);
  try {
    await mongoConnect();
    if (args.includes('--rollback')) {
      await rollback();
    } else {
      await seed({ dryRun: args.includes('--dry-run') });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

main();
