const express = require('express');
const router = express.Router();
const controller = require('../controllers/usefulContact.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Public
router.get('/', controller.list);

// Protected admin/moderator
router.use(auth);

router.post('/categories', checkRole(['admin', 'moderator']), controller.createCategory);
router.put('/categories/:id', checkRole(['admin', 'moderator']), controller.updateCategory);
router.delete('/categories/:id', checkRole(['admin', 'moderator']), controller.deleteCategory);

router.post('/categories/:id/contacts', checkRole(['admin', 'moderator']), controller.addContact);
router.put('/categories/:id/contacts/:contactId', checkRole(['admin', 'moderator']), controller.updateContact);
router.delete('/categories/:id/contacts/:contactId', checkRole(['admin', 'moderator']), controller.deleteContact);

module.exports = router;
