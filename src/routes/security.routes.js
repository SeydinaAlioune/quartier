const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const securityController = require('../controllers/security.controller');

// Public
router.get('/alerts', securityController.getAlerts);
router.get('/incidents', securityController.getIncidents);
router.get('/alerts/stream', securityController.subscribeAlerts);
router.get('/incidents/stream', securityController.subscribeIncidents);

// Protected
router.use(auth);

// Alerts
router.post('/alerts', checkRole(['admin', 'moderator']), securityController.createAlert);
router.put('/alerts/:id', checkRole(['admin']), securityController.updateAlert);
router.delete('/alerts/:id', checkRole(['admin']), securityController.deleteAlert);

// Incidents
router.post('/incidents', securityController.createIncident);
router.put('/incidents/:id', checkRole(['admin', 'moderator']), securityController.updateIncident);
router.delete('/incidents/:id', checkRole(['admin']), securityController.deleteIncident);

module.exports = router;
