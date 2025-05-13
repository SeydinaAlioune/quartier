const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

router.use(auth); // Protéger toutes les routes utilisateur

// Routes du profil
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

module.exports = router;
