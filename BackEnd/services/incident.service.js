const Incident = require('../models/incident');
const IncidentGroup = require('../models/incidentGroup');
const Status = require('../models/status');
const User = require('../models/user');
const Category = require('../models/category');
const Neighborhood = require('../models/neighborhood');
const mongoose = require('mongoose');
const { analizarIncidenteIA } = require('./openai.service');
const { createNotifications } = require('./notification.service');

const CONFIANZA_UMBRAL = 0.85;

/**
 * Escapa caracteres especiales de regex para usar un texto libre en un `$regex` seguro.
 *
 * @param {string} str Texto a escapar.
 * @returns {string} Texto seguro para construir un RegExp.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ==========================================
// VALIDACIONES
// ==========================================

/**
 * Valida los datos crudos de un incidente antes de crearlo.
 *
 * @param {Object} data Datos del formulario (title, description, category, photos, location).
 * @returns {{ isValid: boolean, errors: string[] }} Resultado con la lista de errores.
 */
const validateIncidentData = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string') {
    errors.push('El título es obligatorio y debe ser un texto.');
  } else if (data.title.trim().length === 0) {
    errors.push('El título no puede estar vacío o contener solo espacios.');
  } else if (data.title.trim().length > 100) {
    errors.push('El título no puede exceder los 100 caracteres.');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('La descripción es obligatoria y debe ser un texto.');
  } else if (data.description.trim().length === 0) {
    errors.push('La descripción no puede estar vacía o contener solo espacios.');
  } else if (data.description.trim().length > 1000) {
    errors.push('La descripción no puede exceder los 1000 caracteres.');
  }

  if (!data.category) {
    errors.push('La categoría es obligatoria.');
  } else if (!mongoose.Types.ObjectId.isValid(data.category)) {
    errors.push('La categoría enviada no es válida.');
  }

  if (!Array.isArray(data.photos) || data.photos.length < 1 || data.photos.length > 3) {
    errors.push('Se requiere entre 1 y 3 fotos.');
  }

  if (!Number.isFinite(data.location?.lat) || !Number.isFinite(data.location?.lng)) {
    errors.push('La ubicación es obligatoria.');
  }

  return { isValid: errors.length === 0, errors };
};

// ==========================================
// HELPER: puntaje para elegir representante
// ==========================================

/**
 * Puntaje para elegir el representante de un grupo: pondera más la descripción
 * que el título. Usado como fallback (cancelación/merge), no en la creación.
 *
 * @param {Object} incident Incidente con `title` y `description`.
 * @returns {number} Puntaje (mayor = mejor representante).
 */
const calcularScoreRepresentante = (incident) => {
  const largoTitulo = incident.title?.trim().length || 0;
  const largoDescripcion = incident.description?.trim().length || 0;
  return (largoTitulo * 0.4) + (largoDescripcion * 0.6);
};

// ==========================================
// CREACIÓN
// ==========================================

/**
 * Crea un incidente y lo asigna a un grupo. Según el análisis de IA decide si se
 * suma a un grupo cercano existente (estado `pendiente`, confianza >= 0.85, sin
 * dudosos sin revisar) o si abre su propio grupo (ver ADR-001 y ADR-002).
 * Resuelve además el barrio por intersección geográfica.
 *
 * @param {Object} incidentData       Datos validables del reporte.
 * @param {string} userId             ObjectId del usuario que reporta.
 * @param {Object} aiData             Resultado de `analizarIncidenteIA`.
 * @param {string} [userRole='user']  Rol del usuario.
 * @returns {Promise<Object>} El incidente creado.
 * @throws {Error} 400 si los datos no son válidos; 500 si faltan estados base.
 */
