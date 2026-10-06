const crypto = require('crypto');
const User = require('../models/user');
const Role = require('../models/role');
const Neighborhood = require('../models/neighborhood');
const { sendVerificationEmail } = require('./mail.service');
const mongoose = require('mongoose');

const DNI_REGEX = /^\d{8}$/;
const TELEFONO_REGEX = /^\d{10}$/;
const CODIGO_POSTAL_REGEX = /^\d{4}([A-Z]{3})?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Escapa caracteres especiales de regex para usar un texto libre en un `$regex` seguro.
 *
 * @param {string} str Texto a escapar.
 * @returns {string} Texto seguro para construir un RegExp.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Indica si un usuario tiene el perfil completo (todos los campos obligatorios).
 *
 * @param {Object} u Usuario o conjunto de campos a evaluar.
 * @returns {boolean} true si dni, teléfono, dirección, ciudad, provincia y CP están presentes.
 */
const isProfileComplete = (u) =>
  !!(u.dni && u.telefono && u.direccion && u.ciudad && u.provincia && u.codigoPostal);

// ==========================================
// 1. CONSULTAS
// ==========================================

/**
 * Lista los usuarios (más recientes primero), excluyendo el usuario de sistema
 * de la IA, con rol y barrio poblados.
 *
 * @returns {Promise<Array<Object>>} Usuarios.
 */
const getUsers = async () => {
  const aiRole = await Role.findOne({ name: 'ai' });
  const excludeIds = aiRole ? [aiRole._id] : [];
  return await User.find({ role: { $nin: excludeIds } })
    .populate('role')
    .populate('barrio', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Versión paginada y filtrada de `getUsers`, pensada para la tabla de
 * administración (evita mandar el listado completo al front). Excluye al
 * usuario de sistema de la IA igual que `getUsers`.
 *
 * @param {Object} params
 * @param {number} [params.page=1]    Página (1-based).
 * @param {number} [params.limit=20]  Tamaño de página (máx. 100).
 * @param {string} [params.search=''] Busca en nombre, apellido y email (incluye nombre completo).
 * @param {string} [params.role='']   Nombre de rol a filtrar ('' o 'todos' = todos los roles no-ai).
 * @returns {Promise<{users: Array<Object>, pagination: Object}>}
 */
const getUsersPage = async (params = {}) => {
  const { search = '', role = '' } = params;
  const page  = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));

  const aiRole = await Role.findOne({ name: 'ai' });
  const excludeIds = aiRole ? [aiRole._id] : [];
  const query = { role: { $nin: excludeIds } };

  if (role && role !== 'todos') {
    const roleDoc = await Role.findOne({ name: role });
    query.role = roleDoc ? roleDoc._id : null; // rol inexistente → sin resultados
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const regex = new RegExp(escapeRegex(trimmedSearch), 'i');
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: [{ $ifNull: ['$firstName', ''] }, ' ', { $ifNull: ['$lastName', ''] }] },
            regex: escapeRegex(trimmedSearch),
            options: 'i',
          },
        },
      },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .populate('role')
      .populate('barrio', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

/**
 * Obtiene un usuario por ID con su rol poblado.
 *
 * @param {string} userId ObjectId del usuario.
 * @returns {Promise<Object>} Usuario encontrado.
 * @throws {Error} 400 si el id no es válido, 404 si no existe.
 */
const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('El usuario enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId).populate('role');

  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  return user;
};

/**
 * Lista todos los roles (más recientes primero).
 *
 * @returns {Promise<Array<Object>>} Roles.
 */
const getRoles = async () => {
  return await Role.find().sort({ createdAt: -1 });
};

// ==========================================
// 2. VERIFICACIÓN POR MAIL
// ==========================================

/**
 * Genera un código OTP de 6 dígitos (válido 10 min) y lo envía por email para
 * completar el perfil. Solo aplica si el perfil aún no está completo.
 *
 * @param {string} userId ObjectId del usuario.
 * @returns {Promise<void>}
 * @throws {Error} 404 si el usuario no existe, 400 si el perfil ya está completo.
 */
const sendVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  if (user.profileComplete) {
    const error = new Error('El perfil ya está completo, no se requiere verificación.');
    error.status = 400;
    throw error;
  }

  const code = String(crypto.randomInt(100000, 999999));
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await User.findByIdAndUpdate(userId, {
    $set: { verificationToken: code, verificationTokenExpires: expires }
  });

  await sendVerificationEmail(user.email, code);
};

