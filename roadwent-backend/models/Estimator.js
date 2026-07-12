const mongoose = require('mongoose');

const EstimatorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  roadType: {
    type: String,
    required: true
  },
  roadLength: {
    type: Number,
    required: true
  },
  roadWidth: {
    type: Number,
    required: true
  },
  materials: {
    type: Object,
    default: {}
  },
  laborCost: {
    type: Number,
    default: 0
  },
  equipmentCost: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    required: true
  },
  estimatedTime: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Estimator', EstimatorSchema);