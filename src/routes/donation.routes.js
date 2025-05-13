const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donation.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/campaigns', donationController.getCampaigns);
router.get('/campaigns/:id', donationController.getCampaign);

// Routes nécessitant une authentification
router.use(auth);

// Routes pour les dons
router.post('/donate', donationController.makeDonation);
router.get('/history', donationController.getUserDonations);

// Routes pour la gestion des campagnes
router.post('/campaigns', checkRole(['admin']), donationController.createCampaign);
router.put('/campaigns/:id', checkRole(['admin']), donationController.updateCampaign);
router.post('/campaigns/:id/updates', checkRole(['admin']), donationController.addCampaignUpdate);
router.get('/campaigns/:id/donations', checkRole(['admin']), donationController.getCampaignDonations);

module.exports = router;
