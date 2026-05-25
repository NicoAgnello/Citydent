const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });
const mongoose = require('mongoose');
const mongoConnect = require('../config/mongoConnet');
const Status = require('../models/status');
const Category = require('../models/category');
const Neighborhood = require('../models/neighborhood');
const fs = require('fs');
const barrios = JSON.parse(fs.readFileSync(`${__dirname}/barrios.geojson`, 'utf-8'));
const statuses = [
  { name: 'pendiente',   description: 'El incidente fue reportado y está esperando revisión.' },
  { name: 'aceptado',    description: 'El incidente fue aceptado y será atendido.' },
  { name: 'en_proceso',  description: 'El incidente está siendo atendido.' },
  { name: 'resuelto',    description: 'El incidente fue resuelto.' },
  { name: 'rechazado',   description: 'El incidente fue rechazado.' },
  { name: 'cancelado',   description: 'El incidente fue cancelado por el usuario.' },
  { name: 'dudoso',      description: 'El incidente no es visible hasta ser verificado.' }
];

const categories = [
  { name: 'bache',       description: 'Problemas en el pavimento.' },
  { name: 'alumbrado',   description: 'Problemas con el alumbrado público.' },
  { name: 'basura',      description: 'Acumulación de residuos en la vía pública.' },
  { name: 'vandalismo',  description: 'Daños al mobiliario urbano.' },
  { name: 'otro',        description: 'Otros tipos de incidentes.' }
];

const seed = async () => {
  try {
    await mongoConnect();
    console.log('Conectado a la DB');

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

    for (const feature of barrios.features) {
      await Neighborhood.findOneAndUpdate(
        { name: feature.properties.nombre },
        {
          name: feature.properties.nombre,
          geometry: feature.geometry
        },
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`✔ Barrio: ${feature.properties.nombre}`);
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