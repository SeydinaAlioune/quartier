const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth.middleware');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Routes protégées
router.use(auth);
router.get('/profile', userController.getProfile);

module.exports = router;
