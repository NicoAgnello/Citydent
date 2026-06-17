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

const isProfileComplete = (u) =>
  !!(u.dni && u.telefono && u.direccion && u.ciudad && u.provincia && u.codigoPostal);

// ==========================================
// 1. CONSULTAS
// ==========================================

const getUsers = async () => {
  const aiRole = await Role.findOne({ name: 'ai' });
  const excludeIds = aiRole ? [aiRole._id] : [];
  return await User.find({ role: { $nin: excludeIds } })
    .populate('role')
    .populate('barrio', 'name')
    .sort({ createdAt: -1 });
};

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

const getRoles = async () => {
  return await Role.find().sort({ createdAt: -1 });
};

// ==========================================
// 2. VERIFICACIÓN POR MAIL
// ==========================================

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

const getMyProfile = async (userId) => {
  return await User.findById(userId)
    .populate('role', 'name')
    .populate('barrio', 'name');
};

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