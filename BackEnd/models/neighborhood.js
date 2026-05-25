// models/neighborhood.js
const mongoose = require('mongoose');

const neighborhoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: Array,
      required: true
    }
  }
});

module.exports = mongoose.model('Neighborhood', neighborhoodSchema);