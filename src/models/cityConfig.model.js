const mongoose = require('mongoose');

const mayorOfficeSchema = new mongoose.Schema({
  hoursText: { type: String, default: '' },
  services: [{ type: String }],
  contact: {
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    appointmentUrl: { type: String, default: '' },
  },
}, { _id: false });

const wasteSchema = new mongoose.Schema({
  collectionText: { type: String, default: '' },
  tri: [{ type: String }],
  decheterie: {
    address: { type: String, default: '' },
    hoursText: { type: String, default: '' },
    contact: { type: String, default: '' },
    infoUrl: { type: String, default: '' },
  },
}, { _id: false });

const cityConfigSchema = new mongoose.Schema({
  mayorOffice: { type: mayorOfficeSchema, default: () => ({}) },
  waste: { type: wasteSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cityConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CityConfig = mongoose.model('CityConfig', cityConfigSchema);
module.exports = CityConfig;
