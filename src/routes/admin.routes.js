const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

router.use(auth); // Authentification requise
router.use(isAdmin); // Vérification du rôle admin

// Gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);

module.exports = router;
