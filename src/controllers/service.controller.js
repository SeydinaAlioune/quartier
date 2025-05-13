const Service = require('../models/service.model');

// Créer un nouveau service
exports.createService = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            provider,
            location,
            schedule,
            features
        } = req.body;

        const service = new Service({
            name,
            description,
            category,
            provider,
            location,
            schedule,
            features
        });

        await service.save();
        res.status(201).json({
            message: 'Service créé avec succès',
            service
        });
    } catch (error) {
        console.error('Erreur création service:', error);
        res.status(500).json({ message: 'Erreur lors de la création du service' });
    }
};

// Récupérer tous les services
exports.getServices = async (req, res) => {
    try {
        const {
            category,
            status,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};
        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'provider.name': { $regex: search, $options: 'i' } }
            ];
        }

        const services = await Service.find(query)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Service.countDocuments(query);

        res.json({
            services,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération services:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des services' });
    }
};

// Récupérer un service spécifique
exports.getService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        res.json(service);
    } catch (error) {
        console.error('Erreur récupération service:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du service' });
    }
};

// Mettre à jour un service
exports.updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        // Vérification des permissions (admin seulement)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updateFields = [
            'name', 'description', 'category', 'provider',
            'location', 'schedule', 'features', 'status'
        ];

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                service[field] = req.body[field];
            }
        });

        await service.save();
        res.json({ message: 'Service mis à jour avec succès', service });
    } catch (error) {
        console.error('Erreur mise à jour service:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du service' });
    }
};

// Supprimer un service
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        // Vérification des permissions (admin seulement)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        await service.remove();
        res.json({ message: 'Service supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression service:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du service' });
    }
};

// Ajouter une note et un commentaire
exports.rateService = async (req, res) => {
    try {
        const { score, comment } = req.body;
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        // Vérifier si l'utilisateur a déjà noté
        const existingRating = service.ratings.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (existingRating) {
            existingRating.score = score;
            existingRating.comment = comment;
            existingRating.date = Date.now();
        } else {
            service.ratings.push({
                user: req.user._id,
                score,
                comment
            });
        }

        service.calculateAverageRating();
        await service.save();

        res.json({
            message: 'Note ajoutée avec succès',
            averageRating: service.averageRating
        });
    } catch (error) {
        console.error('Erreur notation service:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout de la note' });
    }
};