const createIncident = async (incidentData, userId, aiData, userRole = 'user') => {
  const validation = validateIncidentData(incidentData);
  if (!validation.isValid) {
    const error = new Error('Error en los datos del formulario');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const [pendienteStatus, rechazadoStatus] = await Promise.all([
    Status.findOne({ name: 'pendiente' }),
    Status.findOne({ name: 'rechazado' })
  ]);

  if (!pendienteStatus || !rechazadoStatus) {
    const error = new Error('Faltan estados requeridos en el sistema.');
    error.status = 500;
    throw error;
  }

  const isDubious = aiData?.estadoSugerido === 'dudoso';
  const isRechazado = aiData?.estadoSugerido === 'rechazado';
  const incidentStatusId = isRechazado ? rechazadoStatus._id : pendienteStatus._id;
  const grupoStatusId = isRechazado ? rechazadoStatus._id : pendienteStatus._id;
  const aiUser = await User.findOne({ clerkId: 'ai_system' }).select('_id');
  const changedBy = aiUser?._id ?? null;
  const source = 'ai';

  const newIncident = new Incident({
    title: incidentData.title.trim(),
    description: incidentData.description.trim(),
    status: incidentStatusId,
    category: incidentData.category,
    location: incidentData.location,
    photos: incidentData.photos,
    user: userId,
    ai_justification: aiData?.justificacion || 'No justificado',
    ai_suggested_category: aiData?.categoriaSugerida || 'No sugerida',
    is_emergency: aiData?.isEmergency || false,
    is_dubious: isDubious,
    statusHistory: [{ status: incidentStatusId, changedBy, source }]
  });

  const puedeAgruparse =
    aiData?.esDuplicado &&
    aiData?.idGrupoCandidato &&
    mongoose.Types.ObjectId.isValid(aiData.idGrupoCandidato) &&
    (aiData?.confianza || 0) >= CONFIANZA_UMBRAL &&
    !isDubious &&
    !isRechazado;

  if (puedeAgruparse) {
    const grupoExistente = await IncidentGroup.findById(aiData.idGrupoCandidato);

    // Un grupo con un dudoso sin revisar debe quedar AISLADO hasta que un admin lo resuelva.
    // Si acumulara reportes nuevos, al aceptar el dudoso (resolveDubious) se cancelaría el grupo
    // y esos reportes quedarían huérfanos. En ese caso el nuevo incidente arma su propio grupo.
    const tieneDudosoSinRevisar = grupoExistente && await Incident.exists({
      _id: { $in: grupoExistente.incidents },
      is_dubious: true,
      is_cancelled: { $ne: true }
    });

    if (grupoExistente && !tieneDudosoSinRevisar) {
      newIncident.group = grupoExistente._id;
      const savedIncident = await newIncident.save();

      grupoExistente.incidents.push(savedIncident._id);
      grupoExistente.priority = Math.min(grupoExistente.priority + 1, 10);

      if (aiData.esRepresentanteMejor) {
        grupoExistente.representativeId = savedIncident._id;
      }

      if (savedIncident.is_emergency) grupoExistente.is_emergency = true;

      await grupoExistente.save();
      return savedIncident;
    }
  }

  const hasCandidatoConfiable =
    aiData?.idGrupoCandidato &&
    mongoose.Types.ObjectId.isValid(aiData.idGrupoCandidato) &&
    (aiData?.confianza || 0) >= CONFIANZA_UMBRAL;

  const aiSuggestion = (isDubious || isRechazado) && hasCandidatoConfiable
    ? { confianza: aiData.confianza, razon: aiData.justificacion, idGrupoCandidato: aiData.idGrupoCandidato, estado: 'pendiente' }
    : { confianza: null, razon: null, idGrupoCandidato: null, estado: null };

  const incidentId = new mongoose.Types.ObjectId();

  let neighborhoodId = null;
  if (incidentData.location && Number.isFinite(incidentData.location.lat) && Number.isFinite(incidentData.location.lng)) {
    const point = {
      type: "Point",
      coordinates: [incidentData.location.lng, incidentData.location.lat]
    };

    const foundNeighborhood = await Neighborhood.findOne({
      geometry: {
        $geoIntersects: {
          $geometry: point
        }
      }
    });

    if (foundNeighborhood) {
      neighborhoodId = foundNeighborhood._id;
    }

  }

  const nuevoGrupo = new IncidentGroup({
    status: grupoStatusId,
    statusHistory: [{ status: grupoStatusId, changedBy, source }],
    category: incidentData.category,
    priority: aiData?.prioridad ?? 0, 
    representativeId: incidentId,
    incidents: [incidentId],
    is_emergency: aiData?.isEmergency || false,
    ai_suggestion: aiSuggestion,
    neighborhood: neighborhoodId 
  });

  const savedGrupo = await nuevoGrupo.save();

  newIncident._id = incidentId;
  newIncident.group = savedGrupo._id;
  const savedIncident = await newIncident.save();

  return savedIncident;
};

// ==========================================
// LECTURA - USUARIO
// ==========================================

/**
 * Lista los incidentes de un usuario (más recientes primero). El status y la
 * categoría visibles se toman del grupo (salvo cancelados); los dudosos se
 * muestran como "pendiente" al usuario.
 *
 * @param {string} userId ObjectId del usuario.
 * @returns {Promise<Array<Object>>} Incidentes del usuario (objetos planos).
 */
const getIncidentsByUser = async (userId) => {
  const incidents = await Incident.find({ user: userId })
    .populate('category')
    .populate('status')
    .populate({
      path: 'group',
      select: 'status category priority',
      populate: [
        { path: 'status', select: 'name description' },
        { path: 'category', select: 'name' }
      ]
    })
    .sort({ createdAt: -1 });

  return incidents.map(incident => {
    const obj = incident.toObject();
    if (!obj.is_cancelled) {
      obj.status = obj.group?.status || obj.status;
      obj.category = obj.group?.category || obj.category;
      if (obj.is_dubious && obj.status) {
        obj.status = { ...obj.status, name: 'pendiente' };
      }
    }
    return obj;
  });
};

// ==========================================
// LECTURA - ADMIN
// ==========================================

/**
 * Lista todos los grupos de incidentes con el representante, status, categoría,
 * barrio e historial poblados. Vista de administración.
 *
 * @returns {Promise<Array<Object>>} Grupos de incidentes poblados.
 */
const getAllGroups = async () => {
  return await IncidentGroup.find()
    .populate({
      path: 'representativeId',
      populate: [
        { path: 'user', select: 'firstName lastName email' },
        { path: 'status', select: 'name description' },
        { path: 'category', select: 'name description' }
      ]
    })
    .populate('status', 'name description')
    .populate('category', 'name description')
    .populate('neighborhood', 'name') 
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email')
    .sort({ updatedAt: 1, createdAt: -1 });
};

const GROUP_SORT_MAP = {
  priority_asc:  { priority: 1 },
  priority_desc: { priority: -1 },
  date_desc:     { 'rep.createdAt': -1 },
  date_asc:      { 'rep.createdAt': 1 },
  reports_desc:  { reportsCount: -1 },
};

/**
 * Versión paginada y filtrada de `getAllGroups`, pensada para la tabla de
 * administración (evita mandar el listado completo al front). Resuelve en dos
 * pasos: 1) un aggregate liviano solo para encontrar los ids que matchean, el
 * total y los contadores de tabs; 2) un `find().populate(...)` idéntico al de
 * `getAllGroups` sobre esos ids, reordenado según el resultado del aggregate.
 *
 * @param {Object} params
 * @param {number} [params.page=1]        Página (1-based).
 * @param {number} [params.limit=20]      Tamaño de página (máx. 100).
 * @param {string} [params.search='']     Busca en título, dirección y datos del usuario del representante.
 * @param {string[]} [params.statuses]    Nombres de estado a incluir.
 * @param {string[]} [params.categories]  Nombres de categoría a incluir.
 * @param {number[]} [params.priorities]  Prioridades exactas a incluir.
 * @param {boolean} [params.isDubious]    Si es true, solo grupos con representante dudoso.
 * @param {string} [params.dateFrom]      Fecha mínima (creación del representante), formato ISO.
 * @param {string} [params.dateTo]        Fecha máxima (creación del representante), formato ISO.
 * @param {boolean} [params.archived]     Filtra por `isArchived`.
 * @param {string} [params.sortBy]        Uno de `priority_desc|priority_asc|date_desc|date_asc|reports_desc`.
 * @returns {Promise<{groups: Array<Object>, pagination: Object, counts: Object}>}
 */
const getGroupsPage = async (params = {}) => {
  const {
    search = '',
    statuses = [],
    categories = [],
    priorities = [],
    isDubious = false,
    dateFrom,
    dateTo,
    archived = false,
    sortBy = 'priority_desc',
  } = params;

  const page  = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));

  const matchStage = { isArchived: !!archived };

  if (statuses.length) {
    const statusDocs = await Status.find({ name: { $in: statuses } }).select('_id');
    matchStage.status = { $in: statusDocs.map((s) => s._id) };
  }
  if (categories.length) {
    const categoryDocs = await Category.find({ name: { $in: categories } }).select('_id');
    matchStage.category = { $in: categoryDocs.map((c) => c._id) };
  }
  if (priorities.length) {
    matchStage.priority = { $in: priorities.map(Number) };
  }

  const trimmedSearch = search.trim();
  const needsUserLookup = trimmedSearch.length >= 2;

  const pipeline = [
    { $match: matchStage },
    { $lookup: { from: 'incidents', localField: 'representativeId', foreignField: '_id', as: 'rep' } },
    { $unwind: '$rep' },
  ];

  if (needsUserLookup) {
    pipeline.push(
      { $lookup: { from: 'users', localField: 'rep.user', foreignField: '_id', as: 'repUser' } },
      { $unwind: { path: '$repUser', preserveNullAndEmptyArrays: true } },
    );
  }

  const postMatch = {};
  if (isDubious) postMatch['rep.is_dubious'] = true;

  if (dateFrom || dateTo) {
    postMatch['rep.createdAt'] = {};
    if (dateFrom) postMatch['rep.createdAt'].$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      postMatch['rep.createdAt'].$lte = end;
    }
  }

  if (needsUserLookup) {
    const regex = new RegExp(escapeRegex(trimmedSearch), 'i');
    postMatch.$or = [
      { 'rep.title': regex },
      { 'rep.location.address': regex },
      { 'repUser.firstName': regex },
      { 'repUser.lastName': regex },
      { 'repUser.email': regex },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: [{ $ifNull: ['$repUser.firstName', ''] }, ' ', { $ifNull: ['$repUser.lastName', ''] }] },
            regex: escapeRegex(trimmedSearch),
            options: 'i',
          },
        },
      },
    ];
  }

  if (Object.keys(postMatch).length) pipeline.push({ $match: postMatch });

  pipeline.push({ $addFields: { reportsCount: { $size: '$incidents' } } });

  const sortStage = GROUP_SORT_MAP[sortBy] || GROUP_SORT_MAP.priority_desc;

  pipeline.push({
    $facet: {
      ids: [
        { $sort: sortStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _id: 1 } },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await IncidentGroup.aggregate(pipeline);
  const orderedIds = (result?.ids || []).map((d) => d._id);
  const total = result?.totalCount?.[0]?.count || 0;

  const docs = await IncidentGroup.find({ _id: { $in: orderedIds } })
    .populate({
      path: 'representativeId',
      populate: [
        { path: 'user', select: 'firstName lastName email' },
        { path: 'status', select: 'name description' },
        { path: 'category', select: 'name description' }
      ]
    })
    .populate('status', 'name description')
    .populate('category', 'name description')
    .populate('neighborhood', 'name')
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email');

  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  const groups = orderedIds.map((id) => byId.get(id.toString())).filter(Boolean);

  const [activeCount, archivedCount] = await Promise.all([
    IncidentGroup.countDocuments({ isArchived: false }),
    IncidentGroup.countDocuments({ isArchived: true }),
  ]);

  return {
    groups,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    counts: { active: activeCount, archived: archivedCount },
  };
};

// ==========================================
// HISTORIAL
// ==========================================

/**
 * Devuelve el historial de estados de un incidente. Solo lo ve su dueño o un admin.
 *
 * @param {string} incidentId ObjectId del incidente.
 * @param {Object} requester  Quien solicita: `{ id, role }`.
 * @returns {Promise<Object>} Incidente con `statusHistory` poblado.
 * @throws {Error} 404 si no existe, 403 si no tiene permiso.
 */
const getIncidentHistory = async (incidentId, requester) => {
  const incident = await Incident.findById(incidentId)
    .select('title statusHistory user')
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email role');

  if (!incident) {
    const error = new Error('Incidente no encontrado');
    error.status = 404;
    throw error;
  }

  const isAdmin = ['admin', 'superAdmin'].includes(requester?.role);
  if (!isAdmin && incident.user.toString() !== requester?.id?.toString()) {
    const error = new Error('No tenés permiso para ver el historial de este incidente.');
    error.status = 403;
    throw error;
  }

  return incident;
};

/**
 * Devuelve el historial de estados de un grupo (vista de administración).
 *
 * @param {string} groupId ObjectId del grupo.
 * @returns {Promise<Object>} Grupo con `statusHistory` poblado.
 * @throws {Error} 404 si el grupo no existe.
 */
const getGroupHistory = async (groupId) => {
  const group = await IncidentGroup.findById(groupId)
    .select('statusHistory')
    .populate('statusHistory.status', 'name description')
    .populate('statusHistory.changedBy', 'firstName lastName email role');

  if (!group) {
    const error = new Error('Grupo no encontrado');
    error.status = 404;
    throw error;
  }

  return group;
};

// ==========================================
// ACTUALIZACIÓN - ADMIN (sobre el grupo)
// ==========================================

const FINAL_STATUSES = ['rechazado', 'resuelto', 'cancelado'];

const VALID_TRANSITIONS = {
  pendiente:  ['aceptado', 'rechazado'],
  aceptado:   ['en_proceso', 'rechazado'],
  en_proceso: ['resuelto', 'rechazado'],
};

/**
 * Cambia el estado de un grupo (admin), validando la transición permitida y
 * propagándolo a los incidentes no cancelados. Notifica a los usuarios afectados.
 * Si hay un dudoso, solo permite pasar a "aceptado" o "rechazado".
 *
 * @param {string} groupId     ObjectId del grupo.
 * @param {string} newStatusId ObjectId del nuevo estado.
 * @param {string} userId      ObjectId del admin que realiza el cambio.
 * @returns {Promise<Object>} Grupo actualizado.
 * @throws {Error} 400 id/estado inválido; 404 grupo no existe; 409 transición no permitida o grupo finalizado.
 */
const updateGroupStatus = async (groupId, newStatusId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(newStatusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findById(groupId).populate('status', 'name');
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  if (FINAL_STATUSES.includes(group.status?.name)) {
    const error = new Error(`El grupo está en estado "${group.status.name}" y no puede ser modificado.`);
    error.status = 409;
    throw error;
  }

  const [hasDubious, newStatus] = await Promise.all([
    Incident.exists({ _id: { $in: group.incidents }, is_dubious: true, is_cancelled: { $ne: true } }),
    Status.findById(newStatusId)
  ]);

  if (!newStatus) {
    const error = new Error('El estado enviado no existe.');
    error.status = 400;
    throw error;
  }

  const currentStatusName = group.status?.name;
  const allowedTransitions = VALID_TRANSITIONS[currentStatusName];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus?.name)) {
    const error = new Error(`No se puede pasar de "${currentStatusName}" a "${newStatus?.name}".`);
    error.status = 409;
    throw error;
  }

  if (hasDubious && !['aceptado', 'rechazado'].includes(newStatus?.name)) {
    const error = new Error('Un grupo con incidente dudoso solo puede cambiar a "aceptado" o "rechazado".');
    error.status = 400;
    throw error;
  }

  group.status = newStatusId;
  group.statusHistory.push({ status: newStatusId, changedBy: userId, source: 'admin' });
  if (FINAL_STATUSES.includes(newStatus?.name)) group.finalizedAt = new Date();
  await group.save();

  await Incident.updateMany(
    { _id: { $in: group.incidents }, is_cancelled: { $ne: true } },
    {
      $set: { status: newStatusId, ...(hasDubious && { is_dubious: false }) },
      $push: { statusHistory: { status: newStatusId, changedBy: userId, source: 'admin' } }
    }
  );

  // Notificar a cada usuario con su propio incidente
  const affectedIncidents = await Incident.find(
    { _id: { $in: group.incidents }, is_cancelled: { $ne: true } },
    { user: 1, title: 1 }
  );

  const recipients = affectedIncidents
    .filter(i => i.user)
    .map(i => ({ userId: i.user, incidentId: i._id, incidentTitle: i.title }));

  if (recipients.length) {
    await createNotifications(recipients, {
      type: 'status_change',
      message: `El estado de tu incidente fue actualizado a "${newStatus?.name}".`,
      groupId: group._id
    });
  }

  return group;
};

/**
 * Cambia la categoría de un grupo (admin). No se permite si el grupo está finalizado.
 *
 * @param {string} groupId       ObjectId del grupo.
 * @param {string} newCategoryId ObjectId de la nueva categoría.
 * @returns {Promise<Object>} Grupo actualizado.
 * @throws {Error} 400 categoría inválida; 404 grupo no existe; 409 grupo finalizado.
 */
const updateGroupCategory = async (groupId, newCategoryId) => {
  if (!mongoose.Types.ObjectId.isValid(newCategoryId)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findById(groupId).populate('status', 'name');
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  if (FINAL_STATUSES.includes(group.status?.name)) {
    const error = new Error(`El grupo está en estado "${group.status.name}" y no puede ser modificado.`);
    error.status = 409;
    throw error;
  }

  group.category = newCategoryId;
  await group.save();
  return group;
};

/**
 * Sobrescribe manualmente la prioridad de un grupo (admin).
 *
 * @param {string} groupId  ObjectId del grupo.
 * @param {number} priority Prioridad entera entre 1 y 10.
 * @returns {Promise<Object>} Grupo actualizado.
 * @throws {Error} 400 prioridad fuera de rango; 404 grupo no existe; 409 grupo finalizado.
 */
const updateGroupPriority = async (groupId, priority) => {
  const value = Number(priority);
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    const error = new Error('La prioridad debe ser un número entero entre 1 y 10.');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findById(groupId).populate('status', 'name');
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  if (FINAL_STATUSES.includes(group.status?.name)) {
    const error = new Error(`El grupo está en estado "${group.status.name}" y no puede ser modificado.`);
    error.status = 409;
    throw error;
  }

  group.priority = value;
  await group.save();
  return group;
};

// ==========================================
// RESOLUCIÓN DE DUDOSOS - ADMIN (sin ruta activa, lógica lista para merge futuro)
// ==========================================

/**
 * Resuelve un grupo con incidente dudoso (admin). `reject` rechaza el grupo;
 * `accept` mueve el incidente al grupo candidato (merge) si existe, o lo valida
 * en su grupo propio. Lógica lista para el merge futuro (sin ruta activa aún).
 *
 * @param {string} groupId ObjectId del grupo dudoso.
 * @param {('accept'|'reject')} action Acción a aplicar.
 * @param {string} adminId ObjectId del admin.
 * @returns {Promise<Object>} El grupo resultante (candidato si hubo merge).
 * @throws {Error} 400 acción inválida o sin dudosos; 404 grupo no existe; 409 grupo finalizado.
 */
const resolveDubious = async (groupId, action, adminId) => {
  if (!['accept', 'reject'].includes(action)) {
    const error = new Error('La acción debe ser "accept" o "reject".');
    error.status = 400;
    throw error;
  }

  const group = await IncidentGroup.findById(groupId).populate('status', 'name');
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  if (FINAL_STATUSES.includes(group.status?.name)) {
    const error = new Error(`El grupo está en estado "${group.status.name}" y no puede ser modificado.`);
    error.status = 409;
    throw error;
  }

  const incident = await Incident.findOne({
    _id: { $in: group.incidents },
    is_dubious: true,
    is_cancelled: { $ne: true }
  });

  if (!incident) {
    const error = new Error('Este grupo no tiene incidentes dudosos activos.');
    error.status = 400;
    throw error;
  }

  if (action === 'reject') {
    const rechazadoStatus = await Status.findOne({ name: 'rechazado' });
    if (!rechazadoStatus) {
      const error = new Error('Estado "rechazado" no encontrado.');
      error.status = 500;
      throw error;
    }

    group.status = rechazadoStatus._id;
    group.statusHistory.push({ status: rechazadoStatus._id, changedBy: adminId, source: 'admin' });
    group.finalizedAt = new Date();
    group.ai_suggestion.estado = 'rechazado';

    await Incident.updateMany(
      { _id: { $in: group.incidents }, is_cancelled: { $ne: true } },
      {
        $set: { status: rechazadoStatus._id, is_dubious: false },
        $push: { statusHistory: { status: rechazadoStatus._id, changedBy: adminId, source: 'admin' } }
      }
    );

    await group.save();
    return group;
  }

  // action === 'accept'
  const candidateGroupId = group.ai_suggestion?.idGrupoCandidato;

  if (candidateGroupId) {
    const candidateGroup = await IncidentGroup.findById(candidateGroupId);

    if (candidateGroup) {
      candidateGroup.incidents.push(incident._id);
      candidateGroup.priority = Math.min(candidateGroup.priority + 1, 10);

      const repActual = await Incident.findById(candidateGroup.representativeId).select('title description');
      if (repActual) {
        if (calcularScoreRepresentante(incident) > calcularScoreRepresentante(repActual)) {
          candidateGroup.representativeId = incident._id;
        }
      }

      if (incident.is_emergency) candidateGroup.is_emergency = true;
      await candidateGroup.save();

      const cancelledStatus = await Status.findOne({ name: 'cancelado' });
      if (cancelledStatus) {
        group.status = cancelledStatus._id;
        group.statusHistory.push({ status: cancelledStatus._id, changedBy: adminId, source: 'admin' });
        group.finalizedAt = new Date();
      }
      group.ai_suggestion.estado = 'aprobado';
      await group.save();

      await Incident.findByIdAndUpdate(incident._id, {
        $set: {
          is_dubious: false,
          group: candidateGroup._id,
          status: candidateGroup.status
        },
        $push: { statusHistory: { status: candidateGroup.status, changedBy: adminId, source: 'admin' } }
      });

      return candidateGroup;
    }
  }

  // Sin candidato o candidato no encontrado → validar en grupo propio
  await Incident.findByIdAndUpdate(incident._id, { $set: { is_dubious: false } });
  group.ai_suggestion.estado = 'aprobado';
  await group.save();

  return group;
};

// ==========================================
// INCIDENTES DE UN GRUPO - ADMIN
// ==========================================

/**
 * Devuelve los incidentes individuales de un grupo, con usuario, status y
 * categoría poblados (vista de administración).
 *
 * @param {string} groupId ObjectId del grupo.
 * @returns {Promise<Array<Object>>} Incidentes del grupo.
 * @throws {Error} 404 si el grupo no existe.
 */
const getGroupIncidents = async (groupId) => {
  const group = await IncidentGroup.findById(groupId).select('incidents');
  if (!group) {
    const error = new Error('Grupo no encontrado.');
    error.status = 404;
    throw error;
  }

  return await Incident.find({ _id: { $in: group.incidents } })
    .populate('user', 'firstName lastName email')
    .populate('status', 'name description')
    .populate('category', 'name description')
    .sort({ createdAt: -1 });
};

// ==========================================
// CANCELACIÓN - USUARIO
// ==========================================

const CANCELLABLE_STATUSES = ['pendiente', 'aceptado'];

/**
 * Cancela un incidente propio del usuario. Baja la prioridad del grupo (mín. 1);
 * si no quedan incidentes activos cancela el grupo, y si el cancelado era el
 * representante reasigna uno nuevo por score.
 *
 * @param {string} incidentId ObjectId del incidente.
 * @param {string} userId     ObjectId del dueño del incidente.
 * @returns {Promise<Object>} Incidente actualizado.
 * @throws {Error} 404 no existe; 403 no es del usuario; 409 grupo finalizado o estado no cancelable.
 */
const cancelIncident = async (incidentId, userId) => {
  const incident = await Incident.findById(incidentId).populate('status');

  if (!incident) {
    const error = new Error('Incidente no encontrado.');
    error.status = 404;
    throw error;
  }

  if (incident.user.toString() !== userId.toString()) {
    const error = new Error('No tenés permiso para cancelar este incidente.');
    error.status = 403;
    throw error;
  }

  const group = await IncidentGroup.findById(incident.group).populate('status');
  if (group && FINAL_STATUSES.includes(group.status?.name?.toLowerCase())) {
    const error = new Error('El reporte pertenece a un grupo ya finalizado y no puede cancelarse.');
    error.status = 409;
    throw error;
  }

  const currentStatusName = incident.status?.name?.toLowerCase();
  if (!CANCELLABLE_STATUSES.includes(currentStatusName)) {
    const error = new Error('El incidente no puede cancelarse en su estado actual.');
    error.status = 409;
    throw error;
  }

  const cancelledStatus = await Status.findOne({ name: 'cancelado' });
  if (!cancelledStatus) {
    const error = new Error('Estado "cancelado" no encontrado en el sistema.');
    error.status = 500;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $set: { status: cancelledStatus._id, is_cancelled: true },
      $push: { statusHistory: { status: cancelledStatus._id, changedBy: userId, source: 'user' } }
    },
    { returnDocument: 'after' }
  );

  if (group) {
    group.priority = Math.max(group.priority - 1, 1);

    const remainingCount = await Incident.countDocuments({
      _id: { $in: group.incidents },
      is_cancelled: { $ne: true }
    });

    if (remainingCount === 0) {
      group.status = cancelledStatus._id;
      group.statusHistory.push({ status: cancelledStatus._id, changedBy: userId, source: 'system' });
      group.finalizedAt = new Date();
    } else if (group.representativeId.toString() === incidentId.toString()) {
      const remaining = await Incident.find({
        _id: { $in: group.incidents },
        is_cancelled: { $ne: true }
      }).select('title description');

      const newRep = remaining.reduce((best, inc) =>
        calcularScoreRepresentante(inc) > calcularScoreRepresentante(best) ? inc : best
      );
      group.representativeId = newRep._id;
    }

    await group.save();
  }

  return updated;
};

// ==========================================
// SINCRONIZACIÓN MANUAL DE IA (SISTEMA DE COLA)
// ==========================================

let syncQueue = [];
let isSyncRunning = false;

/**
 * Procesa en segundo plano la cola de incidentes con IA fallida, respetando el
 * límite de Gemini (lotes de 5, pausa de 60 s entre lotes). Interno: lo dispara
 * `queueFailedAIIncidents`.
 *
 * @returns {Promise<void>}
 */
const processSyncQueue = async () => {
  isSyncRunning = true;
  console.log(`\n⚙️ [SYNC INIT] Arrancando procesador en segundo plano. Total en cola inicial: ${syncQueue.length}`);

  while (syncQueue.length > 0) {
    // Extraemos hasta 5 incidentes de la cola (el límite de Gemini por minuto)
    const batch = syncQueue.splice(0, 5);
    console.log(`\n🚀 [SYNC BATCH] Iniciando lote de ${batch.length} solicitudes...`);

    for (const incident of batch) {
      console.log(`  -> Sincronizando ID: ${incident._id} | Título: "${incident.title}"`);
      try {
        const aiData = await analizarIncidenteIA(incident.title, incident.description, []);

        if (!aiData.justificacion.includes('[SISTEMA]')) {
          
          // 1. Actualizamos el Incidente (Justificación, Categoría y Emergencia)
          const updatedIncident = await Incident.findByIdAndUpdate(incident._id, {
            ai_justification: aiData.justificacion,
            ai_suggested_category: aiData.categoriaSugerida || 'No sugerida',
            ...(aiData.isEmergency ? { is_emergency: true } : {})
          }, { new: true });

         // 2. Actualizamos la Prioridad (y Emergencia) en su respectivo Grupo
          if (updatedIncident && updatedIncident.group) {
            const group = await IncidentGroup.findById(updatedIncident.group);
            if (group) {
              // Asignamos la prioridad sugerida, respetando si el grupo ya tenía una mayor
              group.priority = Math.max(group.priority, aiData.prioridadSugerida ?? 1); // <-- Usar ?? 1
              if (aiData.isEmergency) group.is_emergency = true;
              
              await group.save();
            }
          }

          console.log(`  ✅ Éxito: Incidente y Grupo (Prioridad sugerida: ${aiData.prioridadSugerida || 1}) actualizados.`);
        } else {
          console.log(`  ⚠️ Advertencia: Gemini volvió a fallar por sobrecarga o devolvió fallback para este incidente.`);
        }
        
        // Pausa de 2 segundos entre incidentes del mismo lote
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`  ❌ Error Crítico en ID ${incident._id}:`, error.message || error);
      }
    }

    // Si después de procesar estos 5 aún quedan elementos en la cola, esperamos 60s
    if (syncQueue.length > 0) {
      console.log(`\n⏳ [SYNC WAIT] Límite de 5 solicitudes/minuto alcanzado.`);
      console.log(`📋 Siguen en cola: ${syncQueue.map(inc => inc._id).join(', ')}`);
      console.log(`💤 Congelando proceso por 60 segundos...`);
      await new Promise(resolve => setTimeout(resolve, 60000)); // 60 segundos
    }
  }

  isSyncRunning = false;
  console.log(`\n🎉 [SYNC DONE] La cola de sincronización ha finalizado por completo.\n`);
};

