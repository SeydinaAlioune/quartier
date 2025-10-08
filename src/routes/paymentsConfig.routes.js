const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentConfig.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Require admin
router.use(auth);
router.use(checkRole(['admin']));

router.get('/', controller.getConfig);
router.put('/', controller.updateConfig);

module.exports = router;
