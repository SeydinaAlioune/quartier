const CityConfig = require('../models/cityConfig.model');

// Build a default config object without writing to DB
function buildDefaultConfig() {
  return {
    mayorOffice: {
      hoursText: '',
      services: [],
      contact: {
        address: '',
        phone: '',
        email: '',
        appointmentUrl: '',
      },
    },
    waste: {
      collectionText: '',
      tri: [],
      decheterie: {
        address: '',
        hoursText: '',
        contact: '',
        infoUrl: '',
      },
    },
  };
}

// GET /api/city (public)
exports.getConfig = async (req, res) => {
  try {
    const doc = await CityConfig.findOne({});
    if (!doc) {
      return res.json(buildDefaultConfig());
    }
    return res.json(doc);
  } catch (err) {
    console.error('getCityConfig error:', err);
    return res.status(500).json({ message: "Erreur lors du chargement de la configuration de la ville" });
  }
};

// PUT /api/city (admin)
exports.upsertConfig = async (req, res) => {
  try {
    const payload = req.body || {};
    const updated = await CityConfig.findOneAndUpdate(
      {},
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ message: 'Configuration mise à jour', config: updated });
  } catch (err) {
    console.error('upsertCityConfig error:', err);
    return res.status(500).json({ message: "Erreur lors de la mise à jour de la configuration de la ville" });
  }
};
