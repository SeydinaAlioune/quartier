const PaymentConfig = require('../models/paymentConfig.model');

function maskSecret(s) {
  if (!s) return '';
  const str = String(s);
  if (str.length <= 8) return '••••';
  return str.slice(0, 4) + '••••' + str.slice(-4);
}

function maskConfig(cfg) {
  if (!cfg) return cfg;
  return {
    ...cfg,
    masterKey: maskSecret(cfg.masterKey),
    testPublicKey: maskSecret(cfg.testPublicKey),
    testPrivateKey: maskSecret(cfg.testPrivateKey),
    testToken: maskSecret(cfg.testToken),
    livePublicKey: maskSecret(cfg.livePublicKey),
    livePrivateKey: maskSecret(cfg.livePrivateKey),
    liveToken: maskSecret(cfg.liveToken),
  };
}

exports.getConfig = async (req, res) => {
  try {
    let cfg = await PaymentConfig.findOne().lean();
    if (!cfg) {
      cfg = await PaymentConfig.create({ appName: 'testquartier', description: "c'est une application communale", mode: 'test', services: { invoicePaymentEnabled: true } });
      cfg = cfg.toObject();
    }
    const reveal = String(req.query.reveal || '').toLowerCase() === '1' || String(req.query.reveal || '').toLowerCase() === 'true';
    const result = reveal ? cfg : maskConfig(cfg);
    res.json(result);
  } catch (e) {
    console.error('getConfig error', e);
    res.status(500).json({ message: "Erreur lors de la récupération de la configuration de paiement" });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const body = req.body || {};
    let cfg = await PaymentConfig.findOne();
    if (!cfg) cfg = new PaymentConfig();

    // Mise à jour des champs simples
    const simpleFields = ['appName', 'description', 'websiteUrl', 'mode'];
    simpleFields.forEach(f => {
      if (body[f] !== undefined) cfg[f] = body[f];
    });
    if (body.services && typeof body.services === 'object') {
      cfg.services = { ...cfg.services, ...body.services };
    }

    // Mise à jour des secrets si fournis et non masqués
    const secretFields = ['masterKey','testPublicKey','testPrivateKey','testToken','livePublicKey','livePrivateKey','liveToken'];
    secretFields.forEach(f => {
      if (typeof body[f] === 'string' && body[f] && !/^•+$/u.test(body[f])) {
        cfg[f] = body[f];
      }
    });

    await cfg.save();
    res.json({ message: 'Configuration mise à jour', config: cfg });
  } catch (e) {
    console.error('updateConfig error', e);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la configuration" });
  }
};
