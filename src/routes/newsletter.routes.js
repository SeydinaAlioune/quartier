const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.post('/subscribe', newsletterController.subscribe);
router.get('/unsubscribe/:token', newsletterController.unsubscribe);

// Routes nécessitant une authentification et des droits admin
router.use(auth);
router.use(checkRole(['admin']));

// Routes pour la gestion des newsletters
router.post('/', newsletterController.createNewsletter);
router.get('/', newsletterController.getNewsletters);
router.post('/:id/send', newsletterController.sendNewsletter);
router.get('/:id/stats', newsletterController.getNewsletterStats);

module.exports = router;
