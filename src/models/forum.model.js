const mongoose = require('mongoose');

const forumCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
}, { timestamps: true });

const forumTopicSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumCategory', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'pinned', 'closed'], default: 'active' },
  lastReplyAt: { type: Date, default: Date.now },
}, { timestamps: true });

const forumPostSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumTopic', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['visible', 'hidden', 'deleted'], default: 'visible' },
}, { timestamps: true });

const ForumCategory = mongoose.model('ForumCategory', forumCategorySchema);
const ForumTopic = mongoose.model('ForumTopic', forumTopicSchema);
const ForumPost = mongoose.model('ForumPost', forumPostSchema);

// Annonces (Petites Annonces)
const forumAdSchema = new mongoose.Schema({
  type: { type: String, enum: ['vends', 'recherche', 'services'], required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  images: [{ type: String }],
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Boîte à Idées
const forumIdeaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Signalements
const forumReportSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['ad', 'idea', 'topic', 'post'], required: true },
  targetId: { type: String, required: true }, // id en string pour rester générique
  reason: { type: String, enum: ['spam', 'offensif', 'inexact', 'autre'], default: 'autre' },
  details: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const ForumAd = mongoose.model('ForumAd', forumAdSchema);
const ForumIdea = mongoose.model('ForumIdea', forumIdeaSchema);
const ForumReport = mongoose.model('ForumReport', forumReportSchema);

module.exports = { ForumCategory, ForumTopic, ForumPost, ForumAd, ForumIdea, ForumReport };
