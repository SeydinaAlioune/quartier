const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forum.controller');
const { auth, checkRole } = require('../middleware/auth.middleware');
const { rateLimit } = require('../middleware/rateLimit.middleware');
const {
  validateForumTopicCreate,
  validateForumPostCreate,
  validateForumAdCreate,
  validateForumIdeaCreate,
  validateForumReportCreate,
} = require('../middleware/contentValidation.middleware');

// Public forum analytics/listing endpoints
router.get('/stats', forumController.getStats);
router.get('/categories', forumController.getCategories);
router.get('/topics/recent', forumController.getRecentTopics);
router.get('/topics/:id', forumController.getTopic);
router.get('/topics/:id/posts', forumController.getTopicPosts);
// Public lists for ads and ideas
router.get('/ads', forumController.getAds);
router.get('/ideas', forumController.getIdeas);

// Protected (requires auth)
router.use(auth);

// Categories (admin only)
router.post('/categories', checkRole(['admin']), forumController.createCategory);
router.put('/categories/:id', checkRole(['admin']), forumController.updateCategory);
router.delete('/categories/:id', checkRole(['admin']), forumController.deleteCategory);

// Topics (create: any authenticated; moderation: admin)
router.post('/topics', rateLimit({ windowMs: 60_000, max: 8 }), validateForumTopicCreate, forumController.createTopic);
router.put('/topics/:id/pin', checkRole(['admin']), forumController.pinTopic);
router.put('/topics/:id/close', checkRole(['admin']), forumController.closeTopic);
router.delete('/topics/:id', checkRole(['admin']), forumController.deleteTopic);

// Posts
router.post('/posts', rateLimit({ windowMs: 60_000, max: 20 }), validateForumPostCreate, forumController.createPost);
router.put('/posts/:id/hide', checkRole(['admin']), forumController.hidePost);
router.delete('/posts/:id', checkRole(['admin']), forumController.deletePost);

// Ads (auth to create)
router.get('/ads/mine', forumController.getMyAds);
router.post('/ads', rateLimit({ windowMs: 60_000, max: 6 }), validateForumAdCreate, forumController.createAd);
router.put('/ads/mine/:id', forumController.updateMyAd);
router.delete('/ads/mine/:id', forumController.deleteMyAd);

// Ideas (auth to create/vote)
router.post('/ideas', rateLimit({ windowMs: 60_000, max: 6 }), validateForumIdeaCreate, forumController.createIdea);
router.post('/ideas/:id/vote', forumController.voteIdea);

// Reports (auth to create, admin to list/update)
router.post('/reports', rateLimit({ windowMs: 60_000, max: 8 }), validateForumReportCreate, forumController.createReport);
router.get('/reports', checkRole(['admin']), forumController.getReports);
router.put('/reports/:id/status', checkRole(['admin']), forumController.updateReportStatus);

// Admin content management for reported items
router.get('/ads/:id', checkRole(['admin']), forumController.getAdById);
router.delete('/ads/:id', checkRole(['admin']), forumController.deleteAd);
router.put('/ads/:id/status', checkRole(['admin']), forumController.updateAdStatus);
router.get('/ideas/:id', checkRole(['admin']), forumController.getIdeaById);
router.delete('/ideas/:id', checkRole(['admin']), forumController.deleteIdea);

module.exports = router;
