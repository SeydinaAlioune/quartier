const Notification = require('../models/notification.model');

// Créer une notification
exports.createNotification = async (req, res) => {
    try {
        const notification = new Notification({
            ...req.body,
            recipient: req.body.recipient || req.user._id
        });
        await notification.save();
        
        // Ici, vous pourriez implémenter une logique de notification en temps réel
        // par exemple avec Socket.io

        res.status(201).json({
            message: 'Notification créée avec succès',
            notification
        });
    } catch (error) {
        console.error('Erreur création notification:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la notification' });
    }
};

// Obtenir les notifications d'un utilisateur
exports.getUserNotifications = async (req, res) => {
    try {
        const {
            read,
            type,
            sort = '-createdAt',
            page = 1,
            limit = 20
        } = req.query;

        const query = { recipient: req.user._id };
        if (read !== undefined) query.read = read === 'true';
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            read: false
        });

        res.json({
            notifications,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            unreadCount
        });
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
    }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            message: 'Notification marquée comme lue',
            notification
        });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({ message: 'Erreur lors du marquage de la notification' });
    }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                read: false
            },
            {
                $set: {
                    read: true,
                    readAt: new Date()
                }
            }
        );

        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error('Erreur marquage notifications:', error);
        res.status(500).json({ message: 'Erreur lors du marquage des notifications' });
    }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        await notification.remove();
        res.json({ message: 'Notification supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression notification:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la notification' });
    }
};

// Service utilitaire pour créer des notifications système
exports.createSystemNotification = async (recipientId, title, message, metadata = {}) => {
    try {
        const notification = new Notification({
            recipient: recipientId,
            type: 'system_notification',
            title,
            message,
            priority: 'normal',
            metadata
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Erreur création notification système:', error);
        throw error;
    }
};
