const { ForumCategory, ForumTopic, ForumPost, ForumAd, ForumIdea, ForumReport } = require('../models/forum.model');
const User = require('../models/user.model');

// Helper: relative time string in French (very simple)
function relativeTime(date) {
  if (!date) return '';
  const diffMs = Date.now() - new Date(date).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'à l\'instant';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} j`;
}

exports.getStats = async (req, res) => {
  try {
    const [categoriesCount, topicsCount, postsCount] = await Promise.all([
      ForumCategory.countDocuments(),
      ForumTopic.countDocuments(),
      ForumPost.countDocuments(),
    ]);

    // Posts la semaine
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const postsLastWeek = await ForumPost.countDocuments({ createdAt: { $gte: weekAgo } });

    // Utilisateurs actifs = distinct authors sur 30j
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const activeAuthors = await ForumPost.distinct('author', { createdAt: { $gte: monthAgo } });
    const activeUsers = activeAuthors.length;

    // Compter signalements en attente
    const pendingReports = await ForumReport.countDocuments({ status: 'pending' });

    // Top catégories par nombre de posts
    const agg = await ForumPost.aggregate([
      { $lookup: { from: 'forumtopics', localField: 'topic', foreignField: '_id', as: 't' } },
      { $unwind: '$t' },
      { $group: { _id: '$t.category', posts: { $sum: 1 } } },
      { $sort: { posts: -1 } },
      { $limit: 5 },
    ]);

    // Récupération des noms des catégories
    const catIds = agg.map(a => a._id).filter(Boolean);
    const cats = await ForumCategory.find({ _id: { $in: catIds } }).select('name');
    const nameById = Object.fromEntries(cats.map(c => [String(c._id), c.name]));
    const maxPosts = agg.reduce((m, a) => Math.max(m, a.posts), 1);
    const topCategories = agg.map(a => ({
      name: nameById[String(a._id)] || '—',
      posts: a.posts,
      percentage: Math.round((a.posts / maxPosts) * 100),
    }));

    // Activité récente (topics et posts)
    const recentTopics = await ForumTopic.find().sort({ createdAt: -1 }).limit(3).populate('author', 'name');
    const recentPosts = await ForumPost.find().sort({ createdAt: -1 }).limit(3).populate('author', 'name').populate({ path: 'topic', select: 'title' });
    const recentActivity = [
      ...recentTopics.map(t => ({ type: 'topic', action: 'created', user: t.author?.name || '—', content: t.title, time: relativeTime(t.createdAt) })),
      ...recentPosts.map(p => ({ type: 'reply', action: 'posted', user: p.author?.name || '—', content: (p.topic?.title ? `Re: ${p.topic.title}` : 'Réponse'), time: relativeTime(p.createdAt) })),
    ].slice(0, 5);

    res.json({
      categories: categoriesCount,
      topics: topicsCount,
      posts: postsCount,
      activeUsers,
      postsLastWeek,
      topCategories,
      recentActivity,
      reportedContent: pendingReports,
    });
  } catch (e) {
    console.error('Forum stats error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des statistiques du forum' });
  }
};

// Get single topic details (public)
exports.getTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await ForumTopic.findById(id).populate('author', 'name').populate('category', 'name');
    if (!t) return res.status(404).json({ message: 'Sujet non trouvé' });
    const replies = await ForumPost.countDocuments({ topic: t._id });
    res.json({
      id: t._id,
      title: t.title,
      category: t.category?.name || '—',
      author: t.author?.name || '—',
      replies: Math.max(0, replies - 1),
      status: t.status,
      created: t.createdAt,
      lastReply: t.updatedAt,
    });
  } catch (e) {
    console.error('Forum getTopic error', e);
    res.status(500).json({ message: 'Erreur lors du chargement du sujet' });
  }
};

// Ads: list my own ads (all statuses)
exports.getMyAds = async (req, res) => {
  try {
    const userId = req.user._id;
    const ads = await ForumAd.find({ author: userId }).sort({ createdAt: -1 }).lean();
    res.json(ads.map(a => ({
      id: String(a._id),
      type: a.type,
      title: a.title,
      description: a.description,
      price: a.price,
      imageUrl: a.imageUrl || '',
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })));
  } catch (e) {
    console.error('Forum getMyAds error', e);
    res.status(500).json({ message: 'Erreur lors du chargement de vos annonces' });
  }
};

// Ads: update my own ad (owner only)
exports.updateMyAd = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price = '', type, imageUrl } = req.body;
    const ad = await ForumAd.findById(id);
    if (!ad) return res.status(404).json({ message: 'Annonce introuvable' });
    if (String(ad.author) !== String(req.user._id)) return res.status(403).json({ message: 'Accès refusé' });
    if (type && !['vends', 'recherche', 'services'].includes(type)) return res.status(400).json({ message: 'Type invalide' });
    if (title !== undefined && !String(title).trim()) return res.status(400).json({ message: 'Titre requis' });
    if (description !== undefined && !String(description).trim()) return res.status(400).json({ message: 'Description requise' });
    if (title !== undefined) ad.title = String(title).trim();
    if (description !== undefined) ad.description = String(description).trim();
    if (price !== undefined) ad.price = price;
    if (type) ad.type = type;
    if (imageUrl !== undefined) ad.imageUrl = String(imageUrl || '');
    // Toute modification remet l'annonce en modération
    ad.status = 'pending';
    await ad.save();
    res.json({ id: ad._id, status: ad.status });
  } catch (e) {
    console.error('Forum updateMyAd error', e);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'annonce" });
  }
};

// Ads: delete my own ad (owner only)
exports.deleteMyAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await ForumAd.findById(id);
    if (!ad) return res.status(404).json({ message: 'Annonce introuvable' });
    if (String(ad.author) !== String(req.user._id)) return res.status(403).json({ message: 'Accès refusé' });
    await ad.deleteOne();
    res.json({ message: 'Annonce supprimée' });
  } catch (e) {
    console.error('Forum deleteMyAd error', e);
    res.status(500).json({ message: "Erreur lors de la suppression de l'annonce" });
  }
};

// Admin: get ad by id (full details)
exports.getAdById = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await ForumAd.findById(id).populate('author', 'name').lean();
    if (!ad) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json({
      id: String(ad._id),
      type: ad.type,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      imageUrl: ad.imageUrl || '',
      status: ad.status,
      author: ad.author?.name || '—',
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    });
  } catch (e) {
    console.error('Forum getAdById error', e);
    res.status(500).json({ message: "Erreur lors du chargement de l'annonce" });
  }
};

// Admin: get idea by id (full details)
exports.getIdeaById = async (req, res) => {
  try {
    const { id } = req.params;
    const idea = await ForumIdea.findById(id).populate('author', 'name').lean();
    if (!idea) return res.status(404).json({ message: 'Idée introuvable' });
    res.json({
      id: String(idea._id),
      title: idea.title,
      description: idea.description,
      votes: Array.isArray(idea.votes) ? idea.votes.length : 0,
      author: idea.author?.name || '—',
      createdAt: idea.createdAt,
      updatedAt: idea.updatedAt,
    });
  } catch (e) {
    console.error('Forum getIdeaById error', e);
    res.status(500).json({ message: "Erreur lors du chargement de l'idée" });
  }
};

// --- Ads (Petites Annonces) ---
exports.getAds = async (req, res) => {
  try {
    const { type, status = 'approved', limit = 50 } = req.query;
    const q = {};
    if (type && ['vends', 'recherche', 'services'].includes(type)) q.type = type;
    if (status && ['approved', 'pending', 'rejected'].includes(status)) q.status = status;
    const ads = await ForumAd.find(q).sort({ createdAt: -1 }).limit(Number(limit)).populate('author', 'name');
    res.json(ads.map(a => ({
      id: a._id,
      type: a.type,
      title: a.title,
      description: a.description,
      price: a.price,
      imageUrl: a.imageUrl || '',
      status: a.status,
      author: a.author?.name || '—',
      createdAt: a.createdAt,
    })));
  } catch (e) {
    console.error('Forum getAds error', e);
    res.status(500).json({ message: "Erreur lors du chargement des annonces" });
  }
};

exports.createAd = async (req, res) => {
  try {
    const { type, title, description, price = '', imageUrl = '' } = req.body;
    if (!type || !['vends', 'recherche', 'services'].includes(type)) return res.status(400).json({ message: 'Type invalide' });
    if (!title || !description) return res.status(400).json({ message: 'Titre et description requis' });
    // Par défaut: pending (nécessite approbation admin)
    const ad = await ForumAd.create({ type, title: title.trim(), description: description.trim(), price, imageUrl: String(imageUrl || ''), author: req.user._id, status: 'pending' });
    res.status(201).json({ id: ad._id });
  } catch (e) {
    console.error('Forum createAd error', e);
    res.status(500).json({ message: 'Erreur lors de la création de l\'annonce' });
  }
};

// Admin: update ad status (approved|pending|rejected)
exports.updateAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved|pending|rejected
    if (!['approved', 'pending', 'rejected'].includes(status)) return res.status(400).json({ message: 'Statut invalide' });
    const ad = await ForumAd.findByIdAndUpdate(id, { status }, { new: true });
    if (!ad) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json({ id: ad._id, status: ad.status });
  } catch (e) {
    console.error('Forum updateAdStatus error', e);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut de l'annonce" });
  }
};

// --- Ideas (Boîte à Idées) ---
exports.getIdeas = async (req, res) => {
  try {
    const ideas = await ForumIdea.find().sort({ createdAt: -1 }).populate('author', 'name');
    res.json(ideas.map(i => ({
      id: i._id,
      title: i.title,
      description: i.description,
      author: i.author?.name || '—',
      votes: (i.votes || []).length,
      createdAt: i.createdAt,
    })));
  } catch (e) {
    console.error('Forum getIdeas error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des idées' });
  }
};

exports.createIdea = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ message: 'Titre et description requis' });
    const idea = await ForumIdea.create({ title: title.trim(), description: description.trim(), author: req.user._id, votes: [] });
    res.status(201).json({ id: idea._id });
  } catch (e) {
    console.error('Forum createIdea error', e);
    res.status(500).json({ message: 'Erreur lors de la création de l\'idée' });
  }
};

exports.voteIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const idea = await ForumIdea.findById(id);
    if (!idea) return res.status(404).json({ message: 'Idée non trouvée' });
    const hasVoted = idea.votes.some(v => String(v) === String(userId));
    if (hasVoted) {
      idea.votes = idea.votes.filter(v => String(v) !== String(userId));
    } else {
      idea.votes.push(userId);
    }
    await idea.save();
    res.json({ votes: idea.votes.length, voted: !hasVoted });
  } catch (e) {
    console.error('Forum voteIdea error', e);
    res.status(500).json({ message: 'Erreur lors du vote' });
  }
};

// --- Reports (Signalements) ---
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    let { reason = 'autre', details = '' } = req.body;
    if (!targetType || !['ad', 'idea', 'topic', 'post'].includes(targetType)) return res.status(400).json({ message: 'Type de cible invalide' });
    if (!targetId) return res.status(400).json({ message: 'Cible requise' });
    const allowedReasons = ['spam', 'offensif', 'inexact', 'autre'];
    const normalized = String(reason || '').toLowerCase().trim();
    if (!allowedReasons.includes(normalized)) {
      // Utilisateur a fourni une phrase libre: l'enregistrer en details et mettre reason='autre'
      details = details ? `${details}\n${reason}` : String(reason);
      reason = 'autre';
    } else {
      reason = normalized;
    }
    const r = await ForumReport.create({ targetType, targetId, reason, details, reporter: req.user._id, status: 'pending' });
    res.status(201).json({ id: r._id });
  } catch (e) {
    console.error('Forum createReport error', e);
    res.status(500).json({ message: 'Erreur lors du signalement' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status } = req.query; // pending|resolved
    const q = {};
    if (status && ['pending', 'resolved'].includes(status)) q.status = status;
    const list = await ForumReport.find(q).sort({ createdAt: -1 }).populate('reporter', 'name').lean();

    const withTargets = await Promise.all(list.map(async (r) => {
      let targetTitle = '', targetSnippet = '', targetStatus = '';
      try {
        if (r.targetType === 'idea') {
          const idea = await ForumIdea.findById(r.targetId).lean();
          if (idea) {
            targetTitle = idea.title || '';
            targetSnippet = idea.description || '';
          }
        } else if (r.targetType === 'ad') {
          const ad = await ForumAd.findById(r.targetId).lean();
          if (ad) {
            targetTitle = `${ad.type?.toUpperCase() || ''} · ${ad.title || ''}`.trim();
            targetSnippet = [ad.description, ad.price].filter(Boolean).join(' — ');
            targetStatus = ad.status || '';
          }
        } else if (r.targetType === 'topic') {
          const t = await ForumTopic.findById(r.targetId).lean();
          if (t) {
            targetTitle = t.title || '';
            targetStatus = t.status || '';
          }
        } else if (r.targetType === 'post') {
          const p = await ForumPost.findById(r.targetId).lean();
          if (p) {
            targetSnippet = (p.content || '').slice(0, 180);
            targetStatus = p.status || '';
          }
        }
      } catch {}
      return {
        id: String(r._id),
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        reporter: r.reporter?.name || '—',
        createdAt: r.createdAt,
        targetTitle,
        targetSnippet,
        targetStatus,
      };
    }));

    res.json(withTargets);
  } catch (e) {
    console.error('Forum getReports error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des signalements' });
  }
};

// Admin: delete ad
exports.deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await ForumAd.findById(id);
    if (!ad) return res.status(404).json({ message: "Annonce introuvable" });
    await ad.deleteOne();
    res.json({ message: 'Annonce supprimée' });
  } catch (e) {
    console.error('Forum deleteAd error', e);
    res.status(500).json({ message: "Erreur lors de la suppression de l'annonce" });
  }
};

// Admin: delete idea
exports.deleteIdea = async (req, res) => {
  try {
    const { id } = req.params;
    const idea = await ForumIdea.findById(id);
    if (!idea) return res.status(404).json({ message: 'Idée introuvable' });
    await idea.deleteOne();
    res.json({ message: 'Idée supprimée' });
  } catch (e) {
    console.error('Forum deleteIdea error', e);
    res.status(500).json({ message: "Erreur lors de la suppression de l'idée" });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending|resolved
    if (!['pending', 'resolved'].includes(status)) return res.status(400).json({ message: 'Statut invalide' });
    const r = await ForumReport.findByIdAndUpdate(id, { status }, { new: true });
    if (!r) return res.status(404).json({ message: 'Signalement non trouvé' });
    res.json({ id: r._id, status: r.status });
  } catch (e) {
    console.error('Forum updateReportStatus error', e);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du signalement' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const cats = await ForumCategory.find().sort({ createdAt: -1 });
    // Enrichir avec topics/posts counts et lastActivity
    const categories = await Promise.all(cats.map(async (c) => {
      const topics = await ForumTopic.find({ category: c._id }).select('_id updatedAt');
      const topicIds = topics.map(t => t._id);
      const postsCount = topicIds.length ? await ForumPost.countDocuments({ topic: { $in: topicIds } }) : 0;
      const lastActivity = topics.reduce((d, t) => (d && d > t.updatedAt ? d : t.updatedAt), c.updatedAt);
      return {
        id: c._id,
        name: c.name,
        description: c.description || '',
        topics: topics.length,
        posts: postsCount,
        lastActivity,
      };
    }));
    res.json(categories);
  } catch (e) {
    console.error('Forum categories error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des catégories' });
  }
};

exports.getRecentTopics = async (req, res) => {
  try {
    const topics = await ForumTopic.find().sort({ updatedAt: -1 }).limit(10).populate('author', 'name').populate('category', 'name');
    const result = await Promise.all(topics.map(async (t) => {
      const replies = await ForumPost.countDocuments({ topic: t._id });
      return {
        id: t._id,
        title: t.title,
        category: t.category?.name || '—',
        author: t.author?.name || '—',
        replies: Math.max(0, replies - 1),
        views: 0,
        status: t.status,
        created: t.createdAt,
        lastReply: t.updatedAt,
      };
    }));
    res.json(result);
  } catch (e) {
    console.error('Forum recent topics error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des sujets récents' });
  }
};

// Posts by topic (public)
exports.getTopicPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const posts = await ForumPost.find({ topic: id }).sort({ createdAt: 1 }).populate('author', 'name');
    const out = posts.map(p => ({
      id: p._id,
      content: p.content,
      author: p.author?.name || '—',
      status: p.status,
      createdAt: p.createdAt,
    }));
    res.json(out);
  } catch (e) {
    console.error('Forum getTopicPosts error', e);
    res.status(500).json({ message: 'Erreur lors du chargement des messages' });
  }
};

// --- Admin mutations ---

// Categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Nom requis' });
    const cat = await ForumCategory.create({ name: name.trim(), description });
    res.status(201).json(cat);
  } catch (e) {
    console.error('Forum createCategory error', e);
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await ForumCategory.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json(updated);
  } catch (e) {
    console.error('Forum updateCategory error', e);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la catégorie' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Option simple: empêcher suppression si topics existent
    const hasTopics = await ForumTopic.exists({ category: id });
    if (hasTopics) return res.status(400).json({ message: 'Impossible: des sujets existent dans cette catégorie' });
    const deleted = await ForumCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (e) {
    console.error('Forum deleteCategory error', e);
    res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie' });
  }
};

// Topics
exports.createTopic = async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) return res.status(400).json({ message: 'Titre et catégorie requis' });
    const topic = await ForumTopic.create({ title: title.trim(), category, author: req.user._id });
    res.status(201).json(topic);
  } catch (e) {
    console.error('Forum createTopic error', e);
    res.status(500).json({ message: 'Erreur lors de la création du sujet' });
  }
};

exports.pinTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned } = req.body; // boolean; if undefined, toggle
    const t = await ForumTopic.findById(id);
    if (!t) return res.status(404).json({ message: 'Sujet non trouvé' });
    let nextStatus = t.status;
    if (typeof pinned === 'boolean') {
      nextStatus = pinned ? 'pinned' : (t.status === 'closed' ? 'closed' : 'active');
    } else {
      nextStatus = (t.status === 'pinned') ? 'active' : 'pinned';
    }
    t.status = nextStatus;
    await t.save();
    res.json({ id: t._id, status: t.status });
  } catch (e) {
    console.error('Forum pinTopic error', e);
    res.status(500).json({ message: 'Erreur lors du changement d\'état (pin)' });
  }
};

exports.closeTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'closed' or 'active'
    const t = await ForumTopic.findById(id);
    if (!t) return res.status(404).json({ message: 'Sujet non trouvé' });
    t.status = status === 'active' ? 'active' : 'closed';
    await t.save();
    res.json({ id: t._id, status: t.status });
  } catch (e) {
    console.error('Forum closeTopic error', e);
    res.status(500).json({ message: 'Erreur lors de la fermeture du sujet' });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const t = await ForumTopic.findById(id);
    if (!t) return res.status(404).json({ message: 'Sujet non trouvé' });
    await ForumPost.deleteMany({ topic: t._id });
    await t.deleteOne();
    res.json({ message: 'Sujet supprimé' });
  } catch (e) {
    console.error('Forum deleteTopic error', e);
    res.status(500).json({ message: 'Erreur lors de la suppression du sujet' });
  }
};

// Posts
exports.createPost = async (req, res) => {
  try {
    const { topic, content } = req.body;
    if (!topic || !content) return res.status(400).json({ message: 'Sujet et contenu requis' });
    const post = await ForumPost.create({ topic, content, author: req.user._id });
    // mettre à jour lastReplyAt du topic
    await ForumTopic.findByIdAndUpdate(topic, { lastReplyAt: new Date() });
    res.status(201).json(post);
  } catch (e) {
    console.error('Forum createPost error', e);
    res.status(500).json({ message: 'Erreur lors de la création du message' });
  }
};

exports.hidePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { hidden } = req.body; // boolean; if undefined toggle
    const p = await ForumPost.findById(id);
    if (!p) return res.status(404).json({ message: 'Message non trouvé' });
    let next = p.status;
    if (typeof hidden === 'boolean') {
      next = hidden ? 'hidden' : 'visible';
    } else {
      next = (p.status === 'hidden') ? 'visible' : 'hidden';
    }
    p.status = next;
    await p.save();
    res.json({ id: p._id, status: p.status });
  } catch (e) {
    console.error('Forum hidePost error', e);
    res.status(500).json({ message: 'Erreur lors du masquage du message' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await ForumPost.findById(id);
    if (!p) return res.status(404).json({ message: 'Message non trouvé' });
    await p.deleteOne();
    res.json({ message: 'Message supprimé' });
  } catch (e) {
    console.error('Forum deletePost error', e);
    res.status(500).json({ message: 'Erreur lors de la suppression du message' });
  }
};
