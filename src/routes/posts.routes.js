const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Routes publiques
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);

// Routes protégées
router.post('/', auth, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/comments', auth, postController.addComment);
router.post('/:id/like', auth, postController.toggleLike);

// Routes admin
router.delete('/:id/force', auth, checkRole(['admin']), postController.deletePost);

module.exports = router;
