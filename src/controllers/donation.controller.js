const { DonationCampaign, Donation } = require('../models/donation.model');

// Créer une campagne de dons
exports.createCampaign = async (req, res) => {
    try {
        const campaign = new DonationCampaign({
            ...req.body,
            organizer: req.user._id
        });
        await campaign.save();
        res.status(201).json({
            message: 'Campagne créée avec succès',
            campaign
        });
    } catch (error) {
        console.error('Erreur création campagne:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la campagne' });
    }
};

// Obtenir toutes les campagnes
exports.getCampaigns = async (req, res) => {
    try {
        const {
            status = 'active',
            category,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const query = { status };
        if (category) query.category = category;

        const campaigns = await DonationCampaign.find(query)
            .populate('organizer', 'name')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await DonationCampaign.countDocuments(query);

        res.json({
            campaigns,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération campagnes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des campagnes' });
    }
};

// Obtenir une campagne spécifique
exports.getCampaign = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id)
            .populate('organizer', 'name');

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Erreur récupération campagne:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la campagne' });
    }
};

// Mettre à jour une campagne
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        // Vérifier les droits
        if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const updatableFields = [
            'title', 'description', 'goal', 'endDate',
            'category', 'status', 'images'
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                campaign[field] = req.body[field];
            }
        });

        await campaign.save();
        res.json({
            message: 'Campagne mise à jour avec succès',
            campaign
        });
    } catch (error) {
        console.error('Erreur mise à jour campagne:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la campagne' });
    }
};

// Ajouter une mise à jour à la campagne
exports.addCampaignUpdate = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        // Vérifier les droits
        if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        campaign.updates.push({
            content: req.body.content,
            author: req.user._id
        });

        await campaign.save();
        res.json({
            message: 'Mise à jour ajoutée avec succès',
            campaign
        });
    } catch (error) {
        console.error('Erreur ajout mise à jour:', error);
        res.status(500).json({ message: 'Erreur lors de l\'ajout de la mise à jour' });
    }
};

// Faire un don
exports.makeDonation = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.body.campaign);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        if (campaign.status !== 'active') {
            return res.status(400).json({ message: 'Cette campagne n\'accepte plus les dons' });
        }

        const donation = new Donation({
            campaign: campaign._id,
            donor: req.user._id,
            amount: req.body.amount,
            paymentMethod: req.body.paymentMethod,
            message: req.body.message,
            anonymous: req.body.anonymous
        });

        // Ici, vous devriez implémenter la logique de paiement réelle
        // Pour l'instant, on simule un paiement réussi
        donation.status = 'completed';
        donation.transactionId = 'SIMULATED_' + Date.now();

        await donation.save();

        res.status(201).json({
            message: 'Don effectué avec succès',
            donation
        });
    } catch (error) {
        console.error('Erreur don:', error);
        res.status(500).json({ message: 'Erreur lors du don' });
    }
};

// Obtenir l'historique des dons d'un utilisateur
exports.getUserDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user._id })
            .populate('campaign', 'title')
            .sort('-createdAt');

        res.json(donations);
    } catch (error) {
        console.error('Erreur historique dons:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique des dons' });
    }
};

// Obtenir les dons d'une campagne
exports.getCampaignDonations = async (req, res) => {
    try {
        const campaign = await DonationCampaign.findById(req.params.id);

        if (!campaign) {
            return res.status(404).json({ message: 'Campagne non trouvée' });
        }

        // Vérifier les droits
        if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const donations = await Donation.find({
            campaign: campaign._id,
            status: 'completed'
        })
            .populate('donor', 'name')
            .sort('-createdAt');

        res.json(donations);
    } catch (error) {
        console.error('Erreur récupération dons:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des dons' });
    }
};
