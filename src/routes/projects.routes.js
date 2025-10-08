const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/', projectController.getProjects);
router.get('/:id([0-9a-fA-F]{24})', projectController.getProject);

// Routes nécessitant une authentification
router.use(auth);

// Routes pour les projets (admin/moderator)
router.post('/', checkRole(['admin', 'moderator']), projectController.createProject);
router.put('/:id([0-9a-fA-F]{24})', checkRole(['admin', 'moderator']), projectController.updateProject);
router.delete('/:id([0-9a-fA-F]{24})', checkRole(['admin', 'moderator']), projectController.deleteProject);

// Participation et interactions (utilisateurs authentifiés)
router.post('/:id([0-9a-fA-F]{24})/participate', projectController.participateProject);
router.post('/:id([0-9a-fA-F]{24})/vote', projectController.voteProject);
router.post('/:id([0-9a-fA-F]{24})/updates', projectController.addProjectUpdate);

module.exports = router;
