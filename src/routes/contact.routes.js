const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rateLimit.middleware');
const { validateContactSubmit } = require('../middleware/contentValidation.middleware');

// Routes publiques
router.post('/submit', rateLimit({ windowMs: 60_000, max: 5 }), validateContactSubmit, contactController.submitContact);
router.get('/emergency', contactController.getEmergencyContacts);

// Routes nécessitant une authentification et des droits admin
router.use(auth);
router.use(checkRole(['admin']));

// Routes pour la gestion des messages de contact
router.get('/stats/summary', contactController.getContactStats);
router.get('/stats/sources', contactController.getContactSources);
router.post('/mark-all-read', contactController.markAllRead);
router.get('/', contactController.getContacts);
router.put('/:id/status', contactController.updateContactStatus);
router.post('/:id/respond', contactController.respondToContact);
router.get('/:id', contactController.getContact);

// Routes pour la gestion des contacts d'urgence
router.post('/emergency', contactController.createEmergencyContact);
router.put('/emergency/:id', contactController.updateEmergencyContact);

module.exports = router;