// ==========================================
// 3. PERFIL PROPIO
// ==========================================

/**
 * Devuelve el perfil del usuario autenticado, con rol y barrio poblados.
 *
 * @param {string} userId ObjectId del usuario.
 * @returns {Promise<Object|null>} Perfil del usuario, o null si no existe.
 */
const getMyProfile = async (userId) => {
  return await User.findById(userId)
    .populate('role', 'name')
    .populate('barrio', 'name');
};

/**
 * Actualiza el perfil propio. En el onboarding (primera vez) exige el OTP de
 * verificación; el DNI es obligatorio si no lo tiene e inmutable si ya lo tiene.
 * Recalcula `profileComplete`.
 *
 * @param {string} userId ObjectId del usuario.
 * @param {Object} data   Campos: telefono, direccion, ciudad, barrioId, provincia,
 *                        codigoPostal, dni y verificationToken (OTP en onboarding).
 * @returns {Promise<Object>} Usuario actualizado (rol y barrio poblados).
 * @throws {Error} 404 usuario no existe; 400 OTP/datos inválidos; 409 DNI duplicado.
 */
const updateProfile = async (userId, data) => {
  const { telefono, direccion, ciudad, barrioId, provincia, codigoPostal, dni, verificationToken } = data;
  const errors = [];

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  // Validar OTP solo en el onboarding (primera vez)
  if (!user.profileComplete) {
    if (!verificationToken) {
      const error = new Error('Se requiere el código de verificación.');
      error.status = 400;
      throw error;
    }
    if (
      user.verificationToken !== verificationToken ||
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      const error = new Error('El código de verificación es inválido o expiró.');
      error.status = 400;
      throw error;
    }
  }

  // DNI: obligatorio si el usuario no lo tiene aún, inmutable si ya lo tiene
  if (!user.dni) {
    if (!dni || !DNI_REGEX.test(String(dni))) {
      errors.push('El DNI debe tener exactamente 8 dígitos numéricos.');
    }
  }

  if (!telefono || !TELEFONO_REGEX.test(String(telefono))) {
    errors.push('El teléfono debe tener exactamente 10 dígitos numéricos.');
  }
  if (!direccion || typeof direccion !== 'string' || direccion.trim().length < 3) {
    errors.push('La dirección es obligatoria.');
  }
  if (!ciudad || typeof ciudad !== 'string' || ciudad.trim().length < 2) {
    errors.push('La ciudad es obligatoria.');
  }
  if (!provincia || typeof provincia !== 'string' || provincia.trim().length < 2) {
    errors.push('La provincia es obligatoria.');
  }
  if (!codigoPostal || !CODIGO_POSTAL_REGEX.test(String(codigoPostal).toUpperCase())) {
    errors.push('El código postal debe tener 4 dígitos, o formato CPA (ej: A1234ABC).');
  }
  if (barrioId && !mongoose.Types.ObjectId.isValid(barrioId)) {
    errors.push('El barrio enviado no es válido.');
  }

  if (errors.length > 0) {
    const error = new Error('Datos del perfil inválidos.');
    error.status = 400;
    error.details = errors;
    throw error;
  }

  if (!user.dni && dni) {
    const dniExists = await User.findOne({ dni: String(dni), _id: { $ne: user._id } });
    if (dniExists) {
      const error = new Error('Ya existe un usuario con ese DNI.');
      error.status = 409;
      throw error;
    }
  }

  if (barrioId) {
    const barrio = await Neighborhood.findById(barrioId);
    if (!barrio) {
      const error = new Error('Barrio no encontrado.');
      error.status = 404;
      throw error;
    }
  }

  const updateFields = {
    telefono: String(telefono),
    direccion: direccion.trim(),
    ciudad: ciudad.trim(),
    barrio: barrioId || null,
    provincia: provincia.trim(),
    codigoPostal: String(codigoPostal).toUpperCase()
  };
  if (!user.dni && dni) updateFields.dni = String(dni);

  const finalDni = updateFields.dni || user.dni;
  updateFields.profileComplete = isProfileComplete({ ...user.toObject(), ...updateFields, dni: finalDni });

  if (!user.profileComplete) {
    updateFields.verificationToken = null;
    updateFields.verificationTokenExpires = null;
  }

  return await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { returnDocument: 'after' }
  ).populate('role', 'name').populate('barrio', 'name');
};

