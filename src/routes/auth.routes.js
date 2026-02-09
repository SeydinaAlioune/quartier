const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rateLimit.middleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} = require('../middleware/authValidation.middleware');

// Routes publiques
router.post(
  '/register',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: 'Trop de tentatives. Réessayez dans quelques minutes.' }),
  validateRegister,
  userController.register
);
router.post(
  '/login',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 12, message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' }),
  validateLogin,
  userController.login
);
router.post(
  '/forgot-password',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 6, message: 'Trop de demandes. Réessayez dans quelques minutes.' }),
  validateForgotPassword,
  userController.forgotPassword
);
router.post(
  '/reset-password',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 6, message: 'Trop de tentatives. Réessayez dans quelques minutes.' }),
  validateResetPassword,
  userController.resetPassword
);

// Routes protégées
router.use(auth);
router.get('/profile', userController.getProfile);

module.exports = router;
