const express = require('express');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/', businessController.getBusinesses);
router.get('/:id', businessController.getBusiness);

// Routes nécessitant une authentification
router.use(auth);

// Routes pour la gestion des commerces
router.post('/', businessController.createBusiness);
router.put('/:id', businessController.updateBusiness);
router.delete('/:id', businessController.deleteBusiness);
router.post('/:id/ratings', businessController.addRating);

// Routes admin
router.put('/:id/moderate', checkRole(['admin', 'moderator']), businessController.moderateBusiness);

module.exports = router;
