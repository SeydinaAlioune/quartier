const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const controller = require('../controllers/projectsConfig.controller');

// Public: lecture de la configuration projets
router.get('/', controller.getConfig);

// Admin/moderator: mise à jour
router.put('/', auth, checkRole(['admin', 'moderator']), controller.upsertConfig);

module.exports = router;
