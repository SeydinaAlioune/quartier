const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const eventController = require('../controllers/event.controller');

// Routes pour les événements
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);
router.post('/', auth, eventController.createEvent);
router.put('/:id', auth, eventController.updateEvent);
router.post('/:id/join', auth, eventController.joinEvent);

module.exports = router;
