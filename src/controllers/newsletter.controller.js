const { Newsletter, Subscriber } = require('../models/newsletter.model');
const crypto = require('crypto');

// Créer une newsletter
exports.createNewsletter = async (req, res) => {
    try {
        const newsletter = new Newsletter({
            ...req.body,
            author: req.user._id
        });
        await newsletter.save();
        res.status(201).json({
            message: 'Newsletter créée avec succès',
            newsletter
        });
    } catch (error) {
        console.error('Erreur création newsletter:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la newsletter' });
    }
};

// Obtenir toutes les newsletters
exports.getNewsletters = async (req, res) => {
    try {
        const {
            status,
            category,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        const newsletters = await Newsletter.find(query)
            .populate('author', 'name')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Newsletter.countDocuments(query);

        res.json({
            newsletters,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Erreur récupération newsletters:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des newsletters' });
    }
};

// S'abonner à la newsletter
exports.subscribe = async (req, res) => {
    try {
        const { email, categories = ['all'] } = req.body;

        let subscriber = await Subscriber.findOne({ email });

        if (subscriber) {
            if (subscriber.status === 'active') {
                return res.status(400).json({ message: 'Email déjà abonné' });
            }
            subscriber.status = 'active';
            subscriber.categories = categories;
        } else {
            subscriber = new Subscriber({
                email,
                categories,
                unsubscribeToken: crypto.randomBytes(32).toString('hex')
            });
        }

        await subscriber.save();
        res.status(201).json({
            message: 'Abonnement réussi',
            subscriber
        });
    } catch (error) {
        console.error('Erreur abonnement:', error);
        res.status(500).json({ message: 'Erreur lors de l\'abonnement' });
    }
};

// Se désabonner de la newsletter
exports.unsubscribe = async (req, res) => {
    try {
        const { token } = req.params;
        const subscriber = await Subscriber.findOne({ unsubscribeToken: token });

        if (!subscriber) {
            return res.status(404).json({ message: 'Token invalide' });
        }

        subscriber.status = 'unsubscribed';
        await subscriber.save();

        res.json({ message: 'Désabonnement réussi' });
    } catch (error) {
        console.error('Erreur désabonnement:', error);
        res.status(500).json({ message: 'Erreur lors du désabonnement' });
    }
};

// Envoyer une newsletter
exports.sendNewsletter = async (req, res) => {
    try {
        const newsletter = await Newsletter.findById(req.params.id);

        if (!newsletter) {
            return res.status(404).json({ message: 'Newsletter non trouvée' });
        }

        if (newsletter.status === 'sent') {
            return res.status(400).json({ message: 'Newsletter déjà envoyée' });
        }

        // Trouver tous les abonnés actifs
        const subscribers = await Subscriber.find({
            status: 'active',
            categories: { 
                $in: [newsletter.category, 'all']
            }
        });

        // Ici, vous devriez implémenter l'envoi réel des emails
        // Pour l'instant, on simule l'envoi
        const sentTo = subscribers.map(subscriber => ({
            email: subscriber.email,
            status: 'sent',
            sentAt: new Date()
        }));

        newsletter.status = 'sent';
        newsletter.sentDate = new Date();
        newsletter.sentTo = sentTo;
        await newsletter.save();

        res.json({
            message: 'Newsletter envoyée avec succès',
            sentCount: sentTo.length
        });
    } catch (error) {
        console.error('Erreur envoi newsletter:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de la newsletter' });
    }
};

// Obtenir les statistiques d'une newsletter
exports.getNewsletterStats = async (req, res) => {
    try {
        const newsletter = await Newsletter.findById(req.params.id);

        if (!newsletter) {
            return res.status(404).json({ message: 'Newsletter non trouvée' });
        }

        const stats = {
            total: newsletter.sentTo.length,
            sent: newsletter.sentTo.filter(s => s.status === 'sent').length,
            failed: newsletter.sentTo.filter(s => s.status === 'failed').length,
            opened: newsletter.sentTo.filter(s => s.status === 'opened').length,
            openRate: 0
        };

        if (stats.total > 0) {
            stats.openRate = (stats.opened / stats.total) * 100;
        }

        res.json(stats);
    } catch (error) {
        console.error('Erreur statistiques newsletter:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};