// ==========================================
// CREACIÓN POR ADMIN
// ==========================================

/**
 * Crea un usuario desde el panel de administración. No permite asignar los roles
 * `superAdmin` ni `ai`. Valida formatos y unicidad de email/DNI.
 *
 * @param {Object} data Datos: email, roleId, firstName, lastName y campos de perfil opcionales.
 * @returns {Promise<Object>} Usuario creado (rol y barrio poblados).
 * @throws {Error} 400 datos inválidos; 403 rol no permitido; 404 rol/barrio no existe; 409 email/DNI duplicado.
 */
const createUserByAdmin = async (data) => {
  const { email, roleId, firstName, lastName, dni, telefono, direccion, ciudad, barrioId, provincia, codigoPostal } = data;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email)) errors.push('El email es inválido.');
  if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) errors.push('El rol es obligatorio y debe ser válido.');
  if (dni && !DNI_REGEX.test(String(dni))) errors.push('El DNI debe tener exactamente 8 dígitos numéricos.');
  if (telefono && !TELEFONO_REGEX.test(String(telefono))) errors.push('El teléfono debe tener exactamente 10 dígitos numéricos.');
  if (codigoPostal && !CODIGO_POSTAL_REGEX.test(String(codigoPostal).toUpperCase())) errors.push('El código postal no tiene un formato válido.');
  if (barrioId && !mongoose.Types.ObjectId.isValid(barrioId)) errors.push('El barrio enviado no es válido.');

  if (errors.length > 0) {
    const error = new Error('Datos inválidos.');
    error.status = 400;
    error.details = errors;
    throw error;
  }

  const role = await Role.findById(roleId);
  if (!role) {
    const error = new Error('Rol no encontrado.');
    error.status = 404;
    throw error;
  }
  if (['superAdmin', 'ai'].includes(role.name)) {
    const error = new Error('No podés asignar el rol superAdmin ni ai.');
    error.status = 403;
    throw error;
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    const error = new Error('Ya existe un usuario con ese email.');
    error.status = 409;
    throw error;
  }

  if (dni) {
    const dniExists = await User.findOne({ dni: String(dni) });
    if (dniExists) {
      const error = new Error('Ya existe un usuario con ese DNI.');
      error.status = 409;
      throw error;
    }
  }

  if (barrioId) {
    const barrio = await Neighborhood.findById(barrioId);
    if (!barrio) {
      const error = new Error('Barrio no encontrado.');
      error.status = 404;
      throw error;
    }
  }

  const fields = {
    clerkId: null,
    email,
    firstName: firstName?.trim() || '',
    lastName: lastName?.trim() || '',
    role: roleId,
    ...(dni && { dni: String(dni) }),
    ...(telefono && { telefono: String(telefono) }),
    ...(direccion && { direccion: direccion.trim() }),
    ...(ciudad && { ciudad: ciudad.trim() }),
    ...(barrioId && { barrio: barrioId }),
    ...(provincia && { provincia: provincia.trim() }),
    ...(codigoPostal && { codigoPostal: String(codigoPostal).toUpperCase() })
  };

  fields.profileComplete = isProfileComplete(fields);

  const newUser = new User(fields);
  await newUser.save();
  return await User.findById(newUser._id).populate('role', 'name').populate('barrio', 'name');
};

