const Business = require('../models/business.model');

// Créer un commerce
exports.createBusiness = async (req, res) => {
    try {
        const business = new Business({
            ...req.body,
            owner: req.user._id
        });
        await business.save();
        res.status(201).json({
            message: 'Commerce créé avec succès',
            business
        });
    } catch (error) {
        console.error('Erreur création commerce:', error);
        res.status(500).json({ message: 'Erreur lors de la création du commerce' });
    }
};

// Obtenir tous les commerces
exports.getBusinesses = async (req, res) => {
    try {
        const {
            category,
            status = 'active',
            sort = '-createdAt',
            page = 1,
            limit = 20,
            search
        } = req.query;

        const query = { status };
        if (category) query.category = category;
        if (search) {
            query.$text = { $search: search };
        }

        const businesses = await Business.find(query)
            .populate('owner', 'name')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Business.countDocuments(query);

        res.json({
            businesses,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération commerces:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des commerces' });
    }
};

// Obtenir un commerce spécifique
exports.getBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id)
            .populate('owner', 'name')
            .populate('ratings.user', 'name');

        if (!business) {
            return res.status(404).json({ message: 'Commerce non trouvé' });
        }

        res.json(business);
    } catch (error) {
        console.error('Erreur récupération commerce:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du commerce' });
    }
};

// Mettre à jour un commerce
exports.updateBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Commerce non trouvé' });
        }

        // Vérifier les droits
        if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updatableFields = [
            'name', 'category', 'description', 'contact',
            'address', 'hours', 'images', 'features'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                business[field] = req.body[field];
            }
        });

        await business.save();
        res.json({
            message: 'Commerce mis à jour avec succès',
            business
        });
    } catch (error) {
        console.error('Erreur mise à jour commerce:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du commerce' });
    }
};

// Supprimer un commerce
exports.deleteBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Commerce non trouvé' });
        }

        // Vérifier les droits: propriétaire OU admin/modérateur
        const isOwner = business.owner && business.owner.toString() === req.user._id.toString();
        const isPrivileged = ['admin', 'moderator'].includes(req.user.role);
        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ message: 'Non autorisé: seuls le propriétaire, un administrateur ou un modérateur peuvent supprimer.' });
        }

        // Mongoose 7: remove() n'existe plus sur les documents
        await business.deleteOne();
        res.json({ message: 'Commerce supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression commerce:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du commerce' });
    }
};

// Ajouter une évaluation
exports.addRating = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Commerce non trouvé' });
        }

        // Vérifier si l'utilisateur a déjà noté
        const existingRating = business.ratings.find(
            rating => rating.user.toString() === req.user._id.toString()
        );

        if (existingRating) {
            return res.status(400).json({ message: 'Vous avez déjà évalué ce commerce' });
        }

        business.ratings.push({
            user: req.user._id,
            score: req.body.score,
            comment: req.body.comment
        });

        await business.save();
        res.json({
            message: 'Évaluation ajoutée avec succès',
            business
        });
    } catch (error) {
        console.error('Erreur ajout évaluation:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'évaluation' });
    }
};

// Modérer un commerce
exports.moderateBusiness = async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ message: 'Commerce non trouvé' });
        }

        business.status = req.body.status;
        await business.save();

        res.json({
            message: 'Statut du commerce mis à jour avec succès',
            business
        });
    } catch (error) {
        console.error('Erreur modération commerce:', error);
        res.status(500).json({ message: 'Erreur lors de la modération du commerce' });
    }
};
