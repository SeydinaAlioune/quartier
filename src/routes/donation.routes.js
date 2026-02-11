const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donation.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/campaigns', donationController.getCampaigns);
router.get('/campaigns/:id', donationController.getCampaign);

// Webhooks et page de paiement simulée (public)
router.post('/webhook/wave', donationController.webhookWave);
router.post('/webhook/orange', donationController.webhookOrange);
router.post('/webhook/paydunya', donationController.webhookPaydunya);
router.get('/mock-checkout', donationController.mockCheckout);

// Routes nécessitant une authentification
router.use(auth);

// Routes pour les dons
router.post('/donate', donationController.makeDonation);
router.post('/pay', donationController.initiatePayment);
router.get('/history', donationController.getUserDonations);
router.get('/status/:id', donationController.getDonationStatus);
router.get('/stats', checkRole(['admin']), donationController.getStats);

// Routes pour la gestion des campagnes
router.post('/campaigns', checkRole(['admin']), donationController.createCampaign);
router.put('/campaigns/:id', checkRole(['admin']), donationController.updateCampaign);
router.delete('/campaigns/:id', checkRole(['admin']), donationController.deleteCampaign);
router.post('/campaigns/:id/updates', checkRole(['admin']), donationController.addCampaignUpdate);
router.get('/campaigns/:id/donations', checkRole(['admin']), donationController.getCampaignDonations);

module.exports = router;
