const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const postController = require('../controllers/post.controller');

router.use(auth);

// Routes pour les posts
router.post('/', postController.createPost);
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);
router.put('/:id', postController.updatePost);

module.exports = router;
