const mongoose = require('mongoose');

const incidentGroupSchema = new mongoose.Schema({
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    required: true
  },
  statusHistory: [
    {
      status: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Status',
        required: true
      },
      changedAt: { type: Date, default: Date.now },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      source: {
        type: String,
        enum: ['admin', 'ai', 'system'],
        required: true
      }
    }
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  priority: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  representativeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true
  },
  incidents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    }
  ],

  neighborhood: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Neighborhood',
    default: null
  },

  ai_suggestion: {
    confianza: { type: Number, default: null },
    razon: { type: String, default: null },
    idGrupoCandidato: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentGroup', default: null },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado'],
      default: null
    }
  },
  is_emergency: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  finalizedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IncidentGroup', incidentGroupSchema);