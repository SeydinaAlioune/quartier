const Announcement = require('../models/announcement.model');

// Public: list active announcements (optionally within date window)
exports.getActive = async (req, res) => {
  try {
    const now = new Date();
    const q = { status: 'active' };
    // Only those within start/end if provided
    q.$and = [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] },
    ];

    const list = await Announcement.find(q).sort({ createdAt: -1 }).lean();
    res.json(list.map(a => ({
      id: String(a._id),
      title: a.title,
      description: a.description,
      buttonText: a.buttonText || '',
      link: a.link || '',
      startsAt: a.startsAt,
      endsAt: a.endsAt,
    })));
  } catch (e) {
    console.error('Announcements getActive error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des annonces importantes' });
  }
};

// Admin: list all announcements (optionally filtered by status)
exports.getAll = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const q = {};
    if (status && status !== 'all') q.status = status;
    const list = await Announcement.find(q).sort({ createdAt: -1 }).lean();
    res.json(list.map(a => ({
      id: String(a._id),
      title: a.title,
      description: a.description,
      buttonText: a.buttonText || '',
      link: a.link || '',
      status: a.status,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })));
  } catch (e) {
    console.error('Announcements getAll error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des annonces (admin)' });
  }
};

// Admin: create
exports.create = async (req, res) => {
  try {
    const { title, description, buttonText = '', link = '', status = 'active', startsAt, endsAt } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Titre et description requis' });
    const a = await Announcement.create({ title: title.trim(), description: description.trim(), buttonText, link, status, startsAt, endsAt });
    res.status(201).json({ id: a._id });
  } catch (e) {
    console.error('Announcements create error', e);
    res.status(500).json({ message: "Erreur lors de la création de l'annonce" });
  }
};

// Admin: update
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {};
    ['title', 'description', 'buttonText', 'link', 'status', 'startsAt', 'endsAt'].forEach(k => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });
    const updated = await Announcement.findByIdAndUpdate(id, payload, { new: true });
    if (!updated) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json({ id: updated._id });
  } catch (e) {
    console.error('Announcements update error', e);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'annonce" });
  }
};

// Admin: delete
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Announcement.findById(id);
    if (!a) return res.status(404).json({ message: 'Annonce introuvable' });
    await a.deleteOne();
    res.json({ message: 'Annonce supprimée' });
  } catch (e) {
    console.error('Announcements delete error', e);
    res.status(500).json({ message: "Erreur lors de la suppression de l'annonce" });
  }
};
