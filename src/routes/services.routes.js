const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getService);

// Routes protégées
router.post('/:id/rate', auth, serviceController.rateService);

// Routes admin
router.post('/', auth, checkRole(['admin']), serviceController.createService);
router.put('/:id', auth, checkRole(['admin']), serviceController.updateService);
router.delete('/:id', auth, checkRole(['admin']), serviceController.deleteService);

module.exports = router;
