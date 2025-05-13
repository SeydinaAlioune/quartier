const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);

// Routes nécessitant une authentification
router.use(auth);

// Routes pour les projets
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.post('/:id/participate', projectController.participateProject);
router.post('/:id/vote', projectController.voteProject);
router.post('/:id/updates', projectController.addProjectUpdate);

module.exports = router;
