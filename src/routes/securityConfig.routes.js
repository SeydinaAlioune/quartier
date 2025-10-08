const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const controller = require('../controllers/securityConfig.controller');

// public: lecture de la configuration
router.get('/', controller.getConfig);

// admin/moderator: mise à jour
router.put('/', auth, checkRole(['admin', 'moderator']), controller.upsertConfig);

module.exports = router;
