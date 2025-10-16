const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/announcement.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Public
router.get('/', ctrl.getActive);

// Protected admin
router.use(auth);
router.get('/all', checkRole(['admin']), ctrl.getAll);
router.post('/', checkRole(['admin']), ctrl.create);
router.put('/:id', checkRole(['admin']), ctrl.update);
router.delete('/:id', checkRole(['admin']), ctrl.remove);

module.exports = router;