// ==========================================
// EDICIÓN DE PERFIL POR ADMIN (parcial)
// ==========================================

/**
 * Edición parcial del perfil de un usuario por un admin: solo modifica los
 * campos provistos y recalcula `profileComplete`.
 *
 * @param {string} targetUserId ObjectId del usuario a editar.
 * @param {Object} data         Campos de perfil a actualizar (todos opcionales).
 * @returns {Promise<Object>} Usuario actualizado (rol y barrio poblados).
 * @throws {Error} 400 id/datos inválidos; 404 usuario no existe; 409 DNI duplicado.
 */
const updateUserProfileByAdmin = async (targetUserId, data) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error('El usuario enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  const { dni, telefono, direccion, ciudad, barrioId, provincia, codigoPostal, firstName, lastName } = data;
  const errors = [];
  const updateFields = {};

  if (dni !== undefined) {
    if (!DNI_REGEX.test(String(dni))) errors.push('El DNI debe tener exactamente 8 dígitos numéricos.');
    else updateFields.dni = String(dni);
  }
  if (telefono !== undefined) {
    if (!TELEFONO_REGEX.test(String(telefono))) errors.push('El teléfono debe tener exactamente 10 dígitos numéricos.');
    else updateFields.telefono = String(telefono);
  }
  if (direccion !== undefined) {
    if (typeof direccion !== 'string' || direccion.trim().length < 3) errors.push('La dirección no es válida.');
    else updateFields.direccion = direccion.trim();
  }
  if (ciudad !== undefined) {
    if (typeof ciudad !== 'string' || ciudad.trim().length < 2) errors.push('La ciudad no es válida.');
    else updateFields.ciudad = ciudad.trim();
  }
  if (provincia !== undefined) {
    if (typeof provincia !== 'string' || provincia.trim().length < 2) errors.push('La provincia no es válida.');
    else updateFields.provincia = provincia.trim();
  }
  if (codigoPostal !== undefined) {
    if (!CODIGO_POSTAL_REGEX.test(String(codigoPostal).toUpperCase())) errors.push('El código postal no tiene un formato válido.');
    else updateFields.codigoPostal = String(codigoPostal).toUpperCase();
  }
  if (barrioId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(barrioId)) errors.push('El barrio enviado no es válido.');
    else {
      const barrio = await Neighborhood.findById(barrioId);
      if (!barrio) errors.push('Barrio no encontrado.');
      else updateFields.barrio = barrioId;
    }
  }
  if (firstName !== undefined) updateFields.firstName = firstName.trim();
  if (lastName !== undefined) updateFields.lastName = lastName.trim();

  if (errors.length > 0) {
    const error = new Error('Datos inválidos.');
    error.status = 400;
    error.details = errors;
    throw error;
  }

  if (updateFields.dni && updateFields.dni !== user.dni) {
    const dniExists = await User.findOne({ dni: updateFields.dni, _id: { $ne: user._id } });
    if (dniExists) {
      const error = new Error('Ya existe un usuario con ese DNI.');
      error.status = 409;
      throw error;
    }
  }

  const merged = { ...user.toObject(), ...updateFields };
  updateFields.profileComplete = isProfileComplete(merged);

  return await User.findByIdAndUpdate(
    targetUserId,
    { $set: updateFields },
    { returnDocument: 'after' }
  ).populate('role', 'name').populate('barrio', 'name');
};

// ==========================================
// 3. CAMBIAR ROL
// ==========================================

