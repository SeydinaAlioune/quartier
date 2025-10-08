const Post = require('../models/post.model');

// Créer un nouveau post
exports.createPost = async (req, res) => {
    try {
        const { title, content, coverUrl } = req.body;
        
        const post = new Post({
            title,
            content,
            author: req.user._id,
            coverUrl: coverUrl || ''
        });

        const savedPost = await post.save();
        const populatedPost = await Post.findById(savedPost._id).populate('author', 'name email');

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Erreur lors de la création du post:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// --- Additional endpoints for comments moderation and likes ---

// List all comments with optional status filter (admin)
exports.getAllComments = async (req, res) => {
    try {
        const { status } = req.query; // approved | pending | rejected | undefined = all
        const posts = await Post.find({}, 'title comments')
            .populate('comments.author', 'name');

        let comments = [];
        for (const p of posts) {
            for (const c of p.comments || []) {
                comments.push({
                    id: c._id,
                    postId: p._id,
                    postTitle: p.title,
                    content: c.content,
                    author: c.author?.name || '—',
                    status: c.status,
                    createdAt: c.createdAt,
                });
            }
        }

        if (status && ['approved', 'pending', 'rejected'].includes(status)) {
            comments = comments.filter(c => c.status === status);
        }

        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json({ comments, total: comments.length });
    } catch (error) {
        console.error('Erreur listage commentaires:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des commentaires' });
    }
};

// Moderate a specific comment (admin)
exports.moderateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { status } = req.body; // approved | pending | rejected
        if (!['approved', 'pending', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        const updated = await Post.findOneAndUpdate(
            { 'comments._id': commentId },
            { $set: { 'comments.$.status': status } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Commentaire introuvable' });
        }
        res.json({ message: 'Commentaire modéré', status });
    } catch (error) {
        console.error('Erreur modération commentaire:', error);
        res.status(500).json({ message: 'Erreur lors de la modération du commentaire' });
    }
};

// Delete a specific comment (admin)
exports.deleteCommentById = async (req, res) => {
    try {
        const { commentId } = req.params;
        const updated = await Post.findOneAndUpdate(
            { 'comments._id': commentId },
            { $pull: { comments: { _id: commentId } } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: 'Commentaire introuvable' });
        }
        res.json({ message: 'Commentaire supprimé' });
    } catch (error) {
        console.error('Erreur suppression commentaire:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du commentaire' });
    }
};

// Toggle like on a post (auth)
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post non trouvé' });

        const hasLiked = post.likes.some(u => u.toString() === userId.toString());
        if (hasLiked) {
            post.likes = post.likes.filter(u => u.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.json({ likes: post.likes.length, liked: !hasLiked });
    } catch (error) {
        console.error('Erreur toggle like:', error);
        res.status(500).json({ message: 'Erreur lors du like' });
    }
};

// Alias for route compatibility (wrapper so it's a function at load time)
exports.addComment = (req, res, next) => exports.commentPost(req, res, next);

// Obtenir tous les posts (avec pagination/filtre statut/recherche)
exports.getPosts = async (req, res) => {
    try {
        const {
            status, // 'draft' | 'published'
            search,
            sort = '-createdAt',
            page = 1,
            limit = 20,
        } = req.query;

        const query = {};
        if (status && ['draft', 'published'].includes(status)) query.status = status;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Post.countDocuments(query);

        res.json({ posts, currentPage: Number(page), totalPages: Math.ceil(total / limit), total });
    } catch (error) {
        console.error('Erreur lors de la récupération des posts:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir un post par son ID
exports.getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'name email');
        
        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }

        res.json(post);
    } catch (error) {
        console.error('Erreur lors de la récupération du post:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un post (auteur ou admin)
exports.updatePost = async (req, res) => {
    try {
        const { title, content, status } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }

        const isAuthor = post.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;
        if (status !== undefined && ['draft', 'published'].includes(status)) post.status = status;
        if (req.body.coverUrl !== undefined) post.coverUrl = req.body.coverUrl;

        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id).populate('author', 'name email');

        res.json(populatedPost);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du post:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un post (auteur)
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            author: req.user._id
        });
        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé ou non autorisé' });
        }
        res.json({ message: 'Post supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du post' });
    }
};

// Supprimer un post (admin)
exports.adminDeletePost = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }
        res.json({ message: 'Post supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du post' });
    }
};

// Mettre à jour uniquement le statut du post (auteur ou admin)
exports.updatePostStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['draft', 'published'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }
        const isAuthor = post.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        post.status = status;
        await post.save();
        res.json({ message: 'Statut mis à jour', status: post.status });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du post:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Aimer un post
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { likes: req.user._id } },
            { new: true }
        );
        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }
        const populatedPost = await Post.findById(post._id).populate('author', 'name email');
        res.json(populatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du like' });
    }
};

// Commenter un post
exports.commentPost = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    comments: {
                        content,
                        author: req.user._id,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );
        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }
        const populatedPost = await Post.findById(post._id).populate('author', 'name email');
        res.json(populatedPost);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du commentaire' });
    }
};
