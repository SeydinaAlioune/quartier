const Media = require('../models/media.model');
const { deleteFile } = require('../middleware/upload.middleware');
const path = require('path');

// Ajouter un média
exports.uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier uploadé' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        const originalName = req.file.originalname ? path.parse(req.file.originalname).name : 'media';
        const safeTitle = (req.body.title && String(req.body.title).trim()) || originalName;
        const safeCategory = req.body.category || 'project';

        const media = new Media({
            title: safeTitle,
            description: req.body.description,
            type: fileType,
            url: fileUrl,
            category: safeCategory,
            tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
            uploadedBy: req.user._id
        });

        await media.save();
        res.status(201).json({
            message: 'Média ajouté avec succès',
            media
        });
    } catch (error) {
        // En cas d'erreur, supprimer le fichier uploadé
        if (req.file) {
            await deleteFile(req.file.path);
        }
        console.error('Erreur upload média:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout du média' });
    }
};

// Récupérer tous les médias
exports.getMedia = async (req, res) => {
    try {
        const {
            type,
            category,
            status = 'approved',
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        // Par défaut (sans paramètre) on filtre sur 'approved' pour le public.
        // Si le client passe status=all, on n'ajoute PAS de filtre de statut.
        const query = {};
        if (status && status !== 'all') query.status = status;
        if (type) query.type = type;
        if (category) query.category = category;

        const media = await Media.find(query)
            .populate('uploadedBy', 'name')
            .populate('metadata.event', 'title')
            .populate('metadata.project', 'title')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Media.countDocuments(query);

        res.json({
            media,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération médias:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des médias' });
    }
};

// Récupérer un média spécifique
exports.getOneMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id)
            .populate('uploadedBy', 'name')
            .populate('metadata.event', 'title')
            .populate('metadata.project', 'title');

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        res.json(media);
    } catch (error) {
        console.error('Erreur récupération média:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du média' });
    }
};

// Mettre à jour un média
exports.updateMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        // Vérifier les droits
        if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updatableFields = [
            'title', 'description', 'category',
            'tags', 'metadata', 'status'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                media[field] = req.body[field];
            }
        });

        await media.save();
        res.json({
            message: 'Média mis à jour avec succès',
            media
        });
    } catch (error) {
        console.error('Erreur mise à jour média:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du média' });
    }
};

// Supprimer un média
exports.deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        // Vérifier les droits
        if (media.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Supprimer le fichier physique
        const filePath = path.join('public', media.url);
        await deleteFile(filePath);

        // Mongoose 7: remove() is deprecated on documents
        await media.deleteOne();
        res.json({ message: 'Média supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression média:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du média' });
    }
};

// Approuver ou rejeter un média
exports.moderateMedia = async (req, res) => {
    try {
        const { status } = req.body;
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Média non trouvé' });
        }

        media.status = status;
        await media.save();

        res.json({
            message: 'Statut du média mis à jour avec succès',
            media
        });
    } catch (error) {
        console.error('Erreur modération média:', error);
        res.status(500).json({ message: 'Erreur lors de la modération du média' });
    }
};
