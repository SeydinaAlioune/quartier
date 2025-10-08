const express = require('express');
const router = express.Router();
const controller = require('../controllers/cityConfig.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Public
router.get('/', controller.getConfig);

// Admin
router.put('/', auth, checkRole(['admin']), controller.upsertConfig);

module.exports = router;