/**
 * Cambia el rol de un usuario. No se puede modificar el propio rol, ni asignar
 * `superAdmin`/`ai`, ni modificar a un superAdmin.
 *
 * @param {string} targetUserId ObjectId del usuario a modificar.
 * @param {string} newRoleId    ObjectId del nuevo rol.
 * @param {string} requesterId  ObjectId de quien solicita el cambio.
 * @returns {Promise<Object>} Usuario actualizado (rol poblado).
 * @throws {Error} 400 ids inválidos o mismo rol; 403 acción no permitida; 404 rol/usuario no existe.
 */
const changeUserRole = async (targetUserId, newRoleId, requesterId) => {
  const BLOCKED_ROLE_NAMES = ['superAdmin', 'ai'];

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error('El usuario enviado no es válido.');
    error.status = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(newRoleId)) {
    const error = new Error('El rol enviado no es válido.');
    error.status = 400;
    throw error;
  }

  if (targetUserId.toString() === requesterId.toString()) {
    const error = new Error('No podés modificar tu propio rol.');
    error.status = 403;
    throw error;
  }

  const newRole = await Role.findById(newRoleId);
  if (!newRole) {
    const error = new Error('Rol no encontrado.');
    error.status = 404;
    throw error;
  }

  if (BLOCKED_ROLE_NAMES.includes(newRole.name)) {
    const error = new Error('No podés asignar el rol superAdmin ni ai.');
    error.status = 403;
    throw error;
  }

  const targetUser = await User.findById(targetUserId).populate('role');
  if (!targetUser) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  if (targetUser.role.name === 'superAdmin') {
    const error = new Error('No podés modificar el rol de un superAdmin.');
    error.status = 403;
    throw error;
  }

  if (targetUser.role._id.toString() === newRoleId.toString()) {
    const error = new Error(`El usuario ya tiene el rol ${newRole.name}.`);
    error.status = 400;
    throw error;
  }

  return await User.findByIdAndUpdate(
    targetUserId,
    { $set: { role: newRoleId } },
    { returnDocument: 'after' }
  ).populate('role');
};

// ==========================================
// 3. BANEAR / DESBANEAR
// ==========================================

/**
 * Banea o desbanea un usuario. No se puede banear a uno mismo ni a un superAdmin.
 *
 * @param {string} targetUserId ObjectId del usuario.
 * @param {boolean} isBanned    Nuevo estado de baneo.
 * @param {string} requesterId  ObjectId de quien solicita.
 * @returns {Promise<Object>} Usuario actualizado (rol poblado).
 * @throws {Error} 400 id inválido o estado sin cambios; 403 acción no permitida; 404 usuario no existe.
 */
const banUser = async (targetUserId, isBanned, requesterId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error('El usuario enviado no es válido.');
    error.status = 400;
    throw error;
  }

  if (typeof isBanned !== 'boolean') {
    const error = new Error('El campo isBanned debe ser un booleano.');
    error.status = 400;
    throw error;
  }

  if (targetUserId.toString() === requesterId.toString()) {
    const error = new Error('No podés banearte a vos mismo.');
    error.status = 403;
    throw error;
  }

  const targetUser = await User.findById(targetUserId).populate('role');
  if (!targetUser) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  if (targetUser.role.name === 'superAdmin') {
    const error = new Error('No podés banear a un superAdmin.');
    error.status = 403;
    throw error;
  }

  if (targetUser.isBanned === isBanned) {
    const error = new Error(`El usuario ya se encuentra ${isBanned ? 'baneado' : 'activo'}.`);
    error.status = 400;
    throw error;
  }

  return await User.findByIdAndUpdate(
    targetUserId,
    { $set: { isBanned } },
    { returnDocument: 'after' }
  ).populate('role');
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  getUsers,
  getUsersPage,
  getUserById,
  getMyProfile,
  sendVerification,
  updateProfile,
  createUserByAdmin,
  updateUserProfileByAdmin,
  getRoles,
  changeUserRole,
  banUser
};