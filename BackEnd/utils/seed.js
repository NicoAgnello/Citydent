require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const mongoConnect = require('../config/mongoConnet');
const Status = require('../models/status');
const Category = require('../models/category');

const statuses = [
  { name: 'pendiente', description: 'El incidente fue reportado y está esperando revisión.' },
  { name: 'en_proceso', description: 'El incidente está siendo atendido.' },
  { name: 'resuelto', description: 'El incidente fue resuelto.' },
  { name: 'dudoso', description: 'El incidente es dudoso y necesita revisión.' },
  { name: 'rechazado', description: 'El incidente fue rechazado por no cumplir con los criterios.' }
];

const categories = [
  { name: 'bache', description: 'Problemas en el pavimento.' },
  { name: 'alumbrado', description: 'Problemas con el alumbrado público.' },
  { name: 'basura', description: 'Acumulación de residuos en la vía pública.' },
  { name: 'vandalismo', description: 'Daños al mobiliario urbano.' },
  { name: 'otro', description: 'Otros tipos de incidentes.' }
];

const seed = async () => {
  try {
    await mongoConnect();
    console.log('Conectado a la DB');

    // Insertar solo los que no existen
    for (const status of statuses) {
      await Status.findOneAndUpdate(
        { name: status.name },
        status,
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`✔ Estado: ${status.name}`);
    }

    for (const category of categories) {
      await Category.findOneAndUpdate(
        { name: category.name },
        category,
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`✔ Categoría: ${category.name}`);
    }

    console.log('Seed completado.');
  } catch (error) {
    console.error('Error en el seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de la DB');
  }
};

seed();