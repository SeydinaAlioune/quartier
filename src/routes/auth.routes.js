const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth.middleware');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes protégées
router.use(auth);
router.get('/profile', userController.getProfile);

module.exports = router;
