const ProjectsConfig = require('../models/projectsConfig.model');

function defaultConfig() {
  return {
    faq: [],
    progressByStatus: {
      proposed: 5,
      planning: 15,
      in_progress: 50,
      completed: 100,
      cancelled: 0,
    },
  };
}

exports.getConfig = async (req, res) => {
  try {
    const doc = await ProjectsConfig.findOne({});
    if (!doc) return res.json(defaultConfig());
    return res.json(doc);
  } catch (e) {
    console.error('getProjectsConfig error:', e);
    res.status(500).json({ message: 'Erreur lors du chargement de la configuration projets' });
  }
};

exports.upsertConfig = async (req, res) => {
  try {
    const payload = req.body || {};
    // Normalize FAQ (remove empty entries)
    if (Array.isArray(payload.faq)) {
      payload.faq = payload.faq
        .map(f => ({
          question: (f.question || '').trim(),
          answer: (f.answer || '').trim(),
        }))
        .filter(f => f.question && f.answer);
    }
    // Normalize progress thresholds (0-100 bounds)
    if (payload.progressByStatus) {
      const keys = ['proposed','planning','in_progress','completed','cancelled'];
      const obj = {};
      for (const k of keys) {
        const v = Number(payload.progressByStatus[k]);
        if (!Number.isNaN(v)) obj[k] = Math.max(0, Math.min(100, Math.round(v)));
      }
      payload.progressByStatus = obj;
    }

    const updated = await ProjectsConfig.findOneAndUpdate(
      {},
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Configuration projets mise à jour', config: updated });
  } catch (e) {
    console.error('upsertProjectsConfig error:', e);
    if (e.name === 'ValidationError') return res.status(400).json({ message: 'Données invalides', details: e.errors });
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la configuration projets' });
  }
};
