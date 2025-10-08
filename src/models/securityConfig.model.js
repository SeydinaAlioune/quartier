const mongoose = require('mongoose');

const policeInfoSchema = new mongoose.Schema({
  title: { type: String, default: 'Patrouilles de Police' },
  message: { type: String, default: '' },
  contact: { type: String, default: '' },
}, { _id: false });

const tipsCategorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  items: [{ type: String }],
}, { _id: false });

const securityConfigSchema = new mongoose.Schema({
  policeInfo: { type: policeInfoSchema, default: () => ({}) },
  tips: { type: [tipsCategorySchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

securityConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SecurityConfig = mongoose.model('SecurityConfig', securityConfigSchema);
module.exports = SecurityConfig;
