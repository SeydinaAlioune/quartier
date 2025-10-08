const SecurityConfig = require('../models/securityConfig.model');

function defaultConfig() {
  return {
    policeInfo: {
      title: 'Patrouilles de Police',
      message: '',
      contact: '',
    },
    tips: [],
  };
}

exports.getConfig = async (req, res) => {
  try {
    const doc = await SecurityConfig.findOne({});
    if (!doc) return res.json(defaultConfig());
    return res.json(doc);
  } catch (e) {
    console.error('getSecurityConfig error:', e);
    res.status(500).json({ message: "Erreur lors du chargement de la configuration sécurité" });
  }
};

exports.upsertConfig = async (req, res) => {
  try {
    const payload = req.body || {};
    // normalize tips: remove empty items, drop empty categories
    if (Array.isArray(payload.tips)) {
      payload.tips = payload.tips
        .map(t => ({
          title: (t.title || '').trim(),
          items: Array.isArray(t.items) ? t.items.map(it => (it || '').trim()).filter(Boolean) : [],
        }))
        .filter(t => t.title || (t.items && t.items.length));
    }
    const updated = await SecurityConfig.findOneAndUpdate(
      {},
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Configuration sécurité mise à jour', config: updated });
  } catch (e) {
    console.error('upsertSecurityConfig error:', e);
    if (e.name === 'ValidationError') return res.status(400).json({ message: 'Données invalides', details: e.errors });
    res.status(500).json({ message: "Erreur lors de la mise à jour de la configuration sécurité" });
  }
};
