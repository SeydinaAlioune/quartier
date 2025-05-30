const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.post('/submit', contactController.submitContact);
router.get('/emergency', contactController.getEmergencyContacts);

// Routes nécessitant une authentification et des droits admin
router.use(auth);
router.use(checkRole(['admin']));

// Routes pour la gestion des messages de contact
router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContact);
router.put('/:id/status', contactController.updateContactStatus);
router.post('/:id/respond', contactController.respondToContact);

// Routes pour la gestion des contacts d'urgence
router.post('/emergency', contactController.createEmergencyContact);
router.put('/emergency/:id', contactController.updateEmergencyContact);

module.exports = router;
