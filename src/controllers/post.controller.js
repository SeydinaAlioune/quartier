const Post = require('../models/post.model');

// Créer un nouveau post
exports.createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        
        const post = new Post({
            title,
            content,
            author: req.user._id
        });

        const savedPost = await post.save();
        const populatedPost = await Post.findById(savedPost._id).populate('author', 'name email');

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Erreur lors de la création du post:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir tous les posts
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
        res.json(posts);
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

// Mettre à jour un post
exports.updatePost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post non trouvé' });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        post.title = title;
        post.content = content;
        const updatedPost = await post.save();
        const populatedPost = await Post.findById(updatedPost._id).populate('author', 'name email');

        res.json(populatedPost);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du post:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un post
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
