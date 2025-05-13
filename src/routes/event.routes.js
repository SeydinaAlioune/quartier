const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const eventController = require('../controllers/event.controller');

router.use(auth);

// Routes pour les événements
router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);
router.put('/:id', eventController.updateEvent);
router.post('/:id/join', eventController.joinEvent);

module.exports = router;
