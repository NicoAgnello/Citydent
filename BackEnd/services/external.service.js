const crypto = require('crypto');
const ExternalOtp = require('../models/externalOtp');
const IncidentGroup = require('../models/incidentGroup');
const Incident = require('../models/incident');
const Status = require('../models/status');
const Category = require('../models/category');
const User = require('../models/user');
const Role = require('../models/role');
const { sendExternalOtpEmail } = require('./mail.service');

const OTP_TTL_MINUTES = 5;

// ==========================================
// SOLICITUD DE OTP (superAdmin)
// ==========================================

const requestExternalOtp = async (userId, userEmail) => {
  await ExternalOtp.deleteMany({ userId, used: false });

  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await ExternalOtp.create({ userId, code, expiresAt });
  await sendExternalOtpEmail(userEmail, code);
};

// ==========================================
// VALIDACIÓN DE OTP (Power BI)
// ==========================================

const validateExternalOtp = async (code) => {
  const otp = await ExternalOtp.findOne({ code, used: false });

  if (!otp || otp.expiresAt < new Date()) {
    const error = new Error('Código inválido o expirado.');
    error.status = 401;
    throw error;
  }

  otp.used = true;
  await otp.save();
};

// ==========================================
// DATOS (5 tablas)
// ==========================================

const getExternalData = async () => {
  const aiRole = await Role.findOne({ name: 'ai' });

  const [groups, incidents, statuses, categories, users] = await Promise.all([
    IncidentGroup.find()
      .populate('status', 'name')
      .populate('category', 'name')
      .populate('representativeId', 'location'),

    Incident.find()
      .populate('status', 'name')
      .populate('category', 'name')
      .populate('user', 'firstName lastName email dni'),

    Status.find().sort({ name: 1 }),

    Category.find().sort({ name: 1 }),

    User.find({ role: { $ne: aiRole?._id } })
      .populate('role', 'name')
      .populate('barrio', 'name')
  ]);

  return {
    groups: groups.map(g => ({
      id: g._id,
      status: g.status?.name || null,
      category: g.category?.name || null,
      priority: g.priority,
      incidentCount: g.incidents.length,
      isEmergency: g.is_emergency,
      isArchived: g.isArchived,
      lat: g.representativeId?.location?.lat || null,
      lng: g.representativeId?.location?.lng || null,
      finalizedAt: g.finalizedAt,
      createdAt: g.createdAt
    })),

    incidents: incidents.map(i => ({
      id: i._id,
      groupId: i.group,
      status: i.status?.name || null,
      category: i.category?.name || null,
      aiSuggestedCategory: i.ai_suggested_category,
      isDubious: i.is_dubious,
      isCancelled: i.is_cancelled,
      isEmergency: i.is_emergency,
      lat: i.location?.lat || null,
      lng: i.location?.lng || null,
      userName: i.user ? `${i.user.firstName} ${i.user.lastName}`.trim() : null,
      userEmail: i.user?.email || null,
      userDni: i.user?.dni || null,
      createdAt: i.createdAt
    })),

    statuses: statuses.map(s => ({
      id: s._id,
      name: s.name,
      description: s.description
    })),

    categories: categories.map(c => ({
      id: c._id,
      name: c.name,
      description: c.description
    })),

    users: users.map(u => ({
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      dni: u.dni,
      telefono: u.telefono,
      role: u.role?.name || null,
      ciudad: u.ciudad,
      barrio: u.barrio?.name || null,
      provincia: u.provincia,
      profileComplete: u.profileComplete,
      isBanned: u.isBanned,
      createdAt: u.createdAt
    }))
  };
};

module.exports = { requestExternalOtp, validateExternalOtp, getExternalData };
