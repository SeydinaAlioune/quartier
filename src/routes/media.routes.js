const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

// Routes publiques
router.get('/', mediaController.getMedia);
router.get('/:id', mediaController.getOneMedia);

// Routes nécessitant une authentification
router.use(auth);

// Routes pour la gestion des médias
router.post('/', upload.single('media'), handleUploadError, mediaController.uploadMedia);
router.put('/:id', mediaController.updateMedia);
router.delete('/:id', mediaController.deleteMedia);

// Routes admin
router.put('/:id/moderate', checkRole(['admin', 'moderator']), mediaController.moderateMedia);

module.exports = router;
