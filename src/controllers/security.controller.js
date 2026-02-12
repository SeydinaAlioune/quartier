const { SecurityAlert, SecurityIncident } = require('../models/security.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
// SSE clients registries
const alertsClients = new Set();
const incidentsClients = new Set();

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

exports.subscribeAlerts = (req, res) => {
  res.writeHead(200, sseHeaders());
  alertsClients.add(res);
  req.on('close', () => {
    alertsClients.delete(res);
  });
};

exports.subscribeIncidents = (req, res) => {
  res.writeHead(200, sseHeaders());
  incidentsClients.add(res);
  req.on('close', () => {
    incidentsClients.delete(res);
  });
};

// Alerts
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await SecurityAlert.find().sort('-createdAt');
    res.json(alerts);
  } catch (e) {
    res.status(500).json({ message: "Erreur lors de la récupération des alertes" });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { type, message, severity = 'low', zone = '' } = req.body;
    const alert = await SecurityAlert.create({ type, message, severity, zone, createdBy: req.user?._id });
    alertsClients.forEach(c => sendEvent(c, 'alert:create', alert));
    res.status(201).json(alert);
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ message: 'Données invalides', details: e.errors });
    res.status(500).json({ message: "Erreur lors de la création de l'alerte" });
  }
};

exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await SecurityAlert.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Alerte non trouvée' });
    // Broadcast update
    alertsClients.forEach(c => sendEvent(c, 'alert:update', updated));
    res.json(updated);
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ message: 'Données invalides', details: e.errors });
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'alerte" });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SecurityAlert.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Alerte non trouvée' });
    alertsClients.forEach(c => sendEvent(c, 'alert:delete', { _id: id }));
    res.json({ message: 'Alerte supprimée' });
  } catch (e) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'alerte" });
  }
};

// Incidents
exports.getIncidents = async (req, res) => {
  try {
    const incidents = await SecurityIncident.find().sort('-createdAt');
    res.json(incidents);
  } catch (e) {
    res.status(500).json({ message: "Erreur lors de la récupération des incidents" });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const {
      type,
      description,
      status = 'nouveau',
      reporter = '',
      location = '',
      contact = '',
      anonymous = false,
      date,
      locationCoords,
      attachments,
    } = req.body;
    const payload = {
      type,
      description,
      status,
      reporter,
      reporterUser: req.user?._id,
      location,
      contact,
      anonymous: !!anonymous,
    };
    if (date) payload.date = date; // ISO string or Date
    if (locationCoords && (locationCoords.lat !== undefined || locationCoords.lng !== undefined)) {
      payload.locationCoords = {
        lat: Number(locationCoords.lat),
        lng: Number(locationCoords.lng)
      };
    }
    if (Array.isArray(attachments)) {
      payload.attachments = attachments.map(a => ({ url: a.url, type: a.type || 'image' }));
    }
    const incident = await SecurityIncident.create(payload);

    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      const title = 'Nouveau signalement sécurité';
      const msg = `${incident.type || 'Incident'}${incident.location ? `\nLieu: ${incident.location}` : ''}`;
      await Notification.insertMany(
        admins.map((a) => ({
          recipient: a._id,
          type: 'system_notification',
          title,
          message: msg,
          priority: 'high',
          link: '/admin/security',
          metadata: { sourceType: 'security_incident', sourceId: incident._id }
        })),
        { ordered: false }
      );
    } catch {}

    incidentsClients.forEach(c => sendEvent(c, 'incident:create', incident));
    res.status(201).json(incident);
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ message: 'Données invalides', details: e.errors });
    res.status(500).json({ message: "Erreur lors de la création de l'incident" });
  }
};

exports.updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await SecurityIncident.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Incident non trouvé' });
    incidentsClients.forEach(c => sendEvent(c, 'incident:update', updated));
    res.json(updated);
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ message: 'Données invalides', details: e.errors });
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'incident" });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SecurityIncident.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Incident non trouvé' });
    incidentsClients.forEach(c => sendEvent(c, 'incident:delete', { _id: id }));
    res.json({ message: 'Incident supprimé' });
  } catch (e) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'incident" });
  }
};
