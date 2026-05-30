const User = require('../models/user');
const Role = require('../models/role');

const DNI_REGEX = /^\d{8}$/;

const upsertUser = async ({ clerkId, email, firstName, lastName, dni }) => {
  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    // CREACIÓN — DNI obligatorio
    if (!dni) {
      throw Object.assign(new Error('El DNI es requerido'), { status: 400 });
    }
    if (!DNI_REGEX.test(String(dni))) {
      throw Object.assign(new Error('El DNI debe tener exactamente 8 dígitos numéricos'), { status: 400 });
    }
  }

  const updateFields = { clerkId, email, firstName, lastName };

  // Solo incluir DNI si viene y el usuario no existe aún
  if (!existingUser && dni) {
    updateFields.dni = dni;
  }

  // Preservar el role existente o asignar el ObjectId de 'user' si es nuevo
  if (existingUser) {
    updateFields.role = existingUser.role;
  } else {
    const userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      throw Object.assign(new Error('Rol por defecto no encontrado. Asegurate de haber corrido el seed.'), { status: 500 });
    }
    updateFields.role = userRole._id;
  }

  return await User.findOneAndUpdate(
    { email },
    { $set: updateFields },
    { upsert: true, returnDocument: 'after' }
  ).populate('role');
};

module.exports = { upsertUser };