const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  estimatedCost: {
    type: Number,
    required: true
  },
  estimatedTime: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  // Full report content (optional fields for detailed rendering)
  projectDetails: { type: mongoose.Schema.Types.Mixed },
  clientDetails: { type: mongoose.Schema.Types.Mixed },
  items: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  searchResults: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  inputData: { type: mongoose.Schema.Types.Mixed },
  editableRates: { type: mongoose.Schema.Types.Mixed },
  rateSelection: { type: mongoose.Schema.Types.Mixed },
  grandTotalCost: { type: Number },
  grandTotalInWords: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', ReportSchema);