const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes pour la gestion des notifications
router.get('/', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Routes admin pour créer des notifications système
router.post('/', checkRole(['admin']), notificationController.createNotification);

module.exports = router;