/**
 * Encola los incidentes cuyo análisis de IA falló (justificación con `[SISTEMA]`,
 * null o vacía), evitando duplicados, y arranca el procesador si no corre.
 *
 * @returns {Promise<{ message: string, totalEnCola: number, nuevosAgregados: number }>}
 */
const queueFailedAIIncidents = async () => {
  // Buscamos los incidentes que requieran revisión
  const incidentsToUpdate = await Incident.find({
    $or: [
      { ai_justification: { $regex: /\[SISTEMA\]/i } },
      { ai_justification: null },
      { ai_justification: "" }
    ]
  }).select('_id title description group'); // <-- Nos aseguramos de traer el campo "group"

  // Filtramos para evitar meter duplicados a la cola
  const newIncidents = incidentsToUpdate.filter(
    inc => !syncQueue.some(queued => queued._id.toString() === inc._id.toString())
  );

  syncQueue.push(...newIncidents);

  // Si el procesador no está corriendo y hay incidentes, lo arrancamos de forma asíncrona
  if (!isSyncRunning && syncQueue.length > 0) {
    processSyncQueue();
  }

  return {
    message: "Proceso de sincronización iniciado en el servidor.",
    totalEnCola: syncQueue.length,
    nuevosAgregados: newIncidents.length
  };
};

/**
 * Cuenta los incidentes cuyo análisis de IA falló (justificación `[SISTEMA]`,
 * null o vacía). Usado para mostrar el contador al admin.
 *
 * @returns {Promise<number>} Cantidad de incidentes pendientes de reprocesar.
 */
const countFailedAIIncidents = async () => {
  return await Incident.countDocuments({
    $or: [
      { ai_justification: { $regex: /\[SISTEMA\]/i } },
      { ai_justification: null },
      { ai_justification: "" }
    ]
  });
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  validateIncidentData,
  createIncident,
  getIncidentsByUser,
  getAllGroups,
  getGroupsPage,
  getIncidentHistory,
  getGroupHistory,
  getGroupIncidents,
  updateGroupStatus,
  updateGroupCategory,
  updateGroupPriority,
  resolveDubious,
  cancelIncident,
  queueFailedAIIncidents,
  countFailedAIIncidents
};