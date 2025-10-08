const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const postController = require('../controllers/post.controller');

// Routes pour les posts
router.get('/', postController.getPosts);

// Comments (placer avant '/:id' pour éviter les collisions)
router.get('/comments', auth, checkRole(['admin']), postController.getAllComments);
router.put('/comments/:commentId/moderate', auth, checkRole(['admin']), postController.moderateComment);
router.delete('/comments/:commentId', auth, checkRole(['admin']), postController.deleteCommentById);
router.post('/:id/comments', auth, postController.addComment);

// Post item routes
router.get('/:id', postController.getPost);
router.post('/', auth, postController.createPost);
router.put('/:id', auth, postController.updatePost);
router.put('/:id/status', auth, postController.updatePostStatus);
router.delete('/:id', auth, postController.deletePost);
router.delete('/:id/force', auth, checkRole(['admin']), postController.adminDeletePost);

// Likes
router.post('/:id/like', auth, postController.toggleLike);

module.exports = router;
