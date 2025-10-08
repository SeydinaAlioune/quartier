const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  appName: { type: String, default: '' },
  description: { type: String, default: '' },
  websiteUrl: { type: String, default: '' },
  mode: { type: String, enum: ['test', 'live'], default: 'test' },
  services: {
    invoicePaymentEnabled: { type: Boolean, default: true }
  },
  masterKey: { type: String, default: '' },
  testPublicKey: { type: String, default: '' },
  testPrivateKey: { type: String, default: '' },
  testToken: { type: String, default: '' },
  livePublicKey: { type: String, default: '' },
  livePrivateKey: { type: String, default: '' },
  liveToken: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
