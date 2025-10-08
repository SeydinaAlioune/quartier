const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 1000 },
  date: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  zone: { type: String, default: '', maxlength: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const incidentSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 2000 },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['nouveau', 'en_cours', 'resolu'], default: 'nouveau' },
  location: { type: String, default: '', maxlength: 300 },
  locationCoords: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  contact: { type: String, default: '', maxlength: 200 },
  anonymous: { type: Boolean, default: false },
  attachments: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'other'], default: 'image' }
  }],
  reporter: { type: String, default: '' },
  reporterUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const SecurityAlert = mongoose.model('SecurityAlert', alertSchema);
const SecurityIncident = mongoose.model('SecurityIncident', incidentSchema);

module.exports = { SecurityAlert, SecurityIncident };
