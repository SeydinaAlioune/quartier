const User = require('../models/user.model');
const Post = require('../models/post.model');
const Event = require('../models/event.model');
const Project = require('../models/project.model');
const Business = require('../models/business.model');
const { DonationCampaign, Donation } = require('../models/donation.model');
const Media = require('../models/media.model');
const { Newsletter, Subscriber } = require('../models/newsletter.model');
const Notification = require('../models/notification.model');

// Obtenir les statistiques du tableau de bord
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = {
            users: await User.countDocuments(),
            posts: await Post.countDocuments(),
            events: await Event.countDocuments()
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour le rôle d'un utilisateur
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['user', 'moderator', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Rôle invalide' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour le statut d'un utilisateur (actif/inactif)
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir la liste des utilisateurs
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
};

// Mettre à jour le rôle d'un utilisateur
exports.updateUserRoleOld = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle' });
    }
};

// Obtenir la gestion du contenu
exports.getContentManagement = async (req, res) => {
    try {
        const content = {
            posts: await Post.find().populate('author', 'name'),
            events: await Event.find().populate('organizer', 'name')
        };
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du contenu' });
    }
};

// Modérer le contenu
exports.moderateContent = async (req, res) => {
    try {
        const { contentType, contentId, action } = req.body;
        let content;

        switch (contentType) {
            case 'post':
                content = await Post.findByIdAndUpdate(
                    contentId,
                    { status: action },
                    { new: true }
                );
                break;
            case 'event':
                content = await Event.findByIdAndUpdate(
                    contentId,
                    { status: action },
                    { new: true }
                );
                break;
            default:
                return res.status(400).json({ message: 'Type de contenu invalide' });
        }

        if (!content) {
            return res.status(404).json({ message: 'Contenu non trouvé' });
        }

        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la modération du contenu' });
    }
};

// Obtenir la gestion des médias
exports.getMediaManagement = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des médias' });
    }
};

// Obtenir les rapports de sécurité
exports.getSecurityReports = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports' });
    }
};

// Obtenir la gestion des collectes de fonds
exports.getFundraisingManagement = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des collectes' });
    }
};

// Obtenir les analytics
exports.getAnalytics = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des analytics' });
    }
};

// Obtenir les notifications
exports.getNotifications = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
    }
};

// Obtenir les paramètres du site
exports.getSiteSettings = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des paramètres' });
    }
};

// Mettre à jour les paramètres du site
exports.updateSiteSettings = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres' });
    }
};

// Sauvegarder la base de données
exports.backupDatabase = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la sauvegarde' });
    }
};

// Obtenir les logs système
exports.getSystemLogs = async (req, res) => {
    try {
        // Implémentation à venir
        res.json({ message: 'Fonctionnalité à venir' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des logs' });
    }
};

module.exports = exports;
