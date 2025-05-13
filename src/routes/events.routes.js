const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

// Routes protégées
router.post('/', auth, eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.delete('/:id', auth, eventController.deleteEvent);
router.post('/:id/participate', auth, eventController.participateEvent);
router.delete('/:id/participate', auth, eventController.cancelParticipation);

// Routes admin
router.delete('/:id/force', auth, checkRole(['admin']), eventController.deleteEvent);

module.exports = router;
